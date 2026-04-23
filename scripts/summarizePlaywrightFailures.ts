import * as fs from 'fs';
import * as path from 'path';

type Failure = {
  classname: string;
  name: string;
  time: string;
  message: string;
  body: string;
  artifacts: string[];
};

const junitPath = path.resolve(process.argv[2] ?? 'test-results/junit.xml');

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function attr(source: string, name: string): string {
  const match = source.match(new RegExp(`${name}="([^"]*)"`));
  return match ? decodeXml(match[1]) : '';
}

function classify(body: string): string {
  const categories = [
    [
      /getByTestId|locator|toBeVisible|element\(s\) not found|TimeoutError: locator/i,
      'selector/test code',
    ],
    [/auth-token|storageState|nav-menu|logged|login/i, 'auth/session'],
    [/route|mock|intercept|page\.goto: Timeout/i, 'network/mock'],
    [/toHaveScreenshot|ARIA|accessibility|snapshot/i, 'visual/a11y'],
    [
      /API|cart|product|created data|cart_items|Adjustable Wrench/i,
      'API/data or product behavior',
    ],
  ] as const;

  const matches = categories
    .filter(([pattern]) => pattern.test(body))
    .map(([, category]) => category);

  return matches.length > 0
    ? [...new Set(matches)].join(' + ')
    : 'unclassified';
}

function notableErrors(body: string): string[] {
  const ansiPattern = new RegExp(String.raw`\u001b\[[0-9;]*m`, 'g');
  const lines = body
    .replace(ansiPattern, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const errors = lines.filter((line) =>
    /^(Error:|TimeoutError|Test timeout)/.test(line),
  );
  return [...new Set(errors)].slice(0, 4);
}

function sourceLine(body: string): string | null {
  const match = body.match(/\s+at (\/.+?:\d+:\d+)/);
  if (match) return match[1];

  const pointerIndex = body
    .split(/\r?\n/)
    .findIndex((line) => line.includes('>') && /:\d+\s*\|/.test(line));
  if (pointerIndex >= 0) return body.split(/\r?\n/)[pointerIndex].trim();

  return null;
}

if (!fs.existsSync(junitPath)) {
  console.error(`No JUnit report found at ${junitPath}`);
  process.exit(1);
}

const xml = fs.readFileSync(junitPath, 'utf-8');
const testsuitesMatch = xml.match(/<testsuites\b([^>]*)>/);
const total = testsuitesMatch ? attr(testsuitesMatch[1], 'tests') : '?';
const failuresCount = testsuitesMatch
  ? attr(testsuitesMatch[1], 'failures')
  : '?';
const time = testsuitesMatch ? attr(testsuitesMatch[1], 'time') : '?';
const failures: Failure[] = [];

const testcaseRegex = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
let testcaseMatch: RegExpExecArray | null;

while ((testcaseMatch = testcaseRegex.exec(xml)) !== null) {
  const [, testcaseAttrs, testcaseBody] = testcaseMatch;
  const failureMatch = testcaseBody.match(
    /<failure\b([^>]*)>([\s\S]*?)<\/failure>/,
  );
  if (!failureMatch) continue;

  const body = failureMatch[2].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
  const artifacts = [
    ...testcaseBody.matchAll(/\[\[ATTACHMENT\|([^\]]+)\]\]/g),
  ].map((match) => match[1]);

  failures.push({
    classname: attr(testcaseAttrs, 'classname'),
    name: attr(testcaseAttrs, 'name'),
    time: attr(testcaseAttrs, 'time'),
    message: attr(failureMatch[1], 'message'),
    body,
    artifacts,
  });
}

const passed = Number(total) - Number(failuresCount);
console.log(
  `Result: ${Number.isNaN(passed) ? '?' : passed} passed, ${failuresCount} failed, ${time}s`,
);

if (failures.length === 0) {
  console.log('No failures found.');
  process.exit(0);
}

console.log('\nFailed:');
for (const failure of failures) {
  console.log(`- ${failure.classname} :: ${failure.name}`);
  console.log(`  Duration: ${failure.time}s`);
  const errors = notableErrors(failure.body);
  console.log(`  Reason: ${errors[0] ?? 'No error text found.'}`);
  for (const error of errors.slice(1)) {
    console.log(`  Also: ${error}`);
  }
  console.log(`  Root cause category: ${classify(failure.body)}`);
  const line = sourceLine(failure.body);
  if (line) console.log(`  Source: ${line}`);
  if (failure.artifacts.length > 0) {
    console.log(`  Artifacts:`);
    for (const artifact of failure.artifacts) {
      console.log(`  - test-results/${artifact}`);
    }
  }
}
