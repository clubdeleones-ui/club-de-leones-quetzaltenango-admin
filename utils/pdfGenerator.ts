import { jsPDF } from 'jspdf';
import { Acta } from '../types';

export const generateActaPDF = (acta: Acta) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);

  // Header Blue Bar (Primary Color)
  doc.setFillColor(27, 54, 93); // Blue-900
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Header Gold Bar (Secondary Accent Color)
  doc.setFillColor(234, 179, 8); // Yellow-500
  doc.rect(0, 15, pageWidth, 2, 'F');

  // Title Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(27, 54, 93);
  doc.text('CLUB DE LEONES DE QUETZALTENANGO', margin, 30);

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('REGISTRO OFICIAL DE ACTAS DE SESIÓN', margin, 37);

  // Metadata block in box
  const metaY = 44;
  doc.setFillColor(248, 250, 252); // Slate-50 (light grey)
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, metaY, contentWidth, 26, 3, 3, 'FD'); // background box

  // Meta details 2x2 grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate-600

  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 4;

  // Row 1: Título & Fecha
  doc.text('TÍTULO DEL ACTA:', col1X, metaY + 8);
  doc.setFont('helvetica', 'normal');
  let displayTitle = acta.titulo;
  if (doc.getTextWidth(displayTitle) > (contentWidth / 2) - 40) {
    displayTitle = doc.splitTextToSize(displayTitle, (contentWidth / 2) - 40)[0] + '...';
  }
  doc.text(displayTitle, col1X + 32, metaY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DE SESIÓN:', col2X, metaY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(acta.fecha, col2X + 32, metaY + 8);

  // Row 2: Categoría & Redactor
  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORÍA:', col1X, metaY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(acta.categoria || 'Reunión Ordinaria', col1X + 32, metaY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('REDACTOR:', col2X, metaY + 18);
  doc.setFont('helvetica', 'normal');
  let displayAuthor = acta.autor;
  if (doc.getTextWidth(displayAuthor) > (contentWidth / 2) - 30) {
    displayAuthor = doc.splitTextToSize(displayAuthor, (contentWidth / 2) - 30)[0] + '...';
  }
  doc.text(displayAuthor, col2X + 32, metaY + 18);

  // Content Body
  const rawLines = acta.contenido.split('\n');
  let y = 80;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 22;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      
      // Page Header for extra pages
      doc.setFillColor(27, 54, 93);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFillColor(234, 179, 8);
      doc.rect(0, 12, pageWidth, 1.5, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(`Acta: ${acta.titulo} - Página ${doc.internal.pages.length - 1}`, margin, 18);
      
      y = 26; // Reset Y coordinate
    }
  };

  rawLines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine === '') {
      y += 4; // Spacing for empty lines
      return;
    }

    // Check if it is a major header
    const isHeader = /^[A-ZÁÉÍÓÚÑ\s0-9]+:$/.test(trimmedLine) && trimmedLine.length > 3;

    if (isHeader) {
      checkPageOverflow(15);
      y += 4; // Top spacing before header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(27, 54, 93); // Navy Blue
      doc.text(trimmedLine, margin, y);
      y += 6.5;
    } else {
      // Regular line (could be list item or normal paragraph)
      const isListItem = trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine);
      const currentIndent = isListItem ? 6 : 0;
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85); // Slate-700
      
      const wrapWidth = contentWidth - currentIndent;
      
      let displayLine = trimmedLine;
      let symbolPrefix = '';
      if (isListItem) {
        if (trimmedLine.startsWith('-')) {
          displayLine = trimmedLine.replace(/^-\s*/, '');
          symbolPrefix = '• ';
        } else {
          const prefixMatch = trimmedLine.match(/^\d+\./);
          if (prefixMatch) {
            symbolPrefix = prefixMatch[0] + ' ';
            displayLine = trimmedLine.replace(/^\d+\.\s*/, '');
          }
        }
      }

      const splitLines = doc.splitTextToSize(displayLine, wrapWidth);
      
      splitLines.forEach((subLine: string, subIdx: number) => {
        checkPageOverflow(6.5);
        if (isListItem && subIdx === 0) {
          // Draw the bullet point/number prefix in bold gold
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(217, 119, 6); // Amber-600
          doc.text(symbolPrefix, margin, y);
          
          doc.setFont('times', 'normal');
          doc.setTextColor(51, 65, 85); // Slate-700
          doc.text(subLine, margin + currentIndent, y);
        } else {
          doc.text(subLine, margin + currentIndent, y);
        }
        y += 5.8; // Line height
      });
      y += 1.5; // Small spacing after paragraph/item
    }
  });

  // Signatures section
  if (y + 45 > pageHeight - bottomMargin) {
    doc.addPage();
    doc.setFillColor(27, 54, 93);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setFillColor(234, 179, 8);
    doc.rect(0, 12, pageWidth, 1.5, 'F');
    y = 26;
  }

  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  
  // Left signature
  doc.line(margin, y + 15, margin + 60, y + 15);
  doc.text('Firma del Secretario / Redactor', margin, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(acta.autor, margin, y + 25);

  // Right signature
  doc.line(pageWidth - margin - 60, y + 15, pageWidth - margin, y + 15);
  doc.text('Firma del Presidente del Club', pageWidth - margin - 60, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('Presidente de Junta Directiva', pageWidth - margin - 60, y + 25);

  // Decorative stamp
  y += 35;
  if (y + 10 < pageHeight - bottomMargin) {
    doc.setDrawColor(217, 119, 6); // Amber-600
    doc.setLineWidth(0.2);
    const stampW = 60;
    const stampH = 7;
    const stampX = (pageWidth - stampW) / 2;
    doc.roundedRect(stampX, y, stampW, stampH, 1.5, 1.5, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(217, 119, 6);
    doc.text('SELLO OFICIAL - CLUB DE LEONES QX', pageWidth / 2, y + 4.8, { align: 'center' });
  }
};

export const generateDiplomaDonacionPDF = (donanteNombre: string, montoTotal: number) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Borde exterior elegante azul
  doc.setFillColor(27, 54, 93); // Blue-900
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');
  doc.setDrawColor(27, 54, 93);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Borde interior delgado dorado
  doc.setDrawColor(234, 179, 8); // Yellow-500
  doc.setLineWidth(0.8);
  doc.rect(12.5, 12.5, pageWidth - 25, pageHeight - 25);

  // Esquinas decorativas
  doc.setFillColor(27, 54, 93);
  doc.rect(10, 10, 10, 10, 'F');
  doc.rect(pageWidth - 20, 10, 10, 10, 'F');
  doc.rect(10, pageHeight - 20, 10, 10, 'F');
  doc.rect(pageWidth - 20, pageHeight - 20, 10, 10, 'F');

  doc.setFillColor(234, 179, 8);
  doc.rect(12.5, 12.5, 5, 5, 'F');
  doc.rect(pageWidth - 17.5, 12.5, 5, 5, 'F');
  doc.rect(12.5, pageHeight - 17.5, 5, 5, 'F');
  doc.rect(pageWidth - 17.5, pageHeight - 17.5, 5, 5, 'F');

  // Título del Club
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(27, 54, 93);
  doc.text('CLUB DE LEONES DE QUETZALTENANGO', pageWidth / 2, 40, { align: 'center' });

  // Subtítulo
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(234, 179, 8);
  doc.text('Distrito D-4 Guatemala - "Nosotros Servimos"', pageWidth / 2, 48, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(40, 55, pageWidth - 40, 55);

  // Otorgamiento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text('OTORGA EL PRESENTE DIPLOMA DE', pageWidth / 2, 68, { align: 'center' });

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(28);
  doc.setTextColor(27, 54, 93);
  doc.text('RECONOCIMIENTO Y GRATITUD', pageWidth / 2, 82, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('A la distinguida persona de:', pageWidth / 2, 95, { align: 'center' });

  // Nombre Donante
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(234, 179, 8); // Gold/Yellow
  doc.text(donanteNombre, pageWidth / 2, 110, { align: 'center' });

  // Texto Agradecimiento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const text = `Por su valioso espíritu filantrópico y generosas donaciones por una suma de Q ${montoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })} recibidas a favor de los programas de salud visual, jornadas médicas y ayuda comunitaria coordinadas por este club en beneficio de la población vulnerable de Quetzaltenango.`;
  const splitText = doc.splitTextToSize(text, pageWidth - 80);
  let startY = 122;
  for (let i = 0; i < splitText.length; i++) {
    doc.text(splitText[i], pageWidth / 2, startY, { align: 'center' });
    startY += 6;
  }

  // Fecha
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  const fechaTexto = `Dado en la Ciudad de Quetzaltenango, el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
  doc.text(fechaTexto, pageWidth / 2, startY + 8, { align: 'center' });

  // Firmas
  const signatureY = pageHeight - 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  // Left Signature (Presidente)
  doc.setLineWidth(0.5);
  doc.line(40, signatureY, 100, signatureY);
  doc.text('Presidente del Club', 70, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Junta Directiva', 70, signatureY + 8, { align: 'center' });

  // Right Signature (Tesorero)
  doc.line(pageWidth - 100, signatureY, pageWidth - 40, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text('Tesorero del Club', pageWidth - 70, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Control Financiero', pageWidth - 70, signatureY + 8, { align: 'center' });

  doc.save(`reconocimiento-donacion-${donanteNombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
};
