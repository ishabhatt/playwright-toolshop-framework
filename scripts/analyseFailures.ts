import { TextCitation } from '@anthropic-ai/sdk/resources.js';
import * as fs from 'fs';
import * as path from 'path';

// ── Shared provider interface ─────────────────────────────────────────────────
// Both Anthropic and OpenAI implementations satisfy this shape,
// keeping the main() function provider-agnostic.
interface LLMProvider {
  name: string;
  analyse: (prompt: string) => Promise<string>;
}

// ── Anthropic provider ────────────────────────────────────────────────────────
async function buildAnthropicProvider(): Promise<LLMProvider> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  return {
    name: 'Claude (Anthropic)',
    analyse: async (prompt: string): Promise<string> => {
      // stream: false narrows the overload return type to Message (not Stream | Message)
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      });

      // With stream: false the return type is Message, so response.content is ContentBlock[]
      // Use a type guard to safely extract only TextBlock entries
      return response.content
        .filter(
          (
            block,
          ): block is {
            type: 'text';
            text: string;
            citations: TextCitation[] | null;
          } => block.type === 'text',
        )
        .map((block) => block.text)
        .join('\n');
    },
  };
}

// ── OpenAI provider ───────────────────────────────────────────────────────────
async function buildOpenAIProvider(): Promise<LLMProvider> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return {
    name: 'GPT-4o (OpenAI)',
    analyse: async (prompt: string): Promise<string> => {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices
        .map((choice) => choice.message.content ?? '')
        .join('\n');
    },
  };
}

// ── Provider selection ────────────────────────────────────────────────────────
// Reads AI_PROVIDER env var (default: anthropic).
// Falls back gracefully if the preferred provider key is missing.
async function selectProvider(): Promise<LLMProvider | null> {
  const preference = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase();

  if (preference === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        'AI_PROVIDER=openai but OPENAI_API_KEY is not set. Trying Anthropic fallback.',
      );
    } else {
      return buildOpenAIProvider();
    }
  }

  // Default: Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    return buildAnthropicProvider();
  }

  // OpenAI as fallback if only that key is set
  if (process.env.OPENAI_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — falling back to OpenAI.');
    return buildOpenAIProvider();
  }

  return null; // no provider available
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FailedTest {
  suite: string;
  name: string;
  duration: string;
  message: string;
  stack: string;
}

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

// ── Parse JUnit XML produced by Playwright ────────────────────────────────────
function parseFailures(junitPath: string): FailedTest[] {
  if (!fs.existsSync(junitPath)) {
    console.log(`No JUnit report found at ${junitPath} — nothing to analyse.`);
    return [];
  }

  const xml = fs.readFileSync(junitPath, 'utf-8');
  const failures: FailedTest[] = [];

  const testcaseRegex = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
  const failureRegex =
    /<failure[^>]*message="([^"]*)"[^>]*>([\s\S]*?)<\/failure>/;

  let match: RegExpExecArray | null;
  while ((match = testcaseRegex.exec(xml)) !== null) {
    const [, testcaseAttrs, body] = match;
    const failMatch = failureRegex.exec(body);
    if (failMatch) {
      failures.push({
        suite: attr(testcaseAttrs, 'classname').replace(/\s+/g, ' ').trim(),
        name: attr(testcaseAttrs, 'name').replace(/\s+/g, ' ').trim(),
        duration: attr(testcaseAttrs, 'time'),
        message: decodeXml(failMatch[1]),
        stack: failMatch[2]
          .replace(/<!\[CDATA\[|\]\]>/g, '')
          .trim()
          .slice(0, 800),
      });
    }
  }

  return failures;
}

