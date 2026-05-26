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

  // Divider line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, 42, pageWidth - margin, 42);

  // Metadata block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate-600
  
  doc.text('Título:', margin, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(acta.titulo, margin + 25, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', margin, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(acta.fecha, margin + 25, 56);

  doc.setFont('helvetica', 'bold');
  doc.text('Categoría:', margin, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(acta.categoria || 'Reunión Ordinaria', margin + 25, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Redactor:', margin, 68);
  doc.setFont('helvetica', 'normal');
  doc.text(acta.autor, margin + 25, 68);

  // Divider line
  doc.line(margin, 74, pageWidth - margin, 74);

  // Content Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(27, 54, 93);
  doc.text('CONTENIDO Y ACUERDOS DE LA REUNIÓN', margin, 83);

  // Content Body
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // Slate-800

  // Multi-line wrap
  const splitText = doc.splitTextToSize(acta.contenido, contentWidth);
  
  let y = 92;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  for (let i = 0; i < splitText.length; i++) {
    if (y > pageHeight - bottomMargin) {
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

      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      y = 26; // Reset Y coordinate
    }
    doc.text(splitText[i], margin, y);
    y += 6.5; // Line spacing
  }

  // Signatures section
  if (y + 40 > pageHeight - bottomMargin) {
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

  // Save the PDF
  const cleanTitle = acta.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`acta-${cleanTitle}.pdf`);
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
