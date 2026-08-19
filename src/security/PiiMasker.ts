import { PiiScanner } from './PiiScanner';

export interface MaskResult {
  maskedText: string;
  count: number;
  types: string[];
}

export class PiiMasker {
  private readonly scanner = new PiiScanner();

  mask(text: string): MaskResult {
    const matches = this.scanner.scan(text);

    if (matches.length === 0) {
      return { maskedText: text, count: 0, types: [] };
    }

    const types = [...new Set(matches.map((m) => m.type))];

    // Заменяем с конца текста — так индексы предыдущих совпадений остаются валидными
    let maskedText = text;
    for (const match of [...matches].reverse()) {
      const placeholder = `[MASKED_${match.type}]`;
      maskedText =
        maskedText.slice(0, match.index) +
        placeholder +
        maskedText.slice(match.index + match.value.length);
    }

    return { maskedText, count: matches.length, types };
  }
}
