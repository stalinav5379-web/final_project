# AI-Driven QA Pipeline

Автоматизированный QA-пайплайн на TypeScript (Node.js), который принимает чек-лист требований,
с помощью **Mistral AI** генерирует тест-сценарии, тест-кейсы и готовый Playwright-код (Page Object + spec),
прогоняет тесты в CI/CD, собирает **Allure Report** и публикует финальный отчёт в **Confluence**.

Дипломный проект курса **«Тестирование с AI»**.
Сайт-объект тестирования: [saucedemo.com](https://www.saucedemo.com/).

---

## Известные ограничения AI-генерации (для диплома)

> **Ограничение 1 — кастомный `testIdAttribute`.**
> Playwright по умолчанию ищет атрибут `data-testid`, но saucedemo использует `data-test`.
> AI сгенерировал правильные вызовы `getByTestId()`, не зная о настройке `testIdAttribute: 'data-test'` в `playwright.config.ts`.
> Вывод: модель не имеет доступа к конфигурации проекта — кастомные настройки фреймворка нужно явно указывать в промпте.

> **Ограничение 2 — несуществующие URL в ассертах.**
> AI предположил, что страница логина находится по адресу `/login.html`, хотя реальный URL — корневой `/`.
> Сгенерированные `toHaveURL(/login.html/)` упали на всех негативных тестах.
> Вывод: AI строит предположения о структуре URL на основе общих паттернов, а не реального поведения сайта. DOM-снимок страницы не содержит информации о навигации после действий.

> **Ограничение 4 — неточное моделирование поведения UI после действий пользователя.**
> AI сгенерировал ассерты `not.toHaveClass(/error/)` на полях ввода после закрытия баннера ошибки, предполагая, что X-кнопка сбрасывает все визуальные состояния.
> На самом деле saucedemo убирает только текст сообщения — CSS-класс `input_error` на полях остаётся.
> Вывод: AI описывает «логически ожидаемое» поведение на основе требований, но не знает фактической реализации UI. DOM-снимок статичен и не отражает состояния элементов после интерактивных действий.

> **Ограничение 3 — видимость всегда присутствующих контейнеров.**
> AI проверял `not.toBeVisible()` на контейнере `.error-message-container`, который всегда присутствует в DOM (пустой `<div>`).
> Правильная проверка — на вложенном элементе `h3`, который появляется только при ошибке.
> Вывод: без знания конкретной DOM-структуры AI выбирает слишком "широкие" локаторы.

---

## Схема пайплайна

| #   | Шаг            | Что происходит                                                     | Выходной артефакт                                   |
| --- | -------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| 1   | Build Prompt   | Читает `checklist.txt`, подставляет в шаблон промпта               | промпт в памяти                                     |
| 2   | PII Guardrails | Сканирует промпт на PII (email, телефон, карта, токен) и маскирует | очищенный промпт                                    |
| 3   | Scenario Gen   | Промпт → Mistral → текстовые тест-сценарии                         | сценарии в памяти                                   |
| ◆   | **HITL-1**     | Выводит сценарии в CLI, ждёт Y/N; N → комментарий → регенерация    | —                                                   |
| 4   | Testcase Gen   | Сценарии → Mistral → строгий JSON тест-кейсов                      | `generated/testcases.json`                          |
| 5   | DOM Snapshot   | Playwright headless снимает HTML страницы авторизации              | `generated/dom_snapshot.html`                       |
| 6   | UI Test Gen    | JSON + HTML → Mistral → TypeScript Page Object + Playwright spec   | `generated/LoginPage.ts` / `generated/auth.spec.ts` |
| ◆   | **HITL-2**     | Выводит код в CLI, ждёт Y/N; N → комментарий → регенерация         | —                                                   |
| 7   | Code Style     | ESLint + Prettier автоматически над сгенерированным кодом          | исправленные файлы                                  |
| 8   | AI Code Review | Код + lint-вывод → Mistral → обзор качества кода                   | `generated/ai_code_review.md`                       |
| 9   | Git & PR       | Создаёт ветку, коммит, push → `gh pr create`                       | PR на GitHub                                        |
| 10  | Test Run       | `npx playwright test` в subprocess                                 | лог в памяти                                        |
| 11  | Allure         | `allure generate` → HTML-отчёт из результатов прогона              | `allure-report/`                                    |
| 12  | Bug Report     | Лог + Allure → Mistral → JSON с дефектами (если есть)              | `generated/bug_report.json`                         |
| 13  | Summary        | Полный контекст → Mistral → финальный QA Summary                   | `generated/final_report.md`                         |
| ▲   | **Confluence** | Claude Code (MCP) публикует `final_report.md` на kb.epam.by        | страница Confluence                                 |

---

## Архитектура

```
checklist.txt  (входные данные)
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│                 ORCHESTRATOR  (main.ts)                   │
│                                                          │
│  Шаг  1  BuildScenariosPromptSkill                       │
│  Шаг  2  PiiScanSkill          ──────────► [MASKED]      │
│  Шаг  3  ScenarioGenerationSkill ────────► Mistral API   │
│                                                          │
│  ◆ HITL-1  (Y продолжаем / N → комментарий → повтор)    │
│                                                          │
│  Шаг  4  TestcaseGenerationSkill ────────► Mistral API   │
│  Шаг  5  DomSnapshotSkill ───────────────► Playwright    │
│  Шаг  6  UiTestGenerationSkill ──────────► Mistral API   │
│            └─ retry до 3 раз при невалидном коде         │
│                                                          │
│  ◆ HITL-2  (Y продолжаем / N → комментарий → повтор)    │
│                                                          │
│  Шаг  7  CodeStyleSkill ─────────────────► ESLint+Prettier│
│  Шаг  8  AiCodeReviewSkill ──────────────► Mistral API   │
│  Шаг  9  GitSkill ───────────────────────► gh CLI        │
│  Шаг 10  TestRunSkill ───────────────────► npx playwright│
│  Шаг 11  AllureSkill ────────────────────► allure CLI    │
│  Шаг 12  BugReportSkill ─────────────────► Mistral API   │
│  Шаг 13  SummarySkill ───────────────────► Mistral API   │
│                                                          │
└──────────────────────────────────────────────────────────┘
      │
      ▼
generated/final_report.md
      │
      ▼  (Claude Code MCP)
Confluence  (kb.epam.by)
```

---

## Технологический стек

| Категория                | Инструмент                             | Назначение                         |
| ------------------------ | -------------------------------------- | ---------------------------------- |
| Язык                     | TypeScript 5 + Node.js                 | Основной стек                      |
| Выполнение TS            | ts-node                                | Запуск оркестратора без компиляции |
| LLM                      | Mistral AI (`mistral-small-latest`)    | Генерация сценариев, кода, отчётов |
| Браузерная автоматизация | Playwright                             | DOM-снимок + выполнение тестов     |
| Репортинг                | allure-playwright + allure-commandline | Allure HTML Report                 |
| Линтинг                  | ESLint 9 + typescript-eslint           | Статический анализ                 |
| Форматирование           | Prettier 3                             | Автоформат кода                    |
| CI/CD                    | GitHub Actions                         | Запуск тестов + Allure artifact    |
| Git-автоматизация        | gh CLI (child_process)                 | Создание PR                        |
| Публикация               | Claude Code MCP (Confluence)           | Финальный отчёт                    |
| Переменные окружения     | dotenv                                 | Управление секретами               |

---

## Структура проекта

````
final_project/
├── .env.example                  # Шаблон переменных окружения
├── .env                          # Секреты (в .gitignore!)
├── checklist.txt                 # Входной чек-лист (saucedemo.com)
├── playwright.config.ts          # Playwright + allure-playwright reporter
├── tsconfig.json
├── package.json
├── eslint.config.mjs
├── .prettierrc
│
├── prompts/                      # Шаблоны промптов для Mistral
│   ├── 01_scenarios.txt          # Чек-лист → тест-сценарии
│   ├── 02_testcases.txt          # Сценарии → JSON тест-кейсы
│   ├── 03_page_object.txt        # HTML → TypeScript Page Object
│   ├── 04_autotests.txt          # JSON + POM → Playwright spec
│   ├── 05_code_review.txt        # Код + lint → AI ревью
│   ├── 06_bug_report.txt         # Лог тестов → JSON дефектов
│   └── 07_summary.txt            # Весь контекст → финальный отчёт
│
├── src/
│   ├── orchestrator/
│   │   ├── AgentContext.ts       # Общее состояние между скиллами
│   │   ├── AgentSkill.ts         # Интерфейс скилла
│   │   ├── MistralClient.ts      # HTTP-клиент Mistral API (OpenAI-совместимый)
│   │   ├── PromptEngine.ts       # Заполнение {{PLACEHOLDER}} в шаблонах
│   │   ├── JsonExtractor.ts      # Извлечение JSON из ответа LLM (убирает ```)
│   │   ├── HitlManager.ts        # CLI readline: вывод + Y/N + цикл при N
│   │   └── main.ts               # Точка входа, запуск цепочки скиллов
│   │
│   ├── security/
│   │   ├── PiiPatterns.ts        # RegExp: email, телефон, карта, токен...
│   │   ├── PiiScanner.ts         # Находит PII в тексте → [{type, value}]
│   │   └── PiiMasker.ts          # Заменяет PII на [MASKED_EMAIL] и т.д.
│   │
│   └── skills/                   # Каждый файл = один шаг пайплайна
│       ├── BuildScenariosPromptSkill.ts
│       ├── PiiScanSkill.ts
│       ├── ScenarioGenerationSkill.ts
│       ├── HitlScenarioApprovalSkill.ts
│       ├── TestcaseGenerationSkill.ts
│       ├── DomSnapshotSkill.ts
│       ├── UiTestGenerationSkill.ts
│       ├── HitlCodeApprovalSkill.ts
│       ├── CodeStyleSkill.ts
│       ├── AiCodeReviewSkill.ts
│       ├── GitSkill.ts
│       ├── TestRunSkill.ts
│       ├── AllureSkill.ts
│       ├── BugReportSkill.ts
│       └── SummarySkill.ts
│
├── generated/                    # Все выходные артефакты (создаются автоматически)
│   ├── testcases.json
│   ├── dom_snapshot.html
│   ├── LoginPage.ts              # Сгенерированный Page Object
│   ├── auth.spec.ts              # Сгенерированный Playwright тест
│   ├── ai_code_review.md
│   ├── bug_report.json
│   └── final_report.md           # → Confluence
│
└── .github/
    └── workflows/
        └── playwright.yml        # CI/CD: тесты + Allure artifact
````

---

## Конфигурация

Скопируй `.env.example` в `.env` и заполни значения:

```bash
cp .env.example .env
```

| Переменная        | Обязательна | Описание                                                            |
| ----------------- | ----------- | ------------------------------------------------------------------- |
| `MISTRAL_API_KEY` | ✅          | API-ключ Mistral AI (platform.mistral.ai)                           |
| `MISTRAL_MODEL`   | —           | Модель (по умолчанию: `mistral-small-latest`)                       |
| `APPLICATION_URL` | —           | URL тестируемого сайта (по умолчанию: `https://www.saucedemo.com/`) |
| `GITHUB_REPO`     | ✅          | Репозиторий для PR (формат: `owner/repo`)                           |

---

## Скрипты npm

```bash
npm run dev               # Запустить весь пайплайн (через ts-node)
npm run build             # Скомпилировать TypeScript → dist/
npm start                 # Запустить скомпилированный пайплайн

npm test                  # Запустить Playwright тесты
npm run allure:generate   # Сгенерировать Allure HTML-отчёт из allure-results/
npm run allure:open       # Открыть Allure Report в браузере

npm run lint              # ESLint для src/
npm run lint:fix          # ESLint + авто-исправление
npm run format            # Prettier для src/
npm run format:check      # Проверить форматирование без изменений
```

---

## План реализации (3 дня)

### День 1 — Основа + Шаги 1–5

**Цель:** пайплайн читает чек-лист, прогоняет PII-фильтр, генерирует сценарии,
получает одобрение HITL-1, создаёт JSON тест-кейсов и снимает HTML-снимок страницы.

```bash
npm install
npx playwright install chromium
```

**Инфраструктура оркестратора**

- [ ] `src/orchestrator/AgentContext.ts` — класс с полями: `checklistText`, `scenariosPrompt`,
      `scenarios`, `testcases`, `domHtml`, `generatedPageObject`, `generatedSpec`,
      `lintOutput`, `testRunLog`, `allureJson`, `bugReport`.
      Метод `addStep(name, status, details)` — ведёт трейс пайплайна.

- [ ] `src/orchestrator/AgentSkill.ts` — интерфейс:
      `name(): string` и `execute(ctx: AgentContext): Promise<void>`.

- [ ] `src/orchestrator/MistralClient.ts` — `chat(messages, opts?)`:
      `POST https://api.mistral.ai/v1/chat/completions` с заголовком `Authorization: Bearer`.
      Параметры по умолчанию: `temperature: 0.1`, `max_tokens: 4096`.

- [ ] `src/orchestrator/PromptEngine.ts` — `fill(templatePath, vars)`:
      читает файл, заменяет `{{KEY}}` → значение из `vars`.

- [ ] `src/orchestrator/JsonExtractor.ts` — `extract(text)`:
      убирает обёртки ` ```json ``` `, находит первый `{...}`,
      парсит и возвращает объект. Бросает ошибку при невалидном JSON.

- [ ] `src/orchestrator/HitlManager.ts` — `approve(label, content)`:
      выводит контент, спрашивает `[Y/n]:` через `readline`.
      При `n` → `Enter feedback:` → `{ approved: false, comment }`.
      При `y` → `{ approved: true, comment: '' }`.

**Модуль безопасности**

- [ ] `src/security/PiiPatterns.ts` — скомпилированные `RegExp` для:
      `EMAIL`, `PHONE`, `PASSWORD`, `API_KEY`, `BEARER_TOKEN`, `CREDIT_CARD` (+ алгоритм Луна).

- [ ] `src/security/PiiScanner.ts` — `scan(text)`:
      возвращает `Array<{ type: string; value: string; index: number }>`.

- [ ] `src/security/PiiMasker.ts` — `mask(text)`:
      заменяет на `[MASKED_<TYPE>]`, возвращает `{ maskedText, count, types }`.

**Промпты (английский язык)**

- [ ] `prompts/01_scenarios.txt`
- [ ] `prompts/02_testcases.txt` — формат ответа:
      `{"testcases":[{"id","title","type","steps":[],"expected"}]}`

**Скиллы**

- [ ] `src/skills/BuildScenariosPromptSkill.ts`
- [ ] `src/skills/PiiScanSkill.ts`
- [ ] `src/skills/ScenarioGenerationSkill.ts`
- [ ] `src/skills/HitlScenarioApprovalSkill.ts` — цикл: при `approved: false` добавляет
      комментарий к промпту и повторяет `ScenarioGenerationSkill`.
- [ ] `src/skills/TestcaseGenerationSkill.ts` — Mistral → `JsonExtractor` → валидация полей
      → `ctx.testcases` + `generated/testcases.json`.
- [ ] `src/skills/DomSnapshotSkill.ts` — Playwright headless, `page.content()` →
      `generated/dom_snapshot.html` (макс. 100 000 символов).
- [ ] `src/orchestrator/main.ts` — загружает `.env`, запускает цепочку скиллов, try/catch каждого.

**Проверка конца дня:**

```bash
npm run dev
# В консоли видны сценарии, HITL-1 спрашивает Y/N
# В generated/ появляются testcases.json и dom_snapshot.html
```

---

### День 2 — Генерация кода + Ревью + Git (Шаги 6–9)

**Цель:** пайплайн генерирует TypeScript Page Object и Playwright spec,
получает одобрение HITL-2, прогоняет линтер, AI Code Review и создаёт PR.

**Промпты**

- [ ] `prompts/03_page_object.txt` — целевой класс `LoginPage`, методы:
      `goto()`, `fillUsername()`, `fillPassword()`, `clickLogin()`,
      `getErrorMessage()`, `isOnInventoryPage()`. Переменные: `{{URL}}`, `{{HTML}}`.

- [ ] `prompts/04_autotests.txt` — Playwright `test()` блоки только через методы POM.
      Переменные: `{{POM_METHODS}}`, `{{TESTCASES}}`.

- [ ] `prompts/05_code_review.txt` — анализ кода + ESLint вывода.
      Секции ответа: `## Summary`, `## Critical Issues`, `## Warnings`, `## Recommendations`.
      Переменные: `{{CODE}}`, `{{ESLINT_OUTPUT}}`.

**Скиллы**

- [ ] `src/skills/UiTestGenerationSkill.ts` — два LLM-вызова (POM, затем spec).
      Retry до 3 раз: при невалидном коде добавляет `Previous answer + Error` к промпту.
      Валидация POM: содержит `class LoginPage`, `constructor`, `goto`.
      Валидация spec: содержит `import`, `test(`, `expect(`.
      Записывает `generated/LoginPage.ts` и `generated/auth.spec.ts`.

- [ ] `src/skills/HitlCodeApprovalSkill.ts` — показывает оба файла через `HitlManager.approve`.
      При `approved: false` добавляет комментарий и повторяет `UiTestGenerationSkill`.

- [ ] `src/skills/CodeStyleSkill.ts`:
  1. `npx eslint generated/LoginPage.ts generated/auth.spec.ts --format json` → `ctx.lintOutput`
  2. `npx prettier --write generated/LoginPage.ts generated/auth.spec.ts`

- [ ] `src/skills/AiCodeReviewSkill.ts` — код + `ctx.lintOutput` → Mistral → `generated/ai_code_review.md`.

- [ ] `src/skills/GitSkill.ts`:

  ```
  git checkout -b qa/ai-generated-{YYYY-MM-DD}
  git add generated/LoginPage.ts generated/auth.spec.ts playwright.config.ts
  git commit -m "feat: add AI-generated Playwright tests for saucedemo auth"
  git push origin <branch>
  gh pr create --title "..." --body "..."
  ```

- [ ] `playwright.config.ts` — `testDir: './generated'`, репортер `allure-playwright`,
      `baseURL: process.env.APPLICATION_URL`.

**Проверка конца дня:**

```bash
npm run dev
# В generated/ появляются LoginPage.ts, auth.spec.ts, ai_code_review.md
# На GitHub создаётся PR
```

---

### День 3 — CI/CD + Allure + Финальный отчёт (Шаги 10–13)

**Цель:** тесты запускаются в CI, генерируется Allure Report,
создаётся bug report при падениях, финальный отчёт публикуется в Confluence.

**CI/CD**

- [ ] `.github/workflows/playwright.yml`:
      триггер `push` + `pull_request` → `npm ci` → `npx playwright install chromium` →
      `npm test` → `npm run allure:generate` →
      `actions/upload-artifact` (путь `allure-report/`).

**Скиллы**

- [ ] `src/skills/TestRunSkill.ts` — `npx playwright test --reporter=allure-playwright`
      через `child_process.exec`. Сохраняет stdout + exit code в `ctx.testRunLog`.
      Не останавливает пайплайн при падении тестов.

- [ ] `src/skills/AllureSkill.ts` — `allure generate allure-results --clean -o allure-report`.
      Читает `allure-results/*-result.json`, агрегирует статистику (`passed`, `failed`, список сбоев).
      Сохраняет в `ctx.allureJson`.

- [ ] `src/skills/BugReportSkill.ts` — запускается только если в `ctx.testRunLog` есть ошибки.
      Лог + Allure → Mistral → `JsonExtractor` → `generated/bug_report.json`.

- [ ] `src/skills/SummarySkill.ts` — весь контекст → Mistral (temperature: 0.3) →
      `generated/final_report.md` в формате Confluence-ready Markdown.

- [ ] Финальный end-to-end прогон всего пайплайна.

- [ ] **Публикация в Confluence** (через Claude Code):
  > "Опубликуй `generated/final_report.md` в Confluence на kb.epam.by"

**Промпты**

- [ ] `prompts/06_bug_report.txt` — формат ответа: `{"bugs":[...]}` или `{"status":"NO_BUGS_FOUND"}`.
      Переменные: `{{TEST_RUN_LOG}}`, `{{ALLURE_RESULTS}}`.

- [ ] `prompts/07_summary.txt` — секции: `## Executive Summary`, `## Pipeline Steps Executed`,
      `## Test Results`, `## Defects Found`, `## AI Code Review Highlights`, `## Recommendations`.
      Переменные: `{{PIPELINE_TRACE}}`, `{{TEST_RUN_LOG}}`, `{{ALLURE_RESULTS}}`, `{{BUG_REPORT}}`.

**Проверка конца дня:**

```bash
npm run dev
# Полный прогон от checklist.txt до final_report.md
# allure-report/ открывается в браузере: npm run allure:open
# PR на GitHub содержит LoginPage.ts и auth.spec.ts
```

---

## Детали реализации

### Mistral API — параметры по профилю

| Профиль                 | temperature | max_tokens |
| ----------------------- | ----------- | ---------- |
| Сценарии (шаг 3)        | 0.4         | 4096       |
| Тест-кейсы (шаг 4)      | 0.1         | 4096       |
| Page Object (шаг 6)     | 0.1         | 8192       |
| Playwright spec (шаг 6) | 0.1         | 8192       |
| Code Review (шаг 8)     | 0.2         | 4096       |
| Bug Report (шаг 12)     | 0.1         | 4096       |
| Summary (шаг 13)        | 0.3         | 4096       |

### PII-паттерны (src/security/PiiPatterns.ts)

| Тип          | Пример              | Маска                 |
| ------------ | ------------------- | --------------------- |
| EMAIL        | user@example.com    | [MASKED_EMAIL]        |
| PHONE        | +7 (999) 123-45-67  | [MASKED_PHONE]        |
| PASSWORD     | password: "secret"  | [MASKED_PASSWORD]     |
| API_KEY      | api_key=abc123xyz   | [MASKED_API_KEY]      |
| BEARER_TOKEN | Bearer eyJhbGci...  | [MASKED_BEARER_TOKEN] |
| CREDIT_CARD  | 4111 1111 1111 1111 | [MASKED_CREDIT_CARD]  |

### HITL — принцип работы

```
HitlManager.approve(label, content)
  │
  ├─ Печатает content в консоль
  ├─ Спрашивает: "Approve? [Y/n]:"
  │
  ├─ Y → { approved: true }  → пайплайн продолжается
  │
  └─ n → "Enter feedback:" → { approved: false, comment }
           │
           └─ Скилл добавляет комментарий к промпту
              → повторяет LLM-вызов
              → снова вызывает approve()
              (бесконечный цикл; выход — Y или Ctrl+C)
```

### Retry-логика генерации кода (UiTestGenerationSkill)

```
Попытка 1: LLM(basePrompt) → validate(code)
  ✅ pass → сохранить файл
  ❌ fail → Попытка 2: LLM(basePrompt + previousAnswer + error)
              ✅ pass → сохранить
              ❌ fail → Попытка 3: то же
                          ✅ pass → сохранить
                          ❌ fail → исключение, пайплайн остановлен
```

### GitSkill — что коммитить

В ветку `qa/ai-generated-{YYYY-MM-DD}` коммитятся только:

- `generated/LoginPage.ts` — Page Object
- `generated/auth.spec.ts` — Playwright spec
- `playwright.config.ts` — конфиг тестов

Промежуточные артефакты (`dom_snapshot.html`, `testcases.json`, `ai_code_review.md`,
`bug_report.json`, `final_report.md`) остаются локально.

---

> Весь рабочий процесс (тест-кейсы, промпты, сгенерированный код, логи, Allure,
> Confluence-отчёт) — на **английском языке**.
> Общение с пользователем в CLI и этот README — на **русском**.
