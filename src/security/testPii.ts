import { PiiScanner } from './PiiScanner';
import { PiiMasker } from './PiiMasker';

const sampleText = `
QA Checklist for login page testing.
Tester: john.doe@example.com
Phone: +7 (916) 123-45-67
Backup contact: +79161234567

Test credentials:
  username: standard_user
  password: secret_sauce_123

API integration:
  api_key = aBcDeFgHiJkLmNoP1234567890
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test

Payment test data:
  Card: 4111 1111 1111 1111
  Invalid card: 1234 5678 9999 0000

Regular text that should NOT be masked:
  The login button is red.
  Expected: user sees the dashboard.
`;

const scanner = new PiiScanner();
const masker = new PiiMasker();

// --- Сканирование ---
console.log('=== PII SCAN RESULTS ===\n');
const matches = scanner.scan(sampleText);

if (matches.length === 0) {
  console.log('No PII found.');
} else {
  matches.forEach((m, i) => {
    console.log(`[${i + 1}] Type: ${m.type.padEnd(14)} Value: "${m.value}"`);
  });
}

// --- Маскирование ---
console.log('\n=== MASKED TEXT ===\n');
const result = masker.mask(sampleText);
console.log(result.maskedText);

// --- Сводка ---
console.log('=== SUMMARY ===\n');
console.log(`Total PII found : ${result.count}`);
console.log(`Types detected  : ${result.types.join(', ')}`);
