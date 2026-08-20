import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';
import { getPageClassName, getPageObjectFileName, getPageObjectFilePath, getSpecFileName, getSpecFilePath } from '../orchestrator/PageConfig';

const MAX_RETRIES = 3;
const DOM_LIMIT = 30_000;

export class UiTestGenerationSkill implements AgentSkill {
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();

  name(): string {
    return 'UiTestGeneration';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const dom = ctx.domHtml.slice(0, DOM_LIMIT);
    const testcasesJson = JSON.stringify(ctx.testcases, null, 2);

    const pageClassName = getPageClassName();
    const pageObjectFileName = getPageObjectFileName();
    const specFileName = getSpecFileName();

    ctx.generatedPageObject = await this.generateWithRetry(
      'prompts/03_page_object.txt',
      { DOM_HTML: dom, PAGE_CLASS_NAME: pageClassName },
      pageObjectFileName,
      getPageObjectFilePath(),
      'pageobject',
    );

    ctx.generatedSpec = await this.generateWithRetry(
      'prompts/04_spec.txt',
      {
        PAGE_OBJECT: ctx.generatedPageObject,
        TESTCASES: testcasesJson,
        PAGE_CLASS_NAME: pageClassName,
        PAGE_FILE_NAME: pageObjectFileName.replace('.ts', ''),
      },
      specFileName,
      getSpecFilePath(),
      'spec',
    );
  }

  private async generateWithRetry(
    templatePath: string,
    vars: Record<string, string>,
    label: string,
    outputPath: string,
    kind: 'pageobject' | 'spec',
  ): Promise<string> {
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`  Generating ${label} (attempt ${attempt}/${MAX_RETRIES})...`);

      const basePrompt = this.engine.fill(path.resolve(templatePath), vars);
      const prompt = lastError
        ? `${basePrompt}\n\nPrevious output was invalid: ${lastError}\nFix the issue and return only valid TypeScript code.`
        : basePrompt;

      const raw = await this.client.chat(
        [{ role: 'user', content: prompt }],
        { temperature: 0.1, maxTokens: 4096 },
      );

      const code = this.autofix(this.stripMarkdown(raw));
      const error = this.validate(code, kind);

      if (!error) {
        const absPath = path.resolve(outputPath);
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, code, 'utf-8');
        console.log(`  Saved → ${outputPath} (${code.length} chars)`);
        return code;
      }

      console.warn(`  Attempt ${attempt} invalid: ${error}`);
      console.warn(`  Raw response (first 400 chars): ${raw.slice(0, 400)}`);
      lastError = error;
    }

    throw new Error(`Failed to generate valid ${label} after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
  }

  private autofix(code: string): string {
    let result = code;
    result = result.replace(/\.getByTest\((?!Id)/g, '.getByTestId(');
    // .error-message-container is always in DOM — toBeHidden() always fails
    result = result.replace(
      /expect\([^)]*errorMessageContainer[^)]*\)\.toBeHidden\(\)/g,
      "expect(page.locator('.error-message-container h3')).not.toBeVisible()",
    );
    return result;
  }

  private stripMarkdown(code: string): string {
    // If response contains a code fence block — extract its content
    const fenceMatch = code.match(/```(?:typescript|ts)?\s*\n([\s\S]*?)\n?```/);
    if (fenceMatch?.[1]) {
      return fenceMatch[1].trim();
    }
    return code.trim();
  }

  private validate(code: string, kind: 'pageobject' | 'spec'): string | null {
    if (code.length < 50) return 'Output too short';
    if (code.includes('```')) return 'Output still contains markdown fences';
    if (!code.includes('import')) return 'Missing import statements';
    if (kind === 'pageobject' && !code.includes('export class')) return 'Missing "export class" declaration';
    if (kind === 'spec' && !code.includes('describe(')) return 'Missing describe() block';
    return null;
  }
}
