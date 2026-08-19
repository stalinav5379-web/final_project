import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';
import { JsonExtractor } from '../orchestrator/JsonExtractor';

interface TestCase {
  id: string;
  title: string;
  type: string;
  steps: string[];
  expected: string;
}

export class TestcaseGenerationSkill implements AgentSkill {
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();
  private readonly extractor = new JsonExtractor();

  name(): string {
    return 'TestcaseGeneration';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const prompt = this.engine.fill(path.resolve('prompts/02_testcases.txt'), {
      SCENARIOS: ctx.scenarios,
    });

    console.log('  Generating testcases JSON via Mistral...');

    const response = await this.client.chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, maxTokens: 8192 },
    );

    const parsed = this.extractor.extract(response);
    const testcases = parsed['testcases'] as TestCase[];

    if (!Array.isArray(testcases) || testcases.length === 0) {
      throw new Error('LLM returned empty or invalid testcases array');
    }

    for (const tc of testcases) {
      const missing = ['id', 'title', 'type', 'steps', 'expected'].filter((f) => !(f in tc));
      if (missing.length > 0) {
        throw new Error(`Testcase missing fields [${missing.join(', ')}]: ${JSON.stringify(tc)}`);
      }
      if (!Array.isArray(tc.steps) || tc.steps.length === 0) {
        throw new Error(`Testcase ${tc.id} has empty steps array`);
      }
    }

    ctx.testcases = testcases as unknown as Record<string, unknown>[];

    const outputPath = path.resolve('generated/testcases.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({ testcases }, null, 2), 'utf-8');

    console.log(`  ${testcases.length} testcases saved → generated/testcases.json`);
  }
}
