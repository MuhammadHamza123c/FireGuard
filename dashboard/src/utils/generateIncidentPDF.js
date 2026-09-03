import jsPDF from 'jspdf';

function safeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0080-\u00FF]/g, (ch) => {
      const map = {
        '\u00e0': 'a', '\u00e1': 'a', '\u00e2': 'a', '\u00e3': 'a', '\u00e4': 'a', '\u00e5': 'a',
        '\u00e7': 'c', '\u00e8': 'e', '\u00e9': 'e', '\u00ea': 'e', '\u00eb': 'e',
        '\u00ed': 'i', '\u00ee': 'i', '\u00ef': 'i',
        '\u00f1': 'n', '\u00f2': 'o', '\u00f3': 'o', '\u00f4': 'o', '\u00f5': 'o', '\u00f6': 'o',
        '\u00f9': 'u', '\u00fa': 'u', '\u00fb': 'u', '\u00fc': 'u',
        '\u00fd': 'y', '\u00ff': 'y',
        '\u00c0': 'A', '\u00c1': 'A', '\u00c2': 'A', '\u00c3': 'A', '\u00c4': 'A', '\u00c5': 'A',
        '\u00c7': 'C', '\u00c8': 'E', '\u00c9': 'E', '\u00ca': 'E', '\u00cb': 'E',
        '\u00cd': 'I', '\u00ce': 'I', '\u00cf': 'I',
        '\u00d1': 'N', '\u00d2': 'O', '\u00d3': 'O', '\u00d4': 'O', '\u00d5': 'O', '\u00d6': 'O',
        '\u00d9': 'U', '\u00da': 'U', '\u00db': 'U', '\u00dc': 'U',
        '\u00dd': 'Y', '\u00df': 'ss',
      };
      return map[ch] || '';
    })
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function formatLocation(inc) {
  const lat = inc.latitude;
  const lng = inc.longitude;
  const city = safeText(inc.city || '');
  const region = safeText(inc.region || '');
  const hasReadable = city || region;
  if (hasReadable) {
    return `${city}${region ? ', ' + region : ''}`;
  }
  if (lat != null && lng != null) {
    return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
  }
  return 'N/A';
}

