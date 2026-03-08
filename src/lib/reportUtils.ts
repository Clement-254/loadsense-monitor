import { SensorReading, ReportData } from '@/types/sensor';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateReportData(readings: SensorReading[], start: Date, end: Date): ReportData {
  const filtered = readings.filter(r => {
    const t = new Date(r.timestamp);
    return t >= start && t <= end;
  });

  if (filtered.length === 0) {
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      average: 0, max: 0, min: 0,
      overloadCount: 0, totalReadings: 0,
      readings: [],
    };
  }

  const loads = filtered.map(r => r.load_value);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    average: Math.round((loads.reduce((a, b) => a + b, 0) / loads.length) * 10) / 10,
    max: Math.round(Math.max(...loads) * 10) / 10,
    min: Math.round(Math.min(...loads) * 10) / 10,
    overloadCount: filtered.filter(r => r.status === 'Overload').length,
    totalReadings: filtered.length,
    readings: filtered,
  };
}

export function exportCSV(report: ReportData, unit: string) {
  const header = 'ID,Load Value (' + unit + '),Timestamp,Device ID,Status\n';
  const rows = report.readings.map(r =>
    `${r.id},${r.load_value},${r.timestamp},${r.device_id},${r.status}`
  ).join('\n');

  const summary = `\nSummary\nDate Range,${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}\nTotal Readings,${report.totalReadings}\nAverage Load,${report.average} ${unit}\nMax Load,${report.max} ${unit}\nMin Load,${report.min} ${unit}\nOverload Events,${report.overloadCount}\n\n`;

  const blob = new Blob([summary + header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loadsense-report-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(report: ReportData, unit: string) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('SLMRS Report', 14, 22);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Date Range: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`, 14, 36);

  doc.setFontSize(14);
  doc.text('Summary', 14, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Metric', 'Value']],
    body: [
      ['Total Readings', report.totalReadings.toString()],
      ['Average Load', `${report.average} ${unit}`],
      ['Maximum Load', `${report.max} ${unit}`],
      ['Minimum Load', `${report.min} ${unit}`],
      ['Overload Events', report.overloadCount.toString()],
    ],
    theme: 'striped',
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  if (report.readings.length > 0) {
    doc.setFontSize(14);
    doc.text('Recent Readings', 14, finalY + 12);

    const sample = report.readings.slice(-50);
    autoTable(doc, {
      startY: finalY + 16,
      head: [['Time', `Load (${unit})`, 'Status']],
      body: sample.map(r => [
        new Date(r.timestamp).toLocaleTimeString(),
        r.load_value.toString(),
        r.status,
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
    });
  }

  doc.save(`loadsense-report-${Date.now()}.pdf`);
}
