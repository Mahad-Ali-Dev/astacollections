// ───────────────────────────────────────────────────────────
//  Minimal CSV/TSV helpers.
//
//  Review text routinely contains commas, quotes and line breaks, so a
//  naive split(",") loses data. These handle RFC 4180 quoting in both
//  directions, and auto-detect tabs so a sheet pasted or saved as TSV
//  works without the user picking a format.
// ───────────────────────────────────────────────────────────

/** Quote a single cell only when it needs it. */
function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV document from a header row plus data rows. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

/**
 * Parse a delimited document into rows of cells.
 *
 * Walks character by character rather than splitting, so quoted fields
 * containing the delimiter or a newline stay intact. The delimiter is
 * inferred from the first line unless one is supplied.
 */
export function parseDelimited(text: string, delimiter?: string): string[][] {
  const raw = text.replace(/^﻿/, ""); // strip BOM Excel adds
  const firstLine = raw.split("\n", 1)[0] ?? "";
  const delim =
    delimiter ??
    (firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",");

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') {
          cell += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));
}
