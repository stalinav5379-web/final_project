import * as fs from 'fs';
import * as path from 'path';
import { chromium } from '@playwright/test';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';

const MAX_HTML_LENGTH = 100_000;

export class DomSnapshotSkill implements AgentSkill {
  name(): string {
    return 'DomSnapshot';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const url = process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/';
    console.log(`  Opening ${url} in headless Playwright...`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      const html = await page.content();

      ctx.domHtml =
        html.length > MAX_HTML_LENGTH
          ? html.slice(0, MAX_HTML_LENGTH) + '\n<!-- TRUNCATED -->'
          : html;

      const outputPath = path.resolve('generated/dom_snapshot.html');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, ctx.domHtml, 'utf-8');

      console.log(`  Snapshot saved: ${ctx.domHtml.length} chars → generated/dom_snapshot.html`);
    } finally {
      await browser.close();
    }
  }
}
