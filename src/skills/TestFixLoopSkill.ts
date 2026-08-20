import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';
import { getSpecFilePath } from '../orchestrator/PageConfig';

const MAX_ROUNDS = 3;

export class TestFixLoopSkill implements AgentSkill {
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();

  name(): string {
    return 'TestFixLoop';
  }

  async execute(ctx: AgentContext): Promise<void> {
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      this.clearAllureResults();
      console.log(`\n  ── Round ${round}/${MAX_ROUNDS}: running tests...`);

      const { log, exitCode } = await this.runTests();
      ctx.testRunLog = log;

      const passed = log.match(/\d+ passed/)?.[0] ?? '';
      const failed = log.match(/\d+ failed/)?.[0] ?? '';

      if (exitCode === 0) {
        console.log(`  ✅ All tests passed${passed ? ' — ' + passed : ''} — ready to push.`);
        return;
      }

      console.log(`  ❌ ${failed || 'some tests failed'}${passed ? ', ' + passed : ''}`);

      if (round === MAX_ROUNDS) {
        console.warn(`  ⚠️  Reached max rounds (${MAX_ROUNDS}) — pushing with remaining failures.`);
        return;
      }

      console.log(`  Sending failure log to Mistral for analysis and fix...`);
      const fixedSpec = await this.requestFix(log, ctx);

      if (!fixedSpec) {
        console.warn(`  Could not extract a valid fixed spec — retrying with current code.`);
        continue;
      }

      const specPath = path.resolve(getSpecFilePath());
      fs.writeFileSync(specPath, fixedSpec, 'utf-8');
      ctx.generatedSpec = fixedSpec;
      console.log(`  Spec updated → ${getSpecFilePath()} — re-running tests...`);
    }
  }

  private async requestFix(testLog: string, ctx: AgentContext): Promise<string | null> {
    const prompt = this.engine.fill(path.resolve('prompts/05c_test_fix.txt'), {
      TEST_LOG: testLog,
      SPEC: ctx.generatedSpec,
      PAGE_OBJECT: ctx.generatedPageObject,
    });

    const raw = await this.client.chat([{ role: 'user', content: prompt }], {
      temperature: 0.1,
      maxTokens: 8192,
    });

    const code = this.stripMarkdown(raw);
    const error = this.validate(code);

    if (error) {
      console.warn(`  Validation failed: ${error}`);
      return null;
    }

    return code;
  }

  private stripMarkdown(raw: string): string {
    const match = raw.match(/```(?:typescript|ts)?\s*\n([\s\S]*?)\n?```/);
    return match?.[1]?.trim() ?? raw.trim();
  }

  private validate(code: string): string | null {
    if (code.length < 50) return 'Output too short';
    if (code.includes('```')) return 'Contains markdown fences';
    if (!code.includes('import')) return 'Missing imports';
    if (!code.includes('describe(')) return 'Missing describe() block';
    return null;
  }

  private clearAllureResults(): void {
    const dir = path.resolve('allure-results');
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((f) => fs.rmSync(path.join(dir, f), { recursive: true }));
      console.log('  Cleared allure-results/ before test run.');
    }
  }

  private runTests(): Promise<{ log: string; exitCode: number }> {
    return new Promise((resolve) => {
      const chunks: string[] = [];

      const child = spawn('npx', ['playwright', 'test'], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        process.stdout.write(text);
        chunks.push(text);
      });

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        process.stderr.write(text);
        chunks.push(text);
      });

      child.on('close', (code) => {
        resolve({ log: chunks.join('').trim(), exitCode: code ?? 0 });
      });
    });
  }
}
