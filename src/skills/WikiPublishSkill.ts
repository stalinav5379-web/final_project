import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';

export class WikiPublishSkill implements AgentSkill {
  name(): string {
    return 'WikiPublish';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const token = process.env.GITHUB_TOKEN ?? '';
    const repo = process.env.GITHUB_REPO ?? '';

    if (!token) throw new Error('GITHUB_TOKEN is not set in .env');
    if (!repo) throw new Error('GITHUB_REPO is not set in .env (format: owner/repo)');

    const reportPath = path.resolve('generated/final_report.md');
    if (!fs.existsSync(reportPath)) {
      console.log('  No final_report.md found — skipping wiki publish.');
      return;
    }

    const baseReport = fs.readFileSync(reportPath, 'utf-8');

    const repo2 = process.env.GITHUB_REPO ?? '';
    const runDatetime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const links = [
      '',
      '---',
      '## Links',
      `- **Run date:** ${runDatetime} UTC`,
      ctx.prUrl ? `- **Pull Request:** [${ctx.prUrl}](${ctx.prUrl})` : '',
      `- **Allure Report:** GitHub Actions → [Actions](https://github.com/${repo2}/actions) → latest run → Artifacts → \`allure-report\``,
      `- **Repository:** [${repo2}](https://github.com/${repo2})`,
    ].filter(Boolean).join('\n');

    const report = baseReport + links;
    const wikiUrl = `https://${token}@github.com/${repo}.wiki.git`;
    const tmpDir = path.join(os.tmpdir(), `wiki-${Date.now()}`);

    console.log('  Cloning wiki repository...');
    this.exec(`git clone ${wikiUrl} "${tmpDir}"`);

    const pageFile = path.join(tmpDir, 'AI-QA-Pipeline-Report.md');
    fs.writeFileSync(pageFile, report, 'utf-8');

    const date = new Date().toISOString().slice(0, 10);
    this.exec(`git -C "${tmpDir}" add AI-QA-Pipeline-Report.md`);
    this.exec(`git -C "${tmpDir}" diff --cached --quiet || git -C "${tmpDir}" commit -m "docs: update QA pipeline report [${date}]"`);
    this.exec(`git -C "${tmpDir}" push`);

    fs.rmSync(tmpDir, { recursive: true, force: true });

    const wikiPageUrl = `https://github.com/${repo}/wiki/AI-QA-Pipeline-Report`;
    console.log(`  Report published → ${wikiPageUrl}`);
  }

  private exec(cmd: string): string {
    try {
      return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    } catch (err: unknown) {
      const out =
        err && typeof err === 'object' && 'stderr' in err
          ? String((err as { stderr: string }).stderr)
          : String(err);
      throw new Error(`Command failed: ${out.slice(0, 500)}`);
    }
  }
}
