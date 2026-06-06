import React from 'react';
import { Calendar, User, Award, FileText } from 'lucide-react';

interface FormattedActaProps {
  titulo: string;
  fecha: string;
  categoria?: string;
  autor: string;
  contenido: string;
}

export const FormattedActa: React.FC<FormattedActaProps> = ({
  titulo,
  fecha,
  categoria = 'Ordinaria',
  autor,
  contenido,
}) => {
  // Parse the text into styled blocks
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const blocks: React.ReactNode[] = [];
    
    let currentListItems: React.ReactNode[] = [];
    let inList = false;

    const flushList = (key: number) => {
      if (currentListItems.length > 0) {
        blocks.push(
          <ul key={`list-${key}`} className="space-y-2 mb-4 pl-4 font-sans">
            {...currentListItems}
          </ul>
        );
        currentListItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        flushList(index);
        return;
      }

      // Check if it is a major header (all uppercase ending in ":" and length > 3)
      const isHeader = /^[A-ZÁÉÍÓÚÑ\s0-9]+:$/.test(trimmed) && trimmed.length > 3;

      if (isHeader) {
        flushList(index);
        blocks.push(
          <h4
            key={`header-${index}`}
            className="text-blue-900 font-sans font-black text-sm uppercase tracking-wider border-l-4 border-yellow-500 pl-3 mt-8 mb-4 first:mt-2"
          >
            {trimmed}
          </h4>
        );
      } else {
        // Check if list item (starts with "-", "*" or a digit/dot like "1.")
        const isListItem = trimmed.startsWith('-') || /^\d+\./.test(trimmed);

        if (isListItem) {
          inList = true;
          // Clean the starting indicator for presentation
          const listText = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
          const isNumbered = /^\d+\./.test(trimmed);
          const prefix = trimmed.match(/^\d+\./)?.[0];

          currentListItems.push(
            <li key={`li-${index}`} className="flex items-start space-x-2 text-slate-700 text-sm leading-relaxed text-justify">
              {isNumbered ? (
                <span className="text-yellow-600 font-bold shrink-0">{prefix}</span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
              )}
              <span>{listText}</span>
            </li>
          );
        } else {
          flushList(index);
          blocks.push(
            <p
              key={`p-${index}`}
              className="text-slate-700 text-[13.5px] leading-relaxed mb-4 text-justify font-serif"
            >
              {trimmed}
            </p>
          );
        }
      }
    });

    flushList(lines.length);
    return blocks;
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 md:p-12 shadow-xl relative overflow-hidden max-w-3xl mx-auto text-left group select-all">
      {/* Decorative top bars */}
      <div className="absolute top-0 left-0 w-full h-3 bg-blue-900" />
      <div className="absolute top-3 left-0 w-full h-1 bg-yellow-500" />

      {/* Subtle background medallion */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-4 border-yellow-500/[0.025] rounded-full flex items-center justify-center pointer-events-none select-none">
        <span className="text-yellow-500/[0.03] text-9xl font-black font-sans">L</span>
      </div>

      {/* Official Header */}
      <div className="text-center mt-4 mb-8">
        <h3 className="font-sans font-black text-xl md:text-2xl text-blue-900 uppercase tracking-tight">
          Club de Leones de Quetzaltenango
        </h3>
        <p className="font-sans text-xs text-yellow-650 font-extrabold uppercase tracking-widest mt-1.5">
          Distrito D-4 Guatemala • Nosotros Servimos
        </p>
        <div className="w-24 h-0.5 bg-slate-200 mx-auto mt-4" />
      </div>

      {/* Metadata Grid Card */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-[2rem] sm:rounded-3xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 font-sans grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-3 text-slate-700">
          <div className="bg-blue-50 text-blue-900 p-2.5 rounded-xl shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Título de Acta</span>
            <span className="text-sm font-extrabold text-slate-800 leading-tight">{titulo}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-700">
          <div className="bg-blue-50 text-blue-900 p-2.5 rounded-xl shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha de Sesión</span>
            <span className="text-sm font-extrabold text-slate-800 leading-tight">{fecha}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-700">
          <div className="bg-blue-50 text-blue-900 p-2.5 rounded-xl shrink-0">
            <Award size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Categoría</span>
            <span className="text-sm font-extrabold text-slate-800 leading-tight">{categoria}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-700">
          <div className="bg-blue-50 text-blue-900 p-2.5 rounded-xl shrink-0">
            <User size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Redactor / Autor</span>
            <span className="text-sm font-extrabold text-slate-800 leading-tight">{autor}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border-t border-b border-slate-100 py-6 my-6 min-h-[300px]">
        {parseContent(contenido)}
      </div>

      {/* Signatures Block */}
      <div className="mt-12 pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 font-sans">
        <div className="flex flex-col items-center text-center">
          <div className="w-48 h-px bg-slate-350 mb-3" />
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Firma del Secretario</span>
          <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase italic">{autor}</span>
          <span className="text-[9px] text-slate-400">Secretario de Actas</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-48 h-px bg-slate-350 mb-3" />
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Firma del Presidente</span>
          <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase italic">Junta Directiva</span>
          <span className="text-[9px] text-slate-400">Presidente del Club</span>
        </div>
      </div>

      {/* Official Stamp Decoration */}
      <div className="mt-8 flex justify-center opacity-30 select-none pointer-events-none">
        <div className="border border-dashed border-yellow-650/50 rounded-full p-2">
          <div className="border border-yellow-650/40 rounded-full px-6 py-1.5 text-[8px] font-black text-yellow-750 uppercase tracking-widest">
            SELLO CLUB DE LEONES QX
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-slate-100 text-center font-sans">
        <p className="text-[9px] text-slate-400 uppercase tracking-wider leading-relaxed">
          Documento oficial de carácter privado y confidencial.
          <br />
          Club de Leones de Quetzaltenango © 2026. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
