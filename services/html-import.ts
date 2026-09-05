import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

export type ImportedStudent = {
  id: number;
  fullName: string;
  className: string;
  schoolName: string;
};

export type ImportedHtmlData = {
  students: ImportedStudent[];
  events: Array<{
    id: string;
    title: string;
    description?: string;
    type: "assignment" | "test" | "exam" | "grade" | "note" | "event";
    subject?: string;
    date: string;
    dueDate?: string;
    completed: boolean;
    priority: "low" | "normal" | "high";
  }>;
  summaries: Array<{
    subject: string;
    average: number;
    count: number;
    grades: Array<{
      id: string;
      subject: string;
      title: string;
      value: number;
      weight: number;
      teacher: string;
      date: string;
      comment?: string;
    }>;
  }>;
};

const GRADE_PATTERN = /(\b[1-6](?:[,+-])?\b|\b[1-6]\s*(?:[,+-])?\s*(?:\+|\-)\b)/i;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\u00A0/g, " ").trim();
}

function toIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\./g, "/").replace(/\s+/g, " ").trim();
  const date = new Date(cleaned);
  if (!Number.isNaN(date.getTime())) return date.toISOString();

  const m = cleaned.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const year = Number(y.length === 2 ? `20${y}` : y);
  const parsed = new Date(year, Number(mo) - 1, Number(d));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseGradeValue(raw: string): number | null {
  if (!raw) return null;
  const value = raw.toLowerCase().trim();
  if (/(nieklasyfikowany|brak|ndst|nd)/i.test(value)) return null;
  const direct = value.match(/(\d(?:[.,]\d)?)/);
  if (!direct) return null;
  let num = Number(direct[1].replace(",", "."));
  if (/[+]/.test(value)) num += 0.25;
  if (/-/.test(value) && !/[+]/.test(value)) num -= 0.25;
  if (num < 1 || num > 6) return null;
  return num;
}

function extractDateFromText(text: string): string | null {
  const full = text.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (full) return toIsoDate(full[0]);
  const match = text.match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/);
  if (match) return toIsoDate(match[0]);
  return null;
}

function normalizeSubjectName(raw: string): string {
  let value = normalizeText(raw || "");
  value = value.replace(/^(przedmiot|nazwa przedmiotu)\s*[:\-]?\s*/i, "");
  value = value.replace(/^\d+\s*\./, "");
  value = value.replace(/\s*[-–—]\s*\d+\s*$/, "");
  return value || "Nieznany przedmiot";
}

