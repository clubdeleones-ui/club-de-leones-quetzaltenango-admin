import React from 'react';
import { Calendar, User, Award, FileText, CheckCircle2, ShieldCheck, MapPin, Hash, Sparkles } from 'lucide-react';
import { generateActaCode } from '../utils/pdfGenerator';
import { cleanAndDeduplicateCL } from '../services/geminiService';

interface FormattedActaProps {
  titulo: string;
  fecha: string;
  categoria?: string;
  autor: string;
  contenido: string;
  presidentName?: string;
  secretaryName?: string;
  codigoRegistro?: string;
  numeroActa?: string;
}

export const FormattedActa: React.FC<FormattedActaProps> = ({
  titulo,
  fecha,
  categoria = 'Ordinaria',
  autor,
  contenido,
  presidentName = 'Edwin Ernesto Pacheco López',
  secretaryName = 'Flor Rodríguez Cifuentes',
  codigoRegistro,
  numeroActa,
}) => {
  // Generar código único si no existe
  const code = codigoRegistro || generateActaCode(
    categoria,
    fecha,
    numeroActa || '1',
    presidentName,
    titulo
  );

  // Parsear el contenido estructurado en bloques limpios y uniformes
  const parseActaBody = (rawText: string) => {
    if (!rawText) return null;
    
    // Normalizar C.L. y saltos de línea
    const text = cleanAndDeduplicateCL(rawText);
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    let currentSectionTitle = '';
    let currentParagraphs: string[] = [];
    let currentPointData: { num: string; tema: string; debate: string; acuerdo: string } | null = null;

    const flushParagraphs = (key: string) => {
      if (currentParagraphs.length > 0) {
        elements.push(
          <div key={`p-group-${key}`} className="space-y-3 my-3">
            {currentParagraphs.map((p, pIdx) => (
              <p key={`p-${key}-${pIdx}`} className="text-slate-800 text-[13.5px] leading-relaxed text-justify">
                {p}
              </p>
            ))}
          </div>
        );
        currentParagraphs = [];
      }
    };

    const flushPoint = (key: string) => {
      if (currentPointData) {
        elements.push(
          <div 
            key={`point-card-${key}`}
            className="my-5 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-amber-300/80 transition-all"
          >
            {/* Encabezado del Punto */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-5 py-3 text-white flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="bg-amber-400 text-blue-950 font-black text-[11px] px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  {currentPointData.num || 'Punto'}
                </span>
                <h5 className="font-black text-sm text-amber-100 tracking-tight">
                  {currentPointData.tema || 'Punto de Agenda'}
                </h5>
              </div>
            </div>

            <div className="p-5 space-y-4 text-left">
              {/* Debate / Discusión */}
              {currentPointData.debate && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2"></span>
                    Deliberación y Debate
                  </span>
                  <div className="text-slate-700 text-xs sm:text-[13px] leading-relaxed pl-3.5 border-l-2 border-slate-200 text-justify">
                    {currentPointData.debate}
                  </div>
                </div>
              )}

              {/* Acuerdo / Resolución */}
              {currentPointData.acuerdo && (
                <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-900">
                    <CheckCircle2 size={15} className="text-amber-600 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Acuerdo / Resolución Adoptada
                    </span>
                  </div>
                  <p className="text-slate-800 text-xs sm:text-[13px] font-semibold leading-relaxed pl-5 text-justify">
                    {currentPointData.acuerdo}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
        currentPointData = null;
      }
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();

      if (!line) {
        i++;
        continue;
      }

      // 1. Títulos Mayores (Secciones como ASISTENCIA Y QUÓRUM, PUNTOS DE AGENDA, etc.)
      if (/^[A-ZÁÉÍÓÚÑ\s0-9]{4,}:?$/.test(line) && !line.startsWith('PUNTO ') && !line.startsWith('TOTAL')) {
        flushPoint(`sec-${i}`);
        flushParagraphs(`sec-${i}`);
        const cleanTitle = line.replace(/:$/, '').trim();
        elements.push(
          <div key={`header-${i}`} className="mt-8 mb-4 pt-4 border-t border-slate-200/80 first:mt-2 first:border-0">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-5 bg-gradient-to-b from-blue-900 to-amber-500 rounded-xs"></span>
              <h4 className="text-blue-950 font-black text-sm uppercase tracking-wider">
                {cleanTitle}
              </h4>
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 2. Detección de Punto de Agenda (ej. "Punto 1: Tema...")
      const pointMatch = line.match(/^Punto\s+(\d+):\s*(.*)$/i);
      if (pointMatch) {
        flushPoint(`pt-${i}`);
        flushParagraphs(`pt-${i}`);

        const numStr = `PUNTO #${pointMatch[1]}`;
        const temaStr = pointMatch[2].trim();
        let debateStr = '';
        let acuerdoStr = '';

        i++;
        while (i < lines.length) {
          const subLine = lines[i].trim();
          if (/^Punto\s+\d+:/i.test(subLine) || (/^[A-ZÁÉÍÓÚÑ\s0-9]{4,}:?$/.test(subLine) && !subLine.startsWith('-') && !subLine.startsWith('PUNTO'))) {
            break;
          }
          if (subLine.startsWith('- Debate:') || subLine.startsWith('Debate:')) {
            debateStr = subLine.replace(/^[-*]?\s*Debate:\s*/i, '').trim();
          } else if (subLine.startsWith('- Acuerdo:') || subLine.startsWith('Acuerdo:')) {
            acuerdoStr = subLine.replace(/^[-*]?\s*Acuerdo:\s*/i, '').trim();
          } else if (debateStr && !acuerdoStr) {
            debateStr += ` ${subLine}`;
          } else if (acuerdoStr) {
            acuerdoStr += ` ${subLine}`;
          } else if (subLine) {
            debateStr = subLine;
          }
          i++;
        }

        currentPointData = {
          num: numStr,
          tema: temaStr,
          debate: cleanAndDeduplicateCL(debateStr),
          acuerdo: cleanAndDeduplicateCL(acuerdoStr)
        };
        flushPoint(`done-${i}`);
        continue;
      }

      // 3. Lista de Asistencia o Viñetas numeradas (ej. "1. Nombre")
      if (/^\d+\.\s+/.test(line)) {
        flushPoint(`list-${i}`);
        flushParagraphs(`list-${i}`);

        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }

        elements.push(
          <div key={`quorum-grid-${i}`} className="my-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {listItems.map((item, lIdx) => (
                <div key={`item-${lIdx}`} className="flex items-center space-x-2 text-slate-800 text-xs font-semibold py-1 px-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {lIdx + 1}
                  </span>
                  <span className="truncate">{cleanAndDeduplicateCL(item)}</span>
                </div>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // 4. Párrafo narrativo regular
      currentParagraphs.push(line);
      i++;
    }

    flushPoint('end');
    flushParagraphs('end');

    return elements;
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-[2.5rem] p-5 sm:p-8 md:p-12 shadow-xl relative overflow-hidden max-w-4xl mx-auto text-left group select-all font-sans text-slate-850">
      {/* Decorative top bars oficiales */}
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900" />
      <div className="absolute top-3 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

      {/* Marca de agua institucional de fondo */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
        <img 
          src="/images/logo.png" 
          alt="Lions Watermark" 
          className="w-full h-full object-contain grayscale"
        />
      </div>

      {/* Membrete Oficial Institucional con Logo */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 pb-6 mb-6 border-b-2 border-slate-100">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 border-2 border-amber-400/80 shadow-md flex items-center justify-center shrink-0">
            <img 
              src="/images/logo.png" 
              alt="Club de Leones Quetzaltenango" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-left space-y-1">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">
              Asociación Internacional de Clubes de Leones • Distrito B-4
            </span>
            <h2 className="font-black text-xl sm:text-2xl text-blue-950 uppercase tracking-tight leading-tight">
              Club de Leones de Quetzaltenango
            </h2>
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <span className="flex items-center">
                <MapPin size={13} className="text-blue-900 mr-1 shrink-0" />
                Quetzaltenango, Guatemala, C.A.
              </span>
              <span>•</span>
              <span className="text-amber-800 font-black italic">
                «Nosotros Servimos»
              </span>
            </div>
          </div>
        </div>

        {/* Badge Oficial del Acta */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:text-right shrink-0 shadow-2xs self-stretch sm:self-auto flex flex-col justify-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Sesión {categoria}
          </span>
          <span className="text-base font-black text-blue-950">
            {numeroActa ? `ACTA No. ${numeroActa}` : 'ACTA DE SESIÓN'}
          </span>
          <span className="text-xs font-bold text-slate-600">
            {fecha}
          </span>
        </div>
      </div>

      {/* Título Oficial del Documento */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-4 sm:p-5 rounded-2xl border border-blue-100/80 mb-6 text-center space-y-1">
        <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest bg-blue-100/80 px-3 py-0.5 rounded-full inline-block">
          Registro Oficial de Secretaría
        </span>
        <h3 className="text-base sm:text-lg font-black text-blue-950 uppercase tracking-tight">
          {titulo || 'Acta Oficial de Sesión Plenaria'}
        </h3>
      </div>

      {/* Ficha Técnica Protocolaria */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xs">
        <div className="flex items-center space-x-3 text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
          <div className="bg-blue-50 text-blue-950 p-2 rounded-lg shrink-0">
            <Hash size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Código de Registro</span>
            <span className="text-xs font-mono font-black text-blue-950 truncate block">{code}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
          <div className="bg-amber-50 text-amber-800 p-2 rounded-lg shrink-0">
            <Award size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Presidente en Turno</span>
            <span className="text-xs font-extrabold text-slate-800 truncate block">C.L. {presidentName.replace(/^C\.L\.\s*/i, '')}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
          <div className="bg-indigo-50 text-indigo-800 p-2 rounded-lg shrink-0">
            <User size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Secretario de Actas</span>
            <span className="text-xs font-extrabold text-slate-800 truncate block">C.L. {secretaryName.replace(/^C\.L\.\s*/i, '')}</span>
          </div>
        </div>
      </div>

      {/* Cuerpo y Desarrollo del Acta */}
      <div className="py-2 space-y-2 min-h-[250px]">
        {parseActaBody(contenido)}
      </div>

      {/* Bloque de Firmas Oficiales */}
      <div className="mt-14 pt-8 border-t-2 border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
        <div className="flex flex-col items-center justify-end">
          <div className="w-56 h-0.5 bg-slate-300 mb-2.5" />
          <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
            C.L. {secretaryName.replace(/^C\.L\.\s*/i, '')}
          </span>
          <span className="text-[11px] font-bold text-slate-500 uppercase">
            Secretario del Club
          </span>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
            Fe y constancia notarial interna
          </span>
        </div>

        <div className="flex flex-col items-center justify-end">
          <div className="w-56 h-0.5 bg-slate-300 mb-2.5" />
          <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
            C.L. {presidentName.replace(/^C\.L\.\s*/i, '')}
          </span>
          <span className="text-[11px] font-bold text-slate-500 uppercase">
            Presidente del Club
          </span>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
            Visto Bueno y Aprobación
          </span>
        </div>
      </div>

      {/* Sello y Certificación */}
      <div className="mt-10 pt-4 flex flex-col sm:flex-row items-center justify-between text-slate-400 border-t border-slate-100 gap-3 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={16} className="text-amber-500 shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-wider">
            Documento Certificado del Libro de Actas Oficial
          </p>
        </div>
        <p className="text-[9px] font-semibold">
          Club de Leones de Quetzaltenango © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
