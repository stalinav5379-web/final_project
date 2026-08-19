import { spawn } from 'child_process';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';

export class TestRunSkill implements AgentSkill {
  name(): string {
    return 'TestRun';
  }

  async execute(ctx: AgentContext): Promise<void> {
    console.log('  Running Playwright tests...\n');

    const { log, exitCode } = await this.runTests();
    ctx.testRunLog = log;

    const passed = (log.match(/\d+ passed/)?.[0]) ?? '';
    const failed = (log.match(/\d+ failed/)?.[0]) ?? '';
    const status = exitCode === 0 ? '✅ All tests passed' : '❌ Some tests failed';

    console.log(`\n  ${status}${passed ? ' — ' + passed : ''}${failed ? ', ' + failed : ''}`);

    if (exitCode !== 0) {
      console.log('  Test failures detected — pipeline continues to generate bug report.');
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
