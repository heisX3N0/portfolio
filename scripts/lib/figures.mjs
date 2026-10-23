// The figures check (SPEC 9.4): every number in a page's visible text must be in the allow-list built from the
// approved figures table in SPEC.md Section 6.2. Years, dates and the "Last updated" stamp are exempt.
// Pure functions so tests can feed them bad input; scripts/tests/site.test.mjs runs them on the built site.

// A number as written, with its currency sign and unit: ₦268.36M, 2,210, 99.9%, 2M+, 9x, $0, and 100k or ₦5bn
// (any letters right after the digits are its unit). Digits after a letter are part of a name, not a figure
// (Pi360, n8n), so they are not matched.
const NUMBER = /(?<![\p{L}\d.,])[₦$]?\d+(?:[.,]\d+)*(?:%|\p{L}+)?\+?(?![\p{L}\d])/gu;

const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
// Exempt before tokenising: a day before a month ("23 October"), then a year where it reads as one: after a month
// or a word that introduces a year ("Mar 2024", "in 2026", "Period 2026", "2023 to 2024") or in brackets ("(2021)",
// "(expected 2027)"). A bare "2050 agents" is a count.
const DAY = new RegExp(`\\b\\d{1,2}(?=\\s+${MONTH}\\b)`, 'g');
const YEAR = new RegExp(
  `(?:(?<=\\b(?:${MONTH}|in|since|to|Period)\\s+)|(?<=\\((?:expected\\s+)?))(?:19|20)\\d\\d(?=[\\s).,;]|$)|\\b(?:19|20)\\d\\d(?=\\s+to\\s)`,
  'g',
);

// Sequence labels are not figures: "Phase 1", "Side Quest 3", "Step 2" (SPEC 9.4 exempts step numbers).
const LABEL = /\b(?:Step|Phase|Part|Quest)\s+\d+\b/g;
// Zero-padded identifiers in illustrative examples ("Branch 001") are names, not figures.
const IDENTIFIER = /(?<![\d.,])\b0\d+\b/g;

export function numberTokens(text) {
  return text.replace(DAY, ' ').replace(YEAR, ' ').replace(LABEL, ' ').replace(IDENTIFIER, ' ').match(NUMBER) ?? [];
}

// The numbers in the rows of the SPEC 6.2 table, both columns ("Beta 2.0" is in the "where used" column).
export function approvedFigures(spec) {
  const section = spec.match(/^### 6\.2 [^\n]*\n([\s\S]*?)(?=^#{2,3} )/m)?.[1];
  if (!section) throw new Error('SPEC.md: no Section 6.2 table');
  const rows = section.split('\n').filter((line) => line.startsWith('|') && !/^\|\s*(?:-|Figure\b)/.test(line));
  if (rows.length === 0) throw new Error('SPEC.md: Section 6.2 has no rows');
  // The spec writes ranges with an en dash (76–79); the site writes "76 to 79". Both ends are approved.
  return new Set(rows.flatMap((row) => numberTokens(row.replace(/[–—]/g, ' '))));
}

export function findUnapprovedNumbers(text, approved) {
  return [...new Set(numberTokens(text).filter((n) => !approved.has(n)))];
}
