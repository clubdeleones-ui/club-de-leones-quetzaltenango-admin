import { jsPDF } from 'jspdf';
import { Acta, MinutaComision, Socio } from '../types';

export const generateActaCode = (
  categoria: string,
  fecha: string,
  numeroActa: string,
  presidentName: string,
  titulo: string
): string => {
  const catCode = categoria === 'Extraordinaria' 
    ? 'EXT' 
    : categoria === 'Reunión de Comisión' 
    ? 'COM' 
    : 'ORD';

  const dateCode = fecha ? fecha.replace(/[^0-9]/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
  const numCode = 'N' + (numeroActa || '0').replace(/^No\.\s*|No\s*|N\s*/i, '').trim();
  const presCode = presidentName ? presidentName.split(' ')[0].toUpperCase() : 'PRES';

  const titleClean = (titulo || '')
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, '')
    .substring(0, 10);

  return `${catCode}-${dateCode}-${numCode}-${presCode}-${titleClean || 'ACTA'}`;
};

export const generateActaPDF = (acta: Acta, action: 'download' | 'open' = 'download') => {
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

  // Dynamic Names Lookup
  let presidentName = 'Edwin Ernesto Pacheco López';
  let secretaryName = 'Flor Rodríguez Cifuentes';
  try {
    const local = localStorage.getItem('club_leones_socios');
    if (local) {
      const sociosList = JSON.parse(local);
      const president = sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
      const secretary = sociosList.find((s: any) => s.puesto?.toLowerCase().includes('secretario del club') || s.puesto?.toLowerCase() === 'secretario') || sociosList.find((s: any) => s.puesto?.toLowerCase().includes('secretario'));
      if (president) presidentName = president.nombre;
      if (secretary) secretaryName = secretary.nombre;
    }
  } catch (e) {}

  // Generate unique registry code
  const code = acta.codigoRegistro || generateActaCode(
    acta.categoria || 'Ordinaria',
    acta.fecha,
    acta.numeroActa || '1',
    presidentName,
    acta.titulo
  );

  // Draw Logo on the left (X coord: margin, Y coord: 22)
  const logoX = margin;
  const logoY = 22;
  const logoRadius = 7; // 14mm diameter
  
  // Blue filled circle
  doc.setFillColor(27, 54, 93); // Blue-900
  doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius, 'F');
  
  // Gold circle outline
  doc.setDrawColor(234, 179, 8); // Yellow-500
  doc.setLineWidth(0.5);
  doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius - 0.5, 'S');
  
  // Gold 'L' in the center
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(234, 179, 8); // Yellow-500
  doc.text('L', logoX + logoRadius, logoY + logoRadius + 4.5, { align: 'center' });

  // Title Branding on the right of the logo (X coord: logoX + 18)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 54, 93);
  doc.text('CLUB DE LEONES DE QUETZALTENANGO', logoX + 18, logoY + 5.5);

  // Subtitle (Nosotros Servimos - removing D-4 references)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(217, 119, 6); // Amber-600
  doc.text('NOSOTROS SERVIMOS', logoX + 18, logoY + 11.5);

  // Metadata block in box (More compact to eliminate redundancy)
  const metaY = 42;
  doc.setFillColor(248, 250, 252); // Slate-50 (light grey)
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, metaY, contentWidth, 20, 2.5, 2.5, 'FD'); // background box

  // Meta details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // Slate-600

  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 4;

  // Row 1: Código de Registro
  doc.text('CÓDIGO DE REGISTRO:', col1X, metaY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(27, 54, 93); // Navy Blue for code
  doc.setFontSize(9);
  doc.text(code, col1X + 38, metaY + 6.5);

  // Row 2: Secretario & Presidente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SECRETARIO:', col1X, metaY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.text(secretaryName, col1X + 38, metaY + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.text('PRESIDENTE EN TURNO:', col2X, metaY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.text(presidentName, col2X + 38, metaY + 14.5);

  // Content Body
  const rawLines = acta.contenido.split('\n');
  let y = 72;
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

  // Signatures section (Secretary and President pulled dynamically)
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
  
  // Left signature (Secretary)
  doc.line(margin, y + 15, margin + 60, y + 15);
  doc.text('Firma del Secretario', margin, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(secretaryName, margin, y + 25);

  // Right signature (President)
  doc.line(pageWidth - margin - 60, y + 15, pageWidth - margin, y + 15);
  doc.text('Firma del Presidente', pageWidth - margin - 60, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(presidentName, pageWidth - margin - 60, y + 25);

  // Decorative stamp
  y += 35;
  if (y + 10 < pageHeight - bottomMargin) {
    doc.setDrawColor(217, 119, 6); // Amber-650
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

  // Document Footer (all pages)
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento de carácter privado y confidencial - Club de Leones de Quetzaltenango © 2026', 
      margin, 
      pageHeight - 10
    );
    doc.text(
      `Pág. ${i} de ${pageCount}`, 
      pageWidth - margin - 15, 
      pageHeight - 10
    );
  }

  // Handle PDF Output
  if (action === 'open') {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  } else {
    const cleanTitle = acta.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`acta-${cleanTitle}.pdf`);
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

export const generateReciboPagoPDF = (socio: any, pago: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  // Header Blue Bar (Primary Color)
  doc.setFillColor(27, 54, 93); // Blue-900
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Header Gold Bar (Secondary Accent Color)
  doc.setFillColor(234, 179, 8); // Yellow-500
  doc.rect(0, 15, pageWidth, 2, 'F');

  // Draw Logo on the left (X coord: margin, Y coord: 22)
  const logoX = margin;
  const logoY = 22;
  const logoRadius = 7;
  
  // Blue filled circle
  doc.setFillColor(27, 54, 93); // Blue-900
  doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius, 'F');
  
  // Gold circle outline
  doc.setDrawColor(234, 179, 8); // Yellow-500
  doc.setLineWidth(0.5);
  doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius - 0.5, 'S');
  
  // Gold 'L' in the center
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(234, 179, 8); // Yellow-500
  doc.text('L', logoX + logoRadius, logoY + logoRadius + 4.5, { align: 'center' });

  // Title Branding on the right of the logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 54, 93);
  doc.text('CLUB DE LEONES DE QUETZALTENANGO', logoX + 18, logoY + 5.5);

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(217, 119, 6); // Amber-600
  doc.text('NOSOTROS SERVIMOS', logoX + 18, logoY + 11.5);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, pageWidth - margin, 40);

  // Title: RECIBO DE PAGO DE CUOTA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 54, 93);
  doc.text('RECIBO DE CONTROL DE CUOTAS', margin, 50);

  // Receipt details box
  const metaY = 56;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, metaY, contentWidth, 35, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 4;

  doc.text('RECIBO NO:', col1X, metaY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`REC-${pago.id.split('-')[1] || pago.id.substring(5, 12).toUpperCase()}`, col1X + 28, metaY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA EMISIÓN:', col1X, metaY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(pago.fechaPago, col1X + 28, metaY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('SOCIO:', col1X, metaY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(socio.nombre, col1X + 28, metaY + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO SOCIO:', col1X, metaY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(socio.codigoSocio || 'N/A', col1X + 28, metaY + 28);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('PERÍODO:', col2X, metaY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(pago.periodo, col2X + 35, metaY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('TIPO APORTACIÓN:', col2X, metaY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(pago.tipoPeriodo, col2X + 35, metaY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('MÉTODO PAGO:', col2X, metaY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(pago.metodo, col2X + 35, metaY + 21);

  if (pago.metodo !== 'Efectivo') {
    doc.setFont('helvetica', 'bold');
    doc.text('REF. / BANCO:', col2X, metaY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pago.numeroReferencia || 'S/N'} (${pago.bancoReferencia || 'N/A'})`, col2X + 35, metaY + 28);
  }

  // Payment Breakdown Table
  const tableY = 100;
  doc.setFillColor(27, 54, 93); // Blue-900
  doc.rect(margin, tableY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('CONCEPTO / DESCRIPCIÓN', margin + 4, tableY + 5.5);
  doc.text('MONTO COBRADO', margin + contentWidth - 4, tableY + 5.5, { align: 'right' });

  // Row 1
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, tableY + 8, margin + contentWidth, tableY + 8);
  doc.line(margin, tableY + 20, margin + contentWidth, tableY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9.5);
  doc.text(`Aportación Cuota Obligatoria (${pago.tipoPeriodo}) - Período ${pago.periodo}`, margin + 4, tableY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Q ${pago.monto.toFixed(2)}`, margin + contentWidth - 4, tableY + 14, { align: 'right' });

  // Total
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + (contentWidth / 2), tableY + 20, contentWidth / 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 54, 93);
  doc.text('TOTAL RECIBIDO:', margin + (contentWidth / 2) + 4, tableY + 25.5);
  doc.text(`Q ${pago.monto.toFixed(2)}`, margin + contentWidth - 4, tableY + 25.5, { align: 'right' });

  // Signatures
  const sigY = 155;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  
  // Left
  doc.line(margin + 5, sigY, margin + 65, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Firma del Tesorero', margin + 35, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Control y Tesorería', margin + 35, sigY + 9, { align: 'center' });

  // Right
  doc.line(margin + contentWidth - 65, sigY, margin + contentWidth - 5, sigY);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma del Socio Recibido', margin + contentWidth - 35, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(socio.nombre, margin + contentWidth - 35, sigY + 9, { align: 'center' });

  // Stamp
  const stampY = 185;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.2);
  const stampW = 70;
  const stampH = 7;
  const stampX = (pageWidth - stampW) / 2;
  doc.roundedRect(stampX, stampY, stampW, stampH, 1.5, 1.5, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(217, 119, 6);
  doc.text('TRANSACCIÓN REGISTRADA - TESORERÍA CLQ', pageWidth / 2, stampY + 4.8, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Comprobante electrónico de pago - Club de Leones de Quetzaltenango © 2026', 
    margin, 
    pageHeight - 15
  );

  const cleanName = socio.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`recibo-cuota-${cleanName}-${pago.id.split('-')[1] || 'pago'}.pdf`);
};

export const generateMinutaPDF = (
  minuta: MinutaComision,
  comisionNombre: string,
  socios: Socio[],
  action: 'download' | 'open' = 'download'
) => {
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

  // Draw Logo
  const logoX = margin;
  const logoY = 22;
  const logoRadius = 7;
  doc.setFillColor(27, 54, 93);
  doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius, 'F');
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.5);
  doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius - 0.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(234, 179, 8);
  doc.text('L', logoX + logoRadius, logoY + logoRadius + 4.5, { align: 'center' });

  // Title Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 54, 93);
  doc.text('CLUB DE LEONES DE QUETZALTENANGO', logoX + 18, logoY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(217, 119, 6);
  doc.text('MINUTA DE REUNIÓN DE COMISIÓN', logoX + 18, logoY + 11.5);

  // Metadata block
  const metaY = 42;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, metaY, contentWidth, 24, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 4;

  doc.text('TEMA / DISCUSIÓN:', col1X, metaY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(27, 54, 93);
  doc.text(minuta.tema.substring(0, 50) + (minuta.tema.length > 50 ? '...' : ''), col1X + 35, metaY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('COMISIÓN:', col1X, metaY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.text(comisionNombre, col1X + 35, metaY + 14.5);

  const formattedDate = new Date(minuta.fechaHora).toLocaleDateString('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' - ' + new Date(minuta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA Y HORA:', col2X, metaY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.text(formattedDate, col2X + 35, metaY + 14.5);

  // Participants block
  const miembrosNombres = minuta.miembrosComision
    .map(id => socios.find(s => s.id === id)?.nombre || '')
    .filter(Boolean)
    .join(', ');

  doc.setFont('helvetica', 'bold');
  doc.text('ASISTENTES COMISIÓN:', col1X, metaY + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(miembrosNombres.substring(0, 80) + (miembrosNombres.length > 80 ? '...' : ''), col1X + 38, metaY + 20.5);

  let y = 72;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 22;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      doc.setFillColor(27, 54, 93);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFillColor(234, 179, 8);
      doc.rect(0, 12, pageWidth, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Minuta: ${minuta.tema} - Página ${doc.internal.pages.length - 1}`, margin, 18);
      y = 26;
    }
  };

  // Title for discussion points
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 54, 93);
  doc.text('PUNTOS DISCUTIDOS Y ACUERDOS TOMADOS:', margin, y);
  y += 8;

  minuta.puntos.forEach((p, idx) => {
    checkPageOverflow(30);

    // Number circle representation
    doc.setFillColor(27, 54, 93);
    doc.circle(margin + 3, y + 2, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text((idx + 1).toString(), margin + 3, y + 3, { align: 'center' });

    // Title of the point
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(27, 54, 93);
    doc.text(p.punto, margin + 9, y + 2.5);
    y += 7;

    // Discussion text
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    const splitDiscusion = doc.splitTextToSize(p.discusion, contentWidth - 12);
    splitDiscusion.forEach((subLine: string) => {
      checkPageOverflow(6.5);
      doc.text(subLine, margin + 9, y);
      y += 5.5;
    });

    y += 4; // spacing between points
  });

  // Footer / stamp section
  checkPageOverflow(30);
  y += 10;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.25);
  const stampW = 70;
  const stampH = 7;
  const stampX = (pageWidth - stampW) / 2;
  doc.roundedRect(stampX, y, stampW, stampH, 1.5, 1.5, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(217, 119, 6);
  doc.text('REGISTRO DE MINUTAS - COMITÉ DE SERVICIO', pageWidth / 2, y + 4.8, { align: 'center' });

  // Document Footer (all pages)
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento de carácter privado y confidencial - Club de Leones de Quetzaltenango © 2026', 
      margin, 
      pageHeight - 10
    );
    doc.text(
      `Pág. ${i} de ${pageCount}`, 
      pageWidth - margin - 15, 
      pageHeight - 10
    );
  }

  // Handle PDF Output
  if (action === 'open') {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  } else {
    const cleanTitle = minuta.tema.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`minuta-${cleanTitle}.pdf`);
  }
};

export interface CartaInvitacionInput {
  nombreCandidato: string;
  generoCandidato: 'Masculino' | 'Femenino';
}

export const generateCartasInvitacionPDF = (
  candidatos: CartaInvitacionInput[],
  fechaCharla: string,
  fechaLimite: string,
  action: 'download' | 'open' = 'download'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  let presidentName = 'Edwin Ernesto Pacheco López';
  try {
    const local = localStorage.getItem('club_leones_socios_v3') || localStorage.getItem('club_leones_socios');
    if (local) {
      const sociosList = JSON.parse(local);
      const president = sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
      if (president) presidentName = president.nombre;
    }
  } catch (e) {}

  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const today = new Date();
  const dateString = `Quetzaltenango, ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}`;

  for (let i = 0; i < candidatos.length; i++) {
    if (i > 0) {
      doc.addPage();
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Header Blue Bar (Primary Color)
    doc.setFillColor(27, 54, 93); // Blue-900
    doc.rect(0, 0, pageWidth, 15, 'F');
    
    // Header Gold Bar (Secondary Accent Color)
    doc.setFillColor(234, 179, 8); // Yellow-500
    doc.rect(0, 15, pageWidth, 2, 'F');

    // Draw Vector Logo
    const logoX = margin;
    const logoY = 22;
    const logoRadius = 7;
    doc.setFillColor(27, 54, 93);
    doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius, 'F');
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.5);
    doc.circle(logoX + logoRadius, logoY + logoRadius, logoRadius - 0.5, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(234, 179, 8);
    doc.text('L', logoX + logoRadius, logoY + logoRadius + 4.5, { align: 'center' });

    // Title Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(27, 54, 93);
    doc.text('CLUB DE LEONES DE QUETZALTENANGO', logoX + 18, logoY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(217, 119, 6);
    doc.text('NOSOTROS SERVIMOS', logoX + 18, logoY + 11.5);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 42, pageWidth - margin, 42);

    // Date
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(dateString, pageWidth - margin, 52, { align: 'right' });

    // Recipient
    const salutation = candidatos[i].generoCandidato === 'Femenino' ? 'Estimada' : 'Estimado';
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(27, 54, 93);
    doc.text(`${salutation} ${candidatos[i].nombreCandidato},`, margin, 65);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text('Presente.', margin, 71);

    // Body Paragraph 1
    const p1 = 'Como presidente del Club de Leones de Quetzaltenango, me complace extenderte una cordial invitación para que formes parte de nuestra distinguida organización. Los Leones somos un grupo comprometido con el servicio voluntario y la mejora de nuestras comunidades locales, y al participar conjuntamente nos convierte en una gran familia a nosotros los socios.';
    let y = 80;
    const splitP1 = doc.splitTextToSize(p1, contentWidth);
    splitP1.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });

    // Event Details elegant Box
    y += 2;
    const items = [
      { label: 'Evento:', value: 'Charla informativa sobre el Club de Leones y sus actividades de voluntariado.' },
      { label: 'Fecha de la Charla:', value: fechaCharla },
      { label: 'Hora:', value: '20:00 horas' },
      { label: 'Lugar:', value: 'Sede del Club de Leones de Quetzaltenango' },
      { label: 'Dirección:', value: 'Calle Rodolfo Robles 24-53 zona 1 (abajo del Templo Minerva)' }
    ];

    let calculatedBoxHeight = 8; // top/bottom padding
    items.forEach(item => {
      const splitVal = doc.splitTextToSize(item.value, contentWidth - 46);
      calculatedBoxHeight += 4.5 + (splitVal.length - 1) * 4.5 + 2;
    });

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, calculatedBoxHeight, 2.5, 2.5, 'FD');

    const labelX = margin + 5;
    const valueX = margin + 42;
    let currentY = y + 6;

    items.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 54, 93);
      doc.text(item.label, labelX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const valWidth = contentWidth - 48;
      const splitVal = doc.splitTextToSize(item.value, valWidth);
      splitVal.forEach((line: string, idx: number) => {
        doc.text(line, valueX, currentY + (idx * 4.5));
      });
      currentY += 4.5 + (splitVal.length - 1) * 4.5 + 2;
    });

    y += calculatedBoxHeight + 8;

    // Body Paragraph 2
    const p2 = 'Durante esta charla, compartiremos detalles sobre nuestras iniciativas, proyectos y cómo contribuimos al bienestar de nuestra comunidad. También nos gustaría conocer más sobre ti y tus intereses para que puedas encontrar un espacio significativo dentro de nuestro club.';
    doc.setFont('times', 'normal');
    const splitP2 = doc.splitTextToSize(p2, contentWidth);
    splitP2.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });

    // Body Paragraph 3
    y += 2;
    const p3 = `Por favor confirmar tu asistencia antes del ${fechaLimite}. Puedes comunicarte con nosotros llamando o al WhatsApp al número de teléfono 5691 1935.`;
    const splitP3 = doc.splitTextToSize(p3, contentWidth);
    splitP3.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });

    // Body Paragraph 4
    y += 2;
    const p4 = 'Esperamos contar con tu presencia y entusiasmo. Juntos podemos marcar la diferencia en Quetzaltenango.';
    const splitP4 = doc.splitTextToSize(p4, contentWidth);
    splitP4.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });

    // Signatures
    y += 12;
    doc.text('Atentamente,', margin, y);

    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(27, 54, 93);
    doc.text(presidentName, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Presidente', margin, y + 4.5);
    doc.text('Club de Leones de Quetzaltenango', margin, y + 9);

    // Stamp
    const stampY = y - 10;
    const stampX = pageWidth - margin - 65;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.2);
    doc.roundedRect(stampX, stampY, 60, 7, 1.5, 1.5, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(217, 119, 6);
    doc.text('INVITACIÓN OFICIAL - COMITÉ DE AFILIACIÓN', stampX + 30, stampY + 4.8, { align: 'center' });

    // Footer decoration
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Nosotros Servimos - Lions Clubs International', margin, pageHeight - 10);
    doc.text(`Carta ${i + 1} de ${candidatos.length}`, pageWidth - margin - 15, pageHeight - 10);
  }

  // Handle PDF Output
  if (action === 'open') {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`cartas-invitacion.pdf`);
  }
};