export function generateIncidentPDF(incidents, stats) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 20;

  const addText = (text, x, yPos, options = {}) => {
    doc.setFontSize(options.size || 10);
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(options.r || 0, options.g || 0, options.b || 0);
    doc.text(text, x, yPos);
    return yPos + (options.lineHeight || 5);
  };

  const addLine = (yPos) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    return yPos + 4;
  };

  doc.setFillColor(240, 240, 245);
  doc.rect(0, 0, pageWidth, 40, 'F');

  y = addText(safeText('FIRE DETECTION REPORT'), margin, y + 6, { size: 20, style: 'bold', r: 180, g: 50, b: 30 });
  y = addText(safeText('AI-Powered Fire & Smoke Detection System'), margin, y + 1, { size: 9, r: 100, g: 100, b: 110 });

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  y = addText(`Generated: ${dateStr}`, margin, y + 2, { size: 8, r: 120, g: 120, b: 130 });

  y = 48;

  y = addText('SUMMARY', margin, y, { size: 12, style: 'bold', r: 0, g: 0, b: 0 });
  y += 2;

  const summaryItems = [
    { label: 'Total Incidents', value: stats.total, color: [30, 30, 30] },
    { label: 'Detected (Active)', value: stats.detected, color: [200, 50, 50] },
    { label: 'In Progress', value: stats.inProgress, color: [200, 140, 20] },
    { label: 'Resolved', value: stats.resolved, color: [30, 150, 70] },
  ];

  const boxWidth = (pageWidth - margin * 2 - 12) / 4;
  summaryItems.forEach((item, i) => {
    const bx = margin + i * (boxWidth + 4);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(bx, y, boxWidth, 18, 2, 2, 'F');
    doc.setDrawColor(220, 220, 225);
    doc.roundedRect(bx, y, boxWidth, 18, 2, 2, 'S');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(String(item.value), bx + boxWidth / 2, y + 9, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 110);
    doc.text(item.label, bx + boxWidth / 2, y + 14, { align: 'center' });
  });

  y += 26;

  y = addLine(y);
  y += 2;
  y = addText('INCIDENT DETAILS', margin, y, { size: 12, style: 'bold', r: 0, g: 0, b: 0 });
  y += 4;

  const statusColors = {
    DETECTED: [200, 50, 50],
    IN_PROGRESS: [200, 140, 20],
    RESOLVED: [30, 150, 70],
  };

  const colWidths = [6, 30, 22, 22, 18, 38, 34];
  const headers = ['#', 'Type', 'Status', 'Fire %', 'Smoke %', 'Location', 'Date'];
  const colX = [];
  let cx = margin;
  colWidths.forEach((w) => { colX.push(cx); cx += w; });

  doc.setFillColor(240, 240, 245);
  doc.roundedRect(margin, y - 1, pageWidth - margin * 2, 7, 1, 1, 'F');
  headers.forEach((h, i) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 50);
    doc.text(h, colX[i] + 2, y + 3);
  });
  y += 9;

  incidents.forEach((inc, idx) => {
    if (y > 275) {
      doc.addPage();
      doc.setFillColor(240, 240, 245);
      doc.rect(0, 0, pageWidth, 20, 'F');
      y = 14;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 50, 30);
      doc.text('FIRE DETECTION REPORT (continued)', margin, y);
      y = 26;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 250);
      doc.rect(margin, y - 3, pageWidth - margin * 2, 8, 'F');
    }

    const sc = statusColors[inc.status] || statusColors.DETECTED;
    const row = [
      String(idx + 1),
      safeText((inc.incident_type || 'Unknown').slice(0, 16)),
      safeText((inc.status || '').replace('_', ' ')),
      `${((inc.fire_confidence || 0) * 100).toFixed(0)}%`,
      `${((inc.smoke_confidence || 0) * 100).toFixed(0)}%`,
      formatLocation(inc),
      new Date(inc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
    ];

    row.forEach((cell, i) => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      if (i === 2) {
        doc.setTextColor(sc[0], sc[1], sc[2]);
      } else if (i === 5 && inc.latitude && inc.longitude) {
        doc.setTextColor(25, 100, 180);
      } else {
        doc.setTextColor(30, 30, 40);
      }
      doc.text(cell, colX[i] + 2, y + 1);

      if (i === 5 && inc.latitude && inc.longitude) {
        const link = `https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`;
        doc.link(colX[i], y - 3, 38, 8, { url: link });
      }
    });
    y += 8;
  });

  y += 6;
  if (y > 260) { doc.addPage(); y = 20; }
  y = addLine(y);
  y += 2;
  y = addText('INCIDENT MESSAGES', margin, y, { size: 10, style: 'bold', r: 0, g: 0, b: 0 });
  y += 4;

  const messagesIncidents = incidents.filter((inc) => inc.message);
  if (messagesIncidents.length === 0) {
    y = addText('No messages recorded.', margin, y, { size: 8, r: 140, g: 140, b: 150 });
  } else {
    messagesIncidents.forEach((inc, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const sc = statusColors[inc.status] || statusColors.DETECTED;
      doc.setFillColor(sc[0], sc[1], sc[2]);
      doc.circle(margin + 2, y, 1.5, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 30);
      doc.text(safeText(`${inc.incident_type} — ${new Date(inc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`), margin + 7, y + 1);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 60);
      const lines = doc.splitTextToSize(safeText(inc.message), pageWidth - margin * 2 - 7);
      doc.text(lines, margin + 7, y);
      y += lines.length * 4 + 4;
    });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 150);
    doc.text(
      `Fire Detection System Report — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  const fileName = `Fire_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
