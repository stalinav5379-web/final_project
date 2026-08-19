import { PII_PATTERNS, luhnCheck } from './PiiPatterns';

export interface PiiMatch {
  type: string;
  value: string;
  index: number;
}

export class PiiScanner {
  scan(text: string): PiiMatch[] {
    const matches: PiiMatch[] = [];

    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      // Создаём свежую копию паттерна — RegExp с флагом 'g' хранит состояние в lastIndex,
      // копия гарантирует чистый старт при каждом вызове scan()
      const freshPattern = new RegExp(pattern.source, pattern.flags);

      for (const match of text.matchAll(freshPattern)) {
        if (match.index === undefined) continue;

        // Номера карт дополнительно проверяем алгоритмом Луна
        if (type === 'CREDIT_CARD' && !luhnCheck(match[0])) continue;

        matches.push({ type, value: match[0], index: match.index });
      }
    }

    // Сортируем по позиции в тексте — важно для корректной замены в PiiMasker
    return matches.sort((a, b) => a.index - b.index);
  }
}
