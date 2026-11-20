import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportJson {
  report_id: string;
  kind: string;
  generated_at: string;
  environment: string;
  scope: string;
  synthetic: boolean;
  marking: string;
  sha256: string;
  data: any;
}

const isPlainObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const cell = (v: any) => (v === null || v === undefined ? 'N/A' : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** Turn report.data into titled tables without inventing any values. */
function sectionsFromData(data: any, prefix = ''): { title: string; head: string[]; rows: string[][] }[] {
  const out: { title: string; head: string[]; rows: string[][] }[] = [];
  const scalars: string[][] = [];
  for (const [k, v] of Object.entries(data || {})) {
    const title = prefix ? `${prefix} / ${k}` : k;
    if (Array.isArray(v)) {
      if (v.length === 0) { out.push({ title, head: ['Result'], rows: [['No records']] }); continue; }
      if (isPlainObject(v[0])) {
        const head = Object.keys(v[0]);
        out.push({ title, head, rows: v.map((r: any) => head.map(h => cell(r[h]))) });
      } else out.push({ title, head: ['Value'], rows: v.map(x => [cell(x)]) });
    } else if (isPlainObject(v)) {
      out.push(...sectionsFromData(v, title));
    } else scalars.push([k, cell(v)]);
  }
  if (scalars.length) out.unshift({ title: prefix || 'Summary', head: ['Field', 'Value'], rows: scalars });
  return out;
}

export function buildReportPdf(r: ReportJson): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(`SAMH SWI Student Monitor — ${r.kind.replace(/_/g, ' ')}`, 40, 50);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  const meta = [
    `Report ID: ${r.report_id}`,
    `Generated: ${r.generated_at}`,
    `Scope: ${r.scope}`,
    `Environment: ${r.environment}`,
    `Data type: ${r.synthetic ? 'SYNTHETIC (demonstration)' : 'Persisted records'}`,
  ].flatMap(l => doc.splitTextToSize(l, W - 80) as string[]);
  doc.text(meta, 40, 70);
  let y = 70 + meta.length * 11 + 8;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.setTextColor(r.synthetic ? 180 : 60, r.synthetic ? 30 : 60, r.synthetic ? 30 : 60);
  const mk = doc.splitTextToSize(r.marking, W - 80) as string[];
  doc.text(mk, 40, y); y += mk.length * 11 + 6;
  doc.setTextColor(0);

  for (const sec of sectionsFromData(r.data)) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    if (y > H - 120) { doc.addPage(); y = 50; }
    doc.text(sec.title, 40, y); y += 6;
    autoTable(doc, {
      startY: y, head: [sec.head], body: sec.rows, theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 40, right: 40, bottom: 50 },
    });
    y = (doc as any).lastAutoTable.finalY + 18;
  }

  // Integrity note + per-page watermark/footer
  if (y > H - 100) { doc.addPage(); y = 50; }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(doc.splitTextToSize(`SHA-256 of report body (verification reference): ${r.sha256}`, W - 80), 40, y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (r.synthetic) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
      doc.setFont('helvetica', 'bold'); doc.setFontSize(54); doc.setTextColor(200, 0, 0);
      doc.text('SYNTHETIC DATA', W / 2, H / 2, { align: 'center', angle: 35 });
      doc.restoreGraphicsState();
      doc.setTextColor(0);
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(90);
    doc.text(r.marking, 40, H - 28, { maxWidth: W - 140 });
    doc.text(`${r.report_id} — Page ${i} of ${pages}`, W - 40, H - 16, { align: 'right' });
    doc.setTextColor(0);
  }
  return doc;
}

export const downloadPdf = (r: ReportJson) => buildReportPdf(r).save(`${r.report_id}.pdf`);

export function printPdf(r: ReportJson) {
  const doc = buildReportPdf(r);
  doc.autoPrint();
  const url = doc.output('bloburl') as unknown as string;
  window.open(url, '_blank');
}

export function downloadJson(r: ReportJson) {
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${r.report_id}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
