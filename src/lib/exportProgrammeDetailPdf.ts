import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { EventDetailType } from "@/hooks/useEventDetail";

const margin = 14;
const headlineRed: [number, number, number] = [220, 38, 38];

type GearAssignmentRow = {
  quantity: number;
  gear: { name: string; type: string; condition: string } | null;
};

async function fetchGearAssignments(eventId: string): Promise<GearAssignmentRow[]> {
  const { data, error } = await supabase
    .from("gear_events")
    .select("quantity, gear:gear_id(name, type, condition)")
    .eq("event_id", eventId);
  if (error) throw error;
  return (data ?? []) as GearAssignmentRow[];
}

function fileSlug(title: string) {
  return title
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64)
    .toLowerCase() || "programme";
}

/**
 * Downloads a briefing PDF for a single programme (overview, roles, invitations, linked gear).
 */
export async function buildAndDownloadProgrammeDetailPdf(
  event: EventDetailType,
  eventId: string,
): Promise<void> {
  const gearAssignments = await fetchGearAssignments(eventId).catch(() => [] as GearAssignmentRow[]);

  const statusDerived = new Date(event.date) > new Date() ? "Upcoming" : "Completed";
  const confirmed = event.event_invitations.filter((inv) => inv.status === "accepted").length;

  let dateLine = `${format(new Date(event.date), "EEEE, PPP")} • ${format(new Date(event.date), "p")}`;
  if (
    event.end_date &&
    !isSameDay(new Date(event.date), new Date(event.end_date))
  ) {
    dateLine += ` → ends ${format(new Date(event.end_date), "EEEE, PPP p")}`;
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("TPAC OS — Programme briefing", margin, 12);

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(event.title, margin, 22);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Status: ${statusDerived}`, margin, 30);
  doc.text("Programme Debrief & Coordination", margin, 36);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Exported ${format(new Date(), "PPpp")}`, margin, 43);

  let y = 50;

  autoTable(doc, {
    startY: y,
    head: [["Field", "Details"]],
    body: [
      ["Date / time", dateLine],
      ["Location", event.location?.trim() || "—"],
      [
        "Main committee",
        `${confirmed} / ${event.max_participants ?? 0} main committee members confirmed`,
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: headlineRed },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable?.finalY != null ? (doc as any).lastAutoTable.finalY + 10 : y + 40;

  if (event.description?.trim()) {
    if (y > 240) doc.addPage();
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Description", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const paragraphs = event.description.trim().split(/\n+/);
    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(p, 180);
      for (const line of lines) {
        if (y > 278) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 3;
    }
    y += 4;
  }

  if (event.event_role_requirements.length > 0) {
    if (y > 225) doc.addPage();
    autoTable(doc, {
      startY: y,
      head: [["Roles needed", "Qty"]],
      body: event.event_role_requirements.map((r) => [String(r.role), String(r.quantity)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: headlineRed },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable?.finalY != null ? (doc as any).lastAutoTable.finalY + 10 : y;
  }

  const itinerarySorted = [...(event.itinerary_items ?? [])].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return (a.time || "").localeCompare(b.time || "");
  });
  if (itinerarySorted.length > 0) {
    if (y > 200) doc.addPage();
    autoTable(doc, {
      startY: y > margin ? y : margin,
      head: [["Day", "Time", "Activity", "Location"]],
      body: itinerarySorted.map((row) => [
        String(row.day),
        row.time?.trim() || "—",
        row.activity?.trim() || "—",
        row.location?.trim() || "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: headlineRed },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable?.finalY != null ? (doc as any).lastAutoTable.finalY + 10 : y;
  }

  if (y > 200) doc.addPage();
  autoTable(doc, {
    startY: y > margin ? y : margin,
    head: [["Invitation", "Name", "Email"]],
    body:
      event.event_invitations.length > 0
        ? event.event_invitations.map((inv) => [
            inv.status.replace(/_/g, " "),
            inv.profiles?.full_name?.trim() || "—",
            inv.profiles?.email?.trim() || "—",
          ])
        : [["—", "No invitations recorded", "—"]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: headlineRed },
    margin: { left: margin, right: margin },
    columnStyles: { 2: { cellWidth: 55 } },
  });

  const afterInvites = (doc as any).lastAutoTable?.finalY ?? y;
  y = afterInvites + 10;

  if (gearAssignments.length === 0) {
    if (y > 255) doc.addPage();
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Loadout / gear assignments: none linked via gear allocations for this programme.", margin, y);
  } else {
    if (y > 215) doc.addPage();
    autoTable(doc, {
      startY: y > margin ? y : margin,
      head: [["Gear item", "Type", "Qty allocated", "Condition"]],
      body: gearAssignments.map((row) => [
        row.gear?.name ?? "Unknown item",
        row.gear?.type ?? "—",
        String(row.quantity),
        row.gear?.condition ?? "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: headlineRed },
      margin: { left: margin, right: margin },
    });
  }

  doc.save(`${fileSlug(event.title)}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
