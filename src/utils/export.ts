import * as XLSX from "xlsx";

const sanitize = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const exportToCsv = (rows: Record<string, unknown>[], filename: string) => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];

  rows.forEach((row) => {
    const values = headers.map((h) => {
      const field = sanitize(row[h]);
      const needsQuotes = /[",\n]/.test(field);
      return needsQuotes ? `"${field.replace(/"/g, '""')}"` : field;
    });
    csvRows.push(values.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToExcel = (rows: Record<string, unknown>[], filename: string, sheetName = "Sheet1") => {
  if (!rows || rows.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
};
