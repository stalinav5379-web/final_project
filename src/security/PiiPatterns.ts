// Паттерны для поиска чувствительных данных в тексте.
// Флаг 'gi' — регистронезависимый поиск с глобальным захватом.
export const PII_PATTERNS: Record<string, RegExp> = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,

  // Российский (+7 / 8) и международный форматы
  PHONE: /(?:\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|\+\d{10,14}/g,

  // Подстроки вида: password: "secret", pass=value, pwd = '123'
  PASSWORD: /(?:password|passwd|pass|pwd)\s*[=:]\s*["']?[^\s"',;\n]{3,}["']?/gi,

  // api_key=abc123, apikey: "xyz", secret_key = "...", access_key=...
  API_KEY: /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?key)\s*[=:]\s*["']?[a-zA-Z0-9_\-]{16,}["']?/gi,

  // HTTP-заголовок Authorization: Bearer eyJ...
  BEARER_TOKEN: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g,

  // 16 цифр карты с опциональными разделителями (доп. проверка — алгоритм Луна)
  CREDIT_CARD: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
};

// Алгоритм Луна — проверяет, является ли строка цифр валидным номером карты
export function luhnCheck(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}
