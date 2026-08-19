import * as fs from 'fs';

export class PromptEngine {
  // Читает файл шаблона и заменяет все {{KEY}} на соответствующие значения из vars
  fill(templatePath: string, vars: Record<string, string>): string {
    const template = fs.readFileSync(templatePath, 'utf-8');

    return Object.entries(vars).reduce(
      (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
      template,
    );
  }
}
