export interface PipelineStep {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  details?: string;
  timestamp: string;
}

export class AgentContext {
  // Входные данные
  checklistText: string = '';

  // Шаги 1–2: промпт для сценариев (до и после PII-очистки)
  scenariosPrompt: string = '';

  // Шаг 3: текстовые сценарии от Mistral
  scenarios: string = '';

  // Шаг 4: распарсенные тест-кейсы
  testcases: Record<string, unknown>[] = [];

  // Шаг 5: HTML-снимок страницы
  domHtml: string = '';

  // Шаг 6: сгенерированный TypeScript-код
  generatedPageObject: string = '';
  generatedSpec: string = '';

  // Шаг 7: вывод ESLint после Code Style
  lintOutput: string = '';

  // Шаг 8: AI Code Review отчёт
  codeReview: string = '';

  // Шаг 10: лог прогона Playwright-тестов
  testRunLog: string = '';

  // Шаг 11: агрегированные результаты Allure
  allureJson: Record<string, unknown> = {};

  // Шаг 12: bug report (строка JSON или пустая строка если багов нет)
  bugReport: string = '';

  // Шаг: URL созданного GitHub PR
  prUrl: string = '';

  // Шаг 13: итоговый отчёт (Markdown)
  finalReport: string = '';

  // Трейс: записи о каждом выполненном шаге
  readonly steps: PipelineStep[] = [];

  addStep(name: string, status: PipelineStep['status'], details?: string): void {
    this.steps.push({ name, status, details, timestamp: new Date().toISOString() });
  }
}
