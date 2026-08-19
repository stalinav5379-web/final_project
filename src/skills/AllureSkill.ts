import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';

interface AllureResult {
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  statusDetails?: { message?: string; trace?: string };
}

export class AllureSkill implements AgentSkill {
  name(): string {
    return 'Allure';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const resultsDir = path.resolve('allure-results');

    if (!fs.existsSync(resultsDir) || fs.readdirSync(resultsDir).length === 0) {
      console.log('  No allure-results found — skipping Allure report generation.');
      return;
    }

    console.log('  Generating Allure HTML report...');
    try {
      execSync('npx allure generate allure-results --clean -o allure-report', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      console.log('  Report generated → allure-report/');
    } catch {
      console.warn('  Allure generate failed — continuing with raw results only.');
    }

    ctx.allureJson = this.aggregateResults(resultsDir);

    const { passed, failed, broken, skipped } = ctx.allureJson as Record<string, unknown>;
    console.log(`  Results: ✅ ${passed} passed, ❌ ${failed} failed, ⚠️ ${broken} broken, ⏭️ ${skipped} skipped`);
  }

  private aggregateResults(resultsDir: string): Record<string, unknown> {
    const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith('-result.json'));

    const counts = { passed: 0, failed: 0, broken: 0, skipped: 0 };
    const failures: Array<{ name: string; message: string }> = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(resultsDir, file), 'utf-8');
        const result = JSON.parse(raw) as AllureResult;
        const status = result.status ?? 'broken';

        if (status in counts) counts[status as keyof typeof counts]++;

        if (status === 'failed' || status === 'broken') {
          failures.push({
            name: result.name ?? file,
            message: result.statusDetails?.message ?? 'No error message',
          });
        }
      } catch {
        // skip malformed result files
      }
    }

    return { ...counts, total: files.length, failures };
  }
}
