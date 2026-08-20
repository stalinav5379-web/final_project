# AI-Driven QA Pipeline

Автоматизированный QA-пайплайн на TypeScript (Node.js), который принимает чек-лист требований,
с помощью **Mistral AI** генерирует тест-сценарии, тест-кейсы и готовый Playwright-код (Page Object + spec),
прогоняет тесты, собирает **Allure Report** и публикует финальный отчёт в **GitHub Wiki**.

Дипломный проект курса **«Тестирование с AI»**.
Сайт-объект тестирования: [saucedemo.com](https://www.saucedemo.com/).

---

## Архитектура

| #  | Шаг                      | Что происходит                                                   | Артефакт                          |
|----|--------------------------|------------------------------------------------------------------|-----------------------------------|
| 1  | BuildScenariosPrompt     | Читает `checklist.txt`, подставляет в шаблон промпта             | промпт в памяти                   |
| 2  | PiiScan                  | Сканирует промпт на PII и маскирует                              | очищенный промпт                  |
| 3  | ScenarioGeneration       | Промпт → Mistral → текстовые тест-сценарии                       | сценарии в памяти                 |
| ◆  | **HITL-1**               | Показывает сценарии в CLI, ждёт Y/N; N → комментарий → повтор   | —                                 |
| 4  | TestcaseGeneration       | Сценарии → Mistral → строгий JSON тест-кейсов                    | `generated/testcases.json`        |
| 5  | DomSnapshot              | Playwright headless снимает HTML страницы                        | `generated/dom_snapshot.html`     |
| 6  | UiTestGeneration         | JSON + HTML → Mistral → Page Object + Playwright spec            | `generated/LoginPage.ts` + spec   |
| ◆  | **HITL-2**               | Показывает код в CLI, ждёт Y/N; N → комментарий → повтор         | —                                 |
| 7  | CodeStyle                | ESLint + Prettier над сгенерированным кодом                      | исправленные файлы                |
| 8  | AiCodeReview             | Код + lint → Mistral → обзор качества                            | `generated/ai_code_review.md`     |
| 9  | AiCodeFix                | Если есть CRITICAL-замечания → Mistral автоматически правит код  | обновлённые файлы                 |
| 10 | TestFixLoop              | `npx playwright test` → при падениях Mistral правит spec (×3)   | лог тестов в памяти               |
| 11 | Allure                   | `allure generate` → HTML-отчёт                                   | `allure-report/`                  |
| 12 | Git                      | Создаёт ветку, коммит, push → PR через GitHub REST API           | PR на GitHub                      |
| 13 | BugReport                | Лог + Allure → Mistral → JSON с дефектами                        | `generated/bug_report.json`       |
| 14 | Summary                  | Весь контекст → Mistral → финальный QA Summary                   | `generated/final_report.md`       |
| 15 | WikiPublish              | Публикует `final_report.md` в GitHub Wiki                        | страница Wiki                     |

```
checklist.txt
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR (main.ts)                  │
│                                                         │
│  1  BuildScenariosPromptSkill                           │
│  2  PiiScanSkill           ──────────► [MASKED]         │
│  3  ScenarioGenerationSkill ─────────► Mistral API      │
│  ◆  HITL-1  (Y / N → повтор)                           │
│  4  TestcaseGenerationSkill ─────────► Mistral API      │
│  5  DomSnapshotSkill ────────────────► Playwright       │
│  6  UiTestGenerationSkill ───────────► Mistral API      │
│       └─ retry до 3 раз при невалидном коде             │
│  ◆  HITL-2  (Y / N → повтор)                           │
│  7  CodeStyleSkill ──────────────────► ESLint+Prettier  │
│  8  AiCodeReviewSkill ───────────────► Mistral API      │
│  9  AiCodeFixSkill ──────────────────► Mistral API      │
│  10 TestFixLoopSkill ────────────────► npx playwright   │
│       └─ при падениях: Mistral правит spec (×3)         │
│  11 AllureSkill ─────────────────────► allure CLI       │
│  12 GitSkill ────────────────────────► GitHub REST API  │
│  13 BugReportSkill ──────────────────► Mistral API      │
│  14 SummarySkill ────────────────────► Mistral API      │
│  15 WikiPublishSkill ────────────────► GitHub Wiki      │
└─────────────────────────────────────────────────────────┘
      │
      ▼
generated/final_report.md → GitHub Wiki
```

---

## Технологический стек

| Категория                | Инструмент                          | Назначение                          |
|--------------------------|-------------------------------------|-------------------------------------|
| Язык                     | TypeScript 5 + Node.js              | Основной стек                       |
| Выполнение TS            | ts-node                             | Запуск оркестратора без компиляции  |
| LLM                      | Mistral AI (`mistral-small-latest`) | Генерация сценариев, кода, отчётов  |
| Браузерная автоматизация | Playwright                          | DOM-снимок + выполнение тестов      |
| Репортинг                | allure-playwright + allure-commandline | Allure HTML Report               |
| Линтинг                  | ESLint 9 + typescript-eslint        | Статический анализ кода             |
| Форматирование           | Prettier 3                          | Автоформат кода                     |
| CI/CD                    | GitHub Actions                      | Запуск тестов + Allure на Pages     |
| Публикация               | GitHub Wiki (git clone + push)      | Финальный QA-отчёт                  |
| Переменные окружения     | dotenv                              | Управление секретами                |

---

## Структура проекта

```
final_project/
├── .env.example                  # Шаблон переменных окружения
├── .env                          # Секреты (в .gitignore!)
├── checklist.txt                 # Входной чек-лист требований
├── playwright.config.ts          # Playwright + allure-playwright + dotenv
├── tsconfig.json
├── package.json
├── eslint.config.mjs
├── .prettierrc
│
├── prompts/                      # Шаблоны промптов для Mistral
│   ├── 01_scenarios.txt          # Чек-лист → тест-сценарии
│   ├── 02_testcases.txt          # Сценарии → JSON тест-кейсы
│   ├── 03_page_object.txt        # HTML → TypeScript Page Object
│   ├── 04_spec.txt               # JSON + POM → Playwright spec
│   ├── 05_code_review.txt        # Код + lint → AI ревью
│   ├── 05b_code_fix.txt          # AI-исправление CRITICAL-замечаний
│   ├── 05c_test_fix.txt          # AI-исправление упавших тестов
│   ├── 06_bug_report.txt         # Лог тестов → JSON дефектов
│   └── 07_summary.txt            # Весь контекст → финальный отчёт
│
├── src/
│   ├── orchestrator/
│   │   ├── AgentContext.ts       # Общее состояние между скиллами
│   │   ├── AgentSkill.ts         # Интерфейс скилла
│   │   ├── MistralClient.ts      # HTTP-клиент Mistral API
│   │   ├── PromptEngine.ts       # Заполнение {{PLACEHOLDER}} в шаблонах
│   │   ├── JsonExtractor.ts      # Извлечение JSON из ответа LLM
│   │   ├── HitlManager.ts        # CLI readline: вывод + Y/N + цикл при N
│   │   ├── PageConfig.ts         # Динамические имена файлов через PAGE_NAME
│   │   └── main.ts               # Точка входа, цепочка скиллов
│   │
│   ├── security/
│   │   ├── PiiPatterns.ts        # RegExp: email, телефон, карта, токен
│   │   ├── PiiScanner.ts         # Находит PII в тексте
│   │   └── PiiMasker.ts          # Заменяет PII на [MASKED_TYPE]
│   │
│   └── skills/
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
│       ├── AiCodeFixSkill.ts
│       ├── TestFixLoopSkill.ts
│       ├── AllureSkill.ts
│       ├── GitSkill.ts
│       ├── BugReportSkill.ts
│       ├── SummarySkill.ts
│       └── WikiPublishSkill.ts
│
├── generated/                    # Артефакты пайплайна (создаются автоматически)
│   ├── testcases.json
│   ├── dom_snapshot.html
│   ├── LoginPage.ts              # Сгенерированный Page Object
│   ├── login.spec.ts             # Сгенерированный Playwright тест
│   ├── ai_code_review.md
│   ├── bug_report.json
│   └── final_report.md
│
└── .github/
    └── workflows/
        └── playwright.yml        # CI/CD: тесты + Allure на GitHub Pages
```

---

## Конфигурация

Скопируй `.env.example` в `.env` и заполни значения:

```bash
cp .env.example .env
```

| Переменная           | Обязательна | Описание                                                            |
|----------------------|-------------|---------------------------------------------------------------------|
| `MISTRAL_API_KEY`    | ✅          | API-ключ Mistral AI (platform.mistral.ai)                           |
| `MISTRAL_MODEL`      | —           | Модель (по умолчанию: `mistral-small-latest`)                       |
| `APPLICATION_URL`    | —           | URL тестируемого сайта (по умолчанию: `https://www.saucedemo.com/`) |
| `PAGE_NAME`          | —           | Имя страницы для именования файлов (по умолчанию: `Login`)          |
| `TEST_ID_ATTRIBUTE`  | —           | Атрибут test ID в DOM (по умолчанию: `data-testid`)                 |
| `APP_PASSWORD`       | —           | Пароль для сгенерированных тестов (по умолчанию: `secret_sauce`)    |
| `GITHUB_REPO`        | ✅          | Репозиторий для PR (формат: `owner/repo`)                           |
| `GITHUB_TOKEN`       | ✅          | Personal Access Token (scopes: `repo`, `pull_requests`)             |

---

## Скрипты npm

```bash
# Пайплайн
npm run dev               # Запустить весь пайплайн

# Тесты
npm test                  # Запустить Playwright тесты
npm run allure:generate   # Сгенерировать Allure HTML-отчёт
npm run allure:open       # Открыть Allure Report в браузере

# Качество кода
npm run lint              # ESLint для src/
npm run lint:fix          # ESLint + авто-исправление
npm run format            # Prettier для src/
npm run format:check      # Проверить форматирование без изменений
```

---

## Запуск отдельного скилла

Любой скилл можно запустить изолированно — удобно для отладки конкретного шага.

**Паттерн — создай файл `src/debug<SkillName>.ts`:**

```typescript
import 'dotenv/config';
import { AgentContext } from './orchestrator/AgentContext';
import { SummarySkill } from './skills/SummarySkill';

const ctx = new AgentContext();
ctx.testRunLog = '10 passed (15s)';
ctx.allureJson = { passed: 10, failed: 0, total: 10, failures: [] };

(async () => {
  await new SummarySkill().execute(ctx);
})();
```

```bash
npx ts-node src/debugSummary.ts
```

**Какие поля нужны каждому скиллу:**

| Скилл                     | Обязательные поля `ctx`                                                                                       |
|---------------------------|---------------------------------------------------------------------------------------------------------------|
| `ScenarioGenerationSkill` | `ctx.scenariosPrompt`                                                                                         |
| `TestcaseGenerationSkill` | `ctx.scenarios`                                                                                               |
| `DomSnapshotSkill`        | ничего (берёт `APPLICATION_URL` из `.env`)                                                                    |
| `UiTestGenerationSkill`   | `ctx.testcases`, `ctx.domHtml`                                                                                |
| `CodeStyleSkill`          | файлы `generated/LoginPage.ts` и `generated/login.spec.ts` на диске                                          |
| `AiCodeReviewSkill`       | `ctx.generatedPageObject`, `ctx.generatedSpec`, `ctx.lintOutput`                                              |
| `AiCodeFixSkill`          | `ctx.codeReview`, `ctx.generatedSpec`, `ctx.generatedPageObject`                                              |
| `TestFixLoopSkill`        | `ctx.generatedSpec`, `ctx.generatedPageObject`                                                                |
| `AllureSkill`             | папка `allure-results/` на диске                                                                              |
| `BugReportSkill`          | `ctx.testRunLog`, `ctx.allureJson`                                                                            |
| `SummarySkill`            | `ctx.testRunLog`, `ctx.allureJson`, `ctx.bugReport`, `ctx.codeReview`, `ctx.steps`                            |
| `GitSkill`                | `ctx.generatedSpec`, `ctx.generatedPageObject`, `ctx.codeReview` + `.env`: `GITHUB_TOKEN`, `GITHUB_REPO`      |
| `WikiPublishSkill`        | файл `generated/final_report.md` на диске, `ctx.prUrl` (опц.) + `.env`: `GITHUB_TOKEN`, `GITHUB_REPO`        |

---

## Детали реализации

### Mistral API — параметры по шагам

| Шаг                      | temperature | max_tokens |
|--------------------------|-------------|------------|
| Сценарии (шаг 3)         | 0.4         | 4096       |
| Тест-кейсы (шаг 4)       | 0.1         | 4096       |
| Page Object (шаг 6)      | 0.1         | 4096       |
| Playwright spec (шаг 6)  | 0.1         | 4096       |
| Code Review (шаг 8)      | 0.2         | 4096       |
| Code Fix (шаг 9)         | 0.1         | 8192       |
| Test Fix (шаг 10)        | 0.1         | 8192       |
| Bug Report (шаг 13)      | 0.1         | 4096       |
| Summary (шаг 14)         | 0.3         | 4096       |

### PII-фильтрация

| Тип           | Пример               | Маска                  |
|---------------|----------------------|------------------------|
| EMAIL         | user@example.com     | `[MASKED_EMAIL]`       |
| PHONE         | +7 (999) 123-45-67   | `[MASKED_PHONE]`       |
| PASSWORD      | password: "secret"   | `[MASKED_PASSWORD]`    |
| API_KEY       | api_key=abc123xyz    | `[MASKED_API_KEY]`     |
| BEARER_TOKEN  | Bearer eyJhbGci...   | `[MASKED_BEARER_TOKEN]`|
| CREDIT_CARD   | 4111 1111 1111 1111  | `[MASKED_CREDIT_CARD]` |

### HITL — принцип работы

```
HitlManager.approve(label, content)
  ├─ Печатает content в консоль
  ├─ Y → пайплайн продолжается
  └─ N → "Enter feedback:" → скилл добавляет комментарий к промпту
           → повторяет LLM-вызов → снова вызывает approve()
```

### Retry-логика генерации кода

```
Попытка 1: LLM(prompt) → validate(code)
  ✅ → сохранить файл
  ❌ → Попытка 2: LLM(prompt + previousError)
         ✅ → сохранить
         ❌ → Попытка 3: то же
                ✅ → сохранить
                ❌ → исключение, пайплайн остановлен
```

### TestFixLoop — цикл авто-исправления тестов

```
Round 1: npx playwright test
  ✅ все прошли → выход
  ❌ есть падения → TestLog → Mistral → исправленный spec → Round 2
Round 2: npx playwright test
  ✅ → выход
  ❌ → Round 3
Round 3: npx playwright test
  ✅ → выход
  ❌ → пайплайн продолжается с предупреждением (падения попадут в BugReport)
```

---

## Ограничения AI-генерации

> **Ограничение 1 — кастомный `testIdAttribute`.**
> Playwright по умолчанию ищет `data-testid`, но saucedemo использует `data-test`.
> AI генерирует правильные вызовы `getByTestId()`, не зная о конфигурации проекта.
> **Вывод:** кастомные настройки фреймворка нужно явно передавать через переменную окружения (`TEST_ID_ATTRIBUTE`).

> **Ограничение 2 — несуществующие URL в ассертах.**
> AI предполагает структуру URL на основе общих паттернов (`/login.html`), а не реального поведения сайта.
> DOM-снимок статичен и не содержит информации о навигации после действий.
> **Вывод:** для точных URL-ассертов нужно явно описывать поведение в промпте или тест-кейсах.

> **Ограничение 3 — видимость всегда присутствующих контейнеров.**
> AI проверяет `not.toBeVisible()` на контейнере `.error-message-container`, который всегда присутствует в DOM (пустой `<div>`).
> **Вывод:** без знания конкретной DOM-структуры AI выбирает слишком широкие локаторы. Решение — проверять вложенный элемент (`h3`).

> **Ограничение 4 — состояние UI после интерактивных действий.**
> AI предполагает, что закрытие баннера ошибки сбрасывает все визуальные состояния.
> На saucedemo CSS-класс `input_error` на полях остаётся даже после закрытия баннера.
> **Вывод:** AI описывает «логически ожидаемое» поведение, но не знает фактической реализации UI.
