import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';
import { JsonExtractor } from '../orchestrator/JsonExtractor';

export class BugReportSkill implements AgentSkill {
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();
  private readonly extractor = new JsonExtractor();

  name(): string {
    return 'BugReport';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const hasFailed = this.hasFailures(ctx.testRunLog);

    if (!hasFailed) {
      console.log('  All tests passed — no bug report needed.');
      ctx.bugReport = JSON.stringify({ status: 'NO_BUGS_FOUND' });
      return;
    }

    console.log('  Test failures detected — generating bug report...');

    const allureStr = JSON.stringify(ctx.allureJson, null, 2);
    const prompt = this.engine.fill(path.resolve('prompts/06_bug_report.txt'), {
      TEST_RUN_LOG: ctx.testRunLog.slice(0, 8000),
      ALLURE_RESULTS: allureStr.slice(0, 4000),
    });

    const raw = await this.client.chat([{ role: 'user', content: prompt }], {
      temperature: 0.1,
      maxTokens: 4096,
    });

    const parsed = this.extractor.extract(raw);
    ctx.bugReport = JSON.stringify(parsed, null, 2);

    const outputPath = path.resolve('generated/bug_report.json');
    fs.writeFileSync(outputPath, ctx.bugReport, 'utf-8');

    const bugs = Array.isArray(parsed.bugs) ? parsed.bugs.length : 0;
    const status = (parsed as { status?: string }).status;

    if (status === 'NO_BUGS_FOUND') {
      console.log('  No bugs found per AI analysis.');
    } else {
      console.log(`  Bug report saved → generated/bug_report.json (${bugs} bug(s) found)`);
    }
  }

  private hasFailures(log: string): boolean {
    return /\d+ failed/.test(log) || /✘/.test(log);
  }
}