// ── Build the analysis prompt ─────────────────────────────────────────────────
function buildPrompt(failures: FailedTest[]): string {
  const formatted = failures
    .map(
      (f, i) =>
        `FAILURE ${i + 1}:
  Suite:    ${f.suite}
  Test:     ${f.name}
  Duration: ${f.duration}s
  Message:  ${f.message}
  Stack:
${f.stack}
`,
    )
    .join('\n---\n');

  return `You are a senior QA engineer analysing Playwright test failures.

Below are ${failures.length} test failure(s) from a CI run against the Practice Software Testing Toolshop — an e-commerce application with a REST API backend.

${formatted}

Provide a structured analysis with these sections:

1. SUMMARY
   One sentence per failure: test name → likely root cause.

2. ROOT CAUSE GROUPS
   Group failures by likely shared root cause (e.g. "Auth token expired", "Selector changed", "API timeout", "Test data collision"). For each group explain WHY tests failed and whether it is a product bug, test bug, or environment issue.

3. RECOMMENDED ACTIONS
   Specific, actionable fixes for each group. For test bugs suggest the code fix. For product bugs suggest what to investigate. For environment issues suggest what to check.

4. RISK ASSESSMENT
   Which failures, if not fixed, pose the highest risk to production quality? Why?

Be concise. Use plain language. Do not repeat the stack traces.`;
}

// ── Write markdown report ─────────────────────────────────────────────────────
function writeReport(
  content: string,
  outputPath: string,
  providerName: string,
): void {
  const report = [
    '# AI Failure Analysis Report',
    `Generated: ${new Date().toLocaleString()}`,
    `Provider:  ${providerName}`,
    '',
    '---',
    '',
    content,
    '',
    '---',
    `*Generated by scripts/analyseFailures.ts using ${providerName}*`,
  ].join('\n');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf-8');
  console.log(`\n── Report written to: ${outputPath}`);
}

function buildFallbackReport(
  failures: FailedTest[],
  providerName: string,
  errorMessage: string,
): string {
  const summary = failures
    .map(
      (failure) =>
        `- ${failure.name} -> ${failure.message || 'See stack excerpt below.'}`,
    )
    .join('\n');

  const details = failures
    .map(
      (failure, index) =>
        `## Failure ${index + 1}

Suite: ${failure.suite}
Test: ${failure.name}
Duration: ${failure.duration}s
Message: ${failure.message}

\`\`\`text
${failure.stack}
\`\`\`
`,
    )
    .join('\n');

  return `## SUMMARY
${summary}

## FALLBACK REASON
AI-assisted analysis could not be completed with ${providerName}.
Error: ${errorMessage}

## NEXT STEPS
- Review \`test-results/junit.xml\` for structured failure output
- Open Playwright attachments from \`test-results/\`
- Use \`npm run triage:failures\` for deterministic local triage
- Re-run AI analysis after resolving provider/network/quota issues

## FAILURE DETAILS

${details}`.trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const junitPath = path.resolve('test-results/junit.xml');
  const reportPath = path.resolve('test-results/ai-failure-analysis.md');

  console.log('\n── AI Failure Analysis ─────────────────────────────────────');

  const provider = await selectProvider();

  if (!provider) {
    console.warn(
      'No LLM API key found (ANTHROPIC_API_KEY or OPENAI_API_KEY). Skipping AI analysis.',
    );
    console.warn(
      'Set AI_PROVIDER=anthropic|openai and the corresponding API key to enable this feature.',
    );
    return;
  }

  console.log(`Using provider: ${provider.name}`);

  const failures = parseFailures(junitPath);

  if (failures.length === 0) {
    console.log('✓ No failures found — all tests passed.');
    return;
  }

  console.log(
    `Found ${failures.length} failure(s). Sending to ${provider.name} for analysis...`,
  );

  const prompt = buildPrompt(failures);

  try {
    const analysis = await provider.analyse(prompt);

    console.log('\n' + '─'.repeat(60));
    console.log(analysis);
    console.log('─'.repeat(60) + '\n');

    writeReport(analysis, reportPath, provider.name);
  } catch (error) {
    // Never fail the CI pipeline because of this script
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(
      `AI analysis failed (${provider.name}):`,
      errorMessage,
    );
    const fallbackReport = buildFallbackReport(
      failures,
      provider.name,
      errorMessage,
    );
    writeReport(fallbackReport, reportPath, `${provider.name} (fallback)`);
    console.log('Continuing without AI analysis.');
  }
}

main().catch((err) => {
  console.error('Unexpected error in analyseFailures:', err);
  process.exit(0); // exit 0 — do not break CI
});
