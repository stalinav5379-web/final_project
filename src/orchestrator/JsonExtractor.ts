export class JsonExtractor {
  // Вытаскивает JSON из ответа LLM, который может содержать
  // markdown-обёртки (```json ... ```) или лишний пояснительный текст
  extract(text: string): Record<string, unknown> {
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new Error(
        `No JSON object found in LLM response.\nRaw response (first 300 chars):\n${text.slice(0, 300)}`,
      );
    }

    const jsonStr = cleaned.slice(start, end + 1);

    try {
      return JSON.parse(jsonStr) as Record<string, unknown>;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Failed to parse JSON: ${msg}\n\nExtracted string (first 300 chars):\n${jsonStr.slice(0, 300)}`,
      );
    }
  }
}
