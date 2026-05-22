import jsPDF from "jspdf";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type AarReportRow = Tables<"aar_reports">;

const margin = 14;

function fileSlug(title: string): string {
  return (
    title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 64)
      .toLowerCase() || "aar-report"
  );
}

function escapeCsvCell(val: string | null | undefined): string {
  const s = String(val ?? "").replace(/"/g, '""');
  if (/[",\n\r]/.test(s)) return `"${s}"`;
  return s;
}

function addPdfBlock(
  doc: jsPDF,
  heading: string,
  body: string | null | undefined,
  startY: number,
): number {
  let y = startY;
  const text = body?.trim() || "—";

  if (y > 260) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(heading, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const lines = doc.splitTextToSize(text, 182);
  for (const line of lines) {
    if (y > 285) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  }
  return y + 8;
}

/**
 * Single-report PDF (portrait A4) for sharing offline.
 */
export function downloadAarReportPdf(report: AarReportRow): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = margin;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("TPAC OS — After Action Report", margin, y);
  y += 8;

  doc.setFontSize(17);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(report.programme_title, 182);
  for (const line of titleLines) {
    doc.text(line, margin, y);
    y += 8;
  }
  doc.setFont("helvetica", "normal");
  y += 2;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Filed ${format(new Date(report.created_at), "PPpp")} • Report ID ${report.id}`,
    margin,
    y,
  );
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Reporter: ${report.reporter_name}`, margin, y);
  y += 6;
  doc.text(
    `Programme date: ${format(new Date(report.date_of_programme), "PPP")}`,
    margin,
    y,
  );
  y += 6;
  doc.text(`Location: ${report.location}`, margin, y);
  y += 10;

  if (report.event_id) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Linked programme ID: ${report.event_id}`, margin, y);
    y += 10;
  }

  y = addPdfBlock(doc, "Participants", report.participants, y);
  y = addPdfBlock(doc, "Were objectives met?", report.objectives_met, y);
  y = addPdfBlock(doc, "What went well?", report.what_went_well, y);
  y = addPdfBlock(doc, "What could be improved?", report.what_could_be_improved, y);
  y = addPdfBlock(doc, "Lessons learned", report.lessons_learned, y);
  y = addPdfBlock(doc, "Recommendations", report.recommendations, y);
  y = addPdfBlock(doc, "Additional comments", report.additional_comments, y);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Exported ${format(new Date(), "PPpp")}`, margin, Math.min(y + 8, 290));

  const name = `${fileSlug(report.programme_title)}-aar-${format(new Date(report.created_at), "yyyy-MM-dd")}.pdf`;
  doc.save(name);
}

const CSV_COLUMNS: { key: keyof AarReportRow; header: string }[] = [
  { key: "id", header: "id" },
  { key: "programme_title", header: "programme_title" },
  { key: "reporter_name", header: "reporter_name" },
  { key: "date_of_programme", header: "date_of_programme" },
  { key: "location", header: "location" },
  { key: "participants", header: "participants" },
  { key: "objectives_met", header: "objectives_met" },
  { key: "what_went_well", header: "what_went_well" },
  { key: "what_could_be_improved", header: "what_could_be_improved" },
  { key: "lessons_learned", header: "lessons_learned" },
  { key: "recommendations", header: "recommendations" },
  { key: "additional_comments", header: "additional_comments" },
  { key: "event_id", header: "event_id" },
  { key: "created_at", header: "created_at" },
  { key: "updated_at", header: "updated_at" },
];

/**
 * One-row CSV matching `aar_reports` columns (Excel-friendly).
 */
export function downloadAarReportCsv(report: AarReportRow): void {
  const header = CSV_COLUMNS.map((c) => escapeCsvCell(c.header)).join(",");
  const row = CSV_COLUMNS.map((c) => escapeCsvCell(String(report[c.key] ?? ""))).join(",");
  const BOM = "\uFEFF";
  const blob = new Blob([`${BOM}${header}\n${row}\n`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileSlug(report.programme_title)}-aar-${format(new Date(report.created_at), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
