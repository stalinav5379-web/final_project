import * as https from 'https';
import { execSync } from 'child_process';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';

export class GitSkill implements AgentSkill {
  name(): string {
    return 'Git';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toISOString().slice(11, 16).replace(':', '');
    const branch = `qa/auto-tests-${date}-${time}`;

    console.log(`  Creating branch: ${branch}`);
    this.exec(`git checkout -B ${branch}`);

    console.log('  Staging generated files...');
    this.exec('git add generated/LoginPage.ts generated/login.spec.ts');

    console.log('  Committing...');
    this.exec('git commit -m "feat: add AI-generated Playwright tests for login page"');

    console.log('  Pushing...');
    this.exec(`git push -u origin ${branch}`);

    console.log('  Creating PR via GitHub API...');
    ctx.prUrl = await this.createPullRequest(branch, date, ctx);
    console.log(`  PR created: ${ctx.prUrl}`);
  }

  private async createPullRequest(branch: string, date: string, ctx: AgentContext): Promise<string> {
    const token = process.env.GITHUB_TOKEN ?? '';
    const repo = process.env.GITHUB_REPO ?? '';

    if (!token) throw new Error('GITHUB_TOKEN is not set in .env');
    if (!repo) throw new Error('GITHUB_REPO is not set in .env (format: owner/repo)');

    const body = JSON.stringify({
      title: `feat: AI-generated login tests [${date}]`,
      body: this.buildPrBody(ctx),
      head: branch,
      base: 'main',
    });

    const [owner, repoName] = repo.split('/');
    const response = await this.post(`/repos/${owner}/${repoName}/pulls`, body, token) as Record<string, unknown>;

    if (response.html_url) return response.html_url as string;

    // PR already exists — find and return its URL
    const isAlreadyExists =
      response.status === '422' &&
      JSON.stringify(response).includes('pull request already exists');

    if (isAlreadyExists) {
      console.log('  PR already exists for this branch — fetching existing PR URL...');
      return await this.findExistingPr(owner, repoName, branch, token);
    }

    throw new Error(`GitHub API error: ${JSON.stringify(response)}`);
  }

  private async findExistingPr(owner: string, repo: string, branch: string, token: string): Promise<string> {
    const response = await this.get(
      `/repos/${owner}/${repo}/pulls?head=${owner}:${branch}&state=open`,
      token,
    ) as Array<{ html_url: string }>;

    const url = response[0]?.html_url;
    if (!url) throw new Error(`Could not find existing PR for branch ${branch}`);
    return url;
  }

  private get(apiPath: string, token: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.github.com',
          path: apiPath,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'qa-pipeline',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer) => { data += chunk; });
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`)); }
          });
        },
      );
      req.on('error', reject);
      req.end();
    });
  }

  private post(apiPath: string, body: string, token: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.github.com',
          path: apiPath,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'qa-pipeline',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error(`Failed to parse GitHub API response: ${data.slice(0, 200)}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private buildPrBody(ctx: AgentContext): string {
    const reviewSummary =
      ctx.codeReview.split('\n').find((l) => l.startsWith('Overall:')) ??
      'AI code review completed';

    const stepList = ctx.steps
      .map((s) => `- [${s.status === 'PASSED' ? 'x' : ' '}] ${s.name} — ${s.status}`)
      .join('\n');

    return [
      '## AI-Generated Playwright Tests',
      '',
      'This PR was created automatically by the AI-Driven QA Pipeline.',
      '',
      '### Generated files',
      '- `generated/LoginPage.ts` — Playwright Page Object',
      '- `generated/login.spec.ts` — Login test scenarios',
      '',
      '### AI Code Review',
      reviewSummary,
      '',
      '### Pipeline steps',
      stepList,
    ].join('\n');
  }

  private exec(cmd: string): string {
    try {
      return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    } catch (err: unknown) {
      const out =
        err && typeof err === 'object' && 'stderr' in err
          ? String((err as { stderr: string }).stderr)
          : String(err);
      throw new Error(`Command failed: ${cmd}\n${out.slice(0, 500)}`);
    }
  }
}