function parseGradeSummaries($: ReturnType<typeof load>): ImportedHtmlData["summaries"] {
  const buckets = new Map<string, { subject: string; items: any[] }>();

  const rows = $("tr, li, .row, .grade-row, .grade-item").toArray();

  for (const row of rows) {
    const cells = $(row).find("td, th, div, span, p").toArray();
    if (cells.length === 0) continue;

    const cellTexts = cells.map((c) => normalizeText($(c).text()));
    const text = normalizeText($(row).text());
    if (!text) continue;

    let subject: string | null = null;
    let gradeValue: number | null = null;
    let title: string | null = null;
    let teacher: string | null = null;
    let date: string | null = null;

    for (let i = 0; i < cellTexts.length; i += 1) {
      const cellText = cellTexts[i];
      if (!cellText) continue;

      const asGrade = parseGradeValue(cellText);
      if (asGrade !== null && !gradeValue) {
        gradeValue = asGrade;
        continue;
      }

      if (!subject && !/^(ocena|grade|data|nauczyciel|opis|wartość|wartosc)$/i.test(cellText)) {
        const looksLikeSubject = !/^\d+$/.test(cellText) && !/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(cellText);
        if (looksLikeSubject) {
          subject = normalizeSubjectName(cellText);
        }
      }

      if (!title && /\b(kartkówka|kartkowka|sprawdzian|test|odpowiedź|odpowiedz|zadanie|egzamin|kolokwium|wypracowanie|praca|opis)\b/i.test(cellText)) {
        title = cellText;
      }

      if (!teacher && /[A-ZŁŚŻÓĆŃĘĄ][a-ząćęłńóśżź]+\s+[A-ZŁŚŻÓĆŃĘĄ][a-ząćęłńóśżź]+/.test(cellText)) {
        teacher = cellText;
      }

      if (!date) {
        date = extractDateFromText(cellText);
      }
    }

    if (!subject || gradeValue === null) {
      const fallback = text.match(/([A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+[\s\-]?[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+(?:\s+[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+)*)\s*(?:\d|\b[1-6]\b)/i);
      if (!subject && fallback) subject = normalizeSubjectName(fallback[1]);
      const gradeFallback = text.match(/\b([1-6](?:[.,]\d)?(?:\+|\-)?)\b/i);
      if (gradeValue === null && gradeFallback) gradeValue = parseGradeValue(gradeFallback[1]);
    }

    if (!subject || gradeValue === null) continue;

    if (!title) title = "Ocena";
    if (!date) date = new Date().toISOString();
    if (!teacher) teacher = "—";

    const bucket = buckets.get(subject) ?? { subject, items: [] };
    bucket.items.push({
      id: `import-grade-${subject}-${Date.now()}-${bucket.items.length}`,
      subject,
      title,
      value: gradeValue,
      weight: 1,
      teacher,
      date,
      comment: undefined,
    });
    buckets.set(subject, bucket);
  }

  return Array.from(buckets.values()).map(({ subject, items }) => {
    const average = items.reduce((sum, item) => sum + item.value, 0) / items.length;
    return {
      subject,
      average: Number(average.toFixed(2)),
      count: items.length,
      grades: items,
    };
  }).sort((a, b) => b.average - a.average);
}

function parseEvents($: ReturnType<typeof load>): ImportedHtmlData["events"] {
  const events: ImportedHtmlData["events"] = [];
  const seen = new Set<string>();

  $("li, tr, .event, .task, .assignment, .calendar-item, .lesson-item, td").each((_, node) => {
    const text = normalizeText($(node).text());
    if (!text) return;

    const lower = text.toLowerCase();
    const isEventLike = /(sprawdzian|kartkówka|kartkowka|zadanie|homework|egzamin|test|lekcja|uwaga|zadania|kolokwium|wypracowanie)/i.test(lower);
    const hasDate = /\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(text) || /\d{4}-\d{2}-\d{2}/.test(text);
    if (!isEventLike || !hasDate) return;

    const dateResult = extractDateFromText(text) ?? new Date().toISOString();
    const title = text.split(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/)[0]?.trim() || "Wydarzenie z eksportu HTML";
    const subjectMatch = text.match(/([A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+(?:\s+[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+){0,2})/);
    const subject = subjectMatch ? normalizeSubjectName(subjectMatch[1]) : "Nieznany przedmiot";
    const id = `import-event-${dateResult}-${title}`;
    if (seen.has(id)) return;
    seen.add(id);

    events.push({
      id,
      title: title || "Wydarzenie z eksportu HTML",
      description: text,
      type: /sprawdzian|egzamin|test|kolokwium/.test(lower) ? "test" : /zadanie|homework|task/.test(lower) ? "assignment" : "event",
      subject,
      date: dateResult,
      dueDate: dateResult,
      completed: false,
      priority: /sprawdzian|egzamin|test/.test(lower) ? "high" : "normal",
    });
  });

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

function parseStudentName($: ReturnType<typeof load>): string {
  const candidates = [
    "h1",
    "h2",
    "h3",
    ".student-name",
    ".uczen",
    "header",
    "title",
  ];

  for (const selector of candidates) {
    const value = normalizeText($(selector).first().text());
    if (!value || value.length <= 2) continue;
    if (value.toLowerCase().includes("dziennik") || value.toLowerCase().includes("login")) continue;
    const cleaned = value.replace(/^(uczeń|uczen|student|uczennica|uczenica)\s*[:\-]?\s*/i, "").trim();
    return cleaned || value;
  }

  const pageTitle = normalizeText($("title").text());
  const cleanedTitle = pageTitle.replace(/^(uczeń|uczen|student|uczennica|uczenica)\s*[:\-]?\s*/i, "").trim();
  return cleanedTitle || pageTitle || "Uczeń z eksportu HTML";
}

export function parseHtmlExport(rawHtml: string): ImportedHtmlData {
  const $ = load(rawHtml || "");
  const studentName = parseStudentName($);
  const summaries = parseGradeSummaries($);
  const events = parseEvents($);

  const student: ImportedStudent = {
    id: 1,
    fullName: studentName,
    className: "Eksport HTML",
    schoolName: "Dziennik elektroniczny",
  };

  return {
    students: summaries.length > 0 || events.length > 0 ? [student] : [],
    events,
    summaries,
  };
}

export const TEMP_IMPORT_DIR = path.join(process.cwd(), ".tmp", "vulcan-imports");

export function ensureTempImportDir(): string {
  fs.mkdirSync(TEMP_IMPORT_DIR, { recursive: true });
  return TEMP_IMPORT_DIR;
}

export function saveHtmlTemporaryImport(rawHtml: string): string {
  ensureTempImportDir();
  const fileName = `vulcan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.html`;
  const fullPath = path.join(TEMP_IMPORT_DIR, fileName);
  fs.writeFileSync(fullPath, rawHtml, "utf8");
  return fullPath;
}

export function readLatestHtmlTemporaryImport(): { filePath: string; html: string } | null {
  ensureTempImportDir();
  const files = fs
    .readdirSync(TEMP_IMPORT_DIR)
    .filter((name) => name.toLowerCase().endsWith(".html"))
    .map((name) => ({
      name,
      path: path.join(TEMP_IMPORT_DIR, name),
      mtimeMs: fs.statSync(path.join(TEMP_IMPORT_DIR, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (!files.length) return null;

  const latest = files[0];
  const html = fs.readFileSync(latest.path, "utf8");
  return { filePath: latest.path, html };
}

export function consumeLatestHtmlTemporaryImport(): { filePath: string; html: string } | null {
  const latest = readLatestHtmlTemporaryImport();
  if (!latest) return null;
  try {
    fs.unlinkSync(latest.filePath);
  } catch {
    // Ignore cleanup errors; the file should disappear on the next pass.
  }
  return latest;
}

export function clearHtmlTemporaryImports(): void {
  try {
    ensureTempImportDir();
    for (const file of fs.readdirSync(TEMP_IMPORT_DIR)) {
      if (file.toLowerCase().endsWith(".html")) {
        fs.unlinkSync(path.join(TEMP_IMPORT_DIR, file));
      }
    }
  } catch {
    // Ignore cleanup errors.
  }
}
