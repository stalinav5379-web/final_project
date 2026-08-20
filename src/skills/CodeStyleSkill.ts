import { execSync } from 'child_process';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { getPageObjectFilePath, getSpecFilePath } from '../orchestrator/PageConfig';

export class CodeStyleSkill implements AgentSkill {
  name(): string {
    return 'CodeStyle';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const targets = `${getPageObjectFilePath()} ${getSpecFilePath()}`;
    this.runPrettier(targets);
    ctx.lintOutput = this.runEslint(targets);
    console.log(`  Lint output saved (${ctx.lintOutput.length} chars)`);
  }

  private runPrettier(targets: string): void {
    console.log('  Running Prettier...');
    try {
      execSync(`npx prettier --write ${targets}`, { encoding: 'utf-8', stdio: 'pipe' });
      console.log('  Prettier: formatted');
    } catch (err: unknown) {
      console.warn('  Prettier warning:', this.extractMessage(err).slice(0, 200));
    }
  }

  private runEslint(targets: string): string {
    console.log('  Running ESLint...');
    try {
      execSync(`npx eslint ${targets}`, { encoding: 'utf-8', stdio: 'pipe' });
      console.log('  ESLint: no issues found');
      return 'ESLint: no issues found';
    } catch (err: unknown) {
      const output = this.extractOutput(err);
      if (!output) {
        throw new Error(`ESLint failed to run: ${this.extractMessage(err)}`);
      }
      console.log(`  ESLint: issues found (${output.length} chars)`);
      return output;
    }
  }

  private extractOutput(err: unknown): string {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      const out = String(e['stdout'] ?? e['stderr'] ?? '').trim();
      return out;
    }
    return '';
  }

  private extractMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }
}
