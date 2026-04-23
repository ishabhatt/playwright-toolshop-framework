import * as fs from 'fs';
import * as path from 'path';

type TestEntry = {
  file: string;
  line: number;
  title: string;
  tags: string[];
};

const testRoot = path.resolve('tests');
const tagFilter = process.argv
  .find((arg) => arg.startsWith('--tag='))
  ?.replace('--tag=', '');

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.(spec|test)\.ts$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function extractTags(line: string): string[] {
  const tagMatch = line.match(/tag\s*:\s*\[([^\]]*)\]/);
  if (!tagMatch) return [];

  return [...tagMatch[1].matchAll(/['"](@[^'"]+)['"]/g)].map(
    (match) => match[1],
  );
}

function extractConstStringArray(lines: string[], name: string): string[] {
  const startIndex = lines.findIndex((line) =>
    new RegExp(`const\\s+${name}\\s*=\\s*\\[`).test(line),
  );
  if (startIndex < 0) return [];

  const values: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes(']')) break;
    const value = line.match(/['"]([^'"]+)['"]/);
    if (value) values.push(value[1]);
  }

  return values;
}

function extractTitle(line: string): string | null {
  const testMatch = line.match(/\b(?:test|setup)\s*\(\s*(['"`])(.+?)\1/);
  if (testMatch) return testMatch[2];

  const templateMatch = line.match(/\b(?:test|setup)\s*\(\s*`(.+?)`/);
  if (templateMatch) return templateMatch[1];

  return null;
}

function collectTests(filePath: string): TestEntry[] {
  const relativePath = path.relative(process.cwd(), filePath);
  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  const activeTags: string[] = [];
  const tests: TestEntry[] = [];
  const categories = extractConstStringArray(lines, 'categories');

  lines.forEach((line, index) => {
    const lineTags = extractTags(line);
    if (lineTags.length > 0 && line.includes('test.describe')) {
      activeTags.splice(0, activeTags.length, ...lineTags);
    }

    const title = extractTitle(line);
    if (!title || line.includes('test.describe')) return;
    const mergedTags = [...new Set([...activeTags, ...lineTags])];

    if (title.includes('${category}') && categories.length > 0) {
      for (const category of categories) {
        tests.push({
          file: relativePath,
          line: index + 1,
          title: title.replace('${category}', category),
          tags: mergedTags,
        });
      }
      return;
    }

    tests.push({
      file: relativePath,
      line: index + 1,
      title,
      tags: mergedTags,
    });
  });

  return tests;
}

const tests = walk(testRoot)
  .sort()
  .flatMap(collectTests)
  .filter((test) => !tagFilter || test.tags.includes(tagFilter));

if (tests.length === 0) {
  console.log(
    tagFilter ? `No tests found for ${tagFilter}.` : 'No tests found.',
  );
  process.exit(0);
}

const byTag = new Map<string, TestEntry[]>();
const untagged: TestEntry[] = [];

for (const test of tests) {
  if (test.tags.length === 0) {
    untagged.push(test);
    continue;
  }

  for (const tag of test.tags) {
    if (tagFilter && tag !== tagFilter) continue;
    const group = byTag.get(tag) ?? [];
    group.push(test);
    byTag.set(tag, group);
  }
}

for (const [tag, taggedTests] of [...byTag.entries()].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  console.log(`\n${tag} (${taggedTests.length})`);
  for (const test of taggedTests) {
    console.log(`- ${test.file}:${test.line} ${test.title}`);
  }
}

if (!tagFilter && untagged.length > 0) {
  console.log(`\nuntagged (${untagged.length})`);
  for (const test of untagged) {
    console.log(`- ${test.file}:${test.line} ${test.title}`);
  }
}
