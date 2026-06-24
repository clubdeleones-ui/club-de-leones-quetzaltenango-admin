import React, { useState, useMemo } from 'react';
import { MOCK_ACTAS } from '../constants';
import { Search, FileText, Download, Eye, Sparkles, MessageCircle, X, Loader2, Calendar, User, HelpCircle } from 'lucide-react';
import { googleService } from '../services/googleService';
import { geminiService } from '../services/geminiService';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { Acta } from '../types';
import { generateActaPDF, generateActaCode } from '../utils/pdfGenerator';
import { FormattedActa } from '../components/FormattedActa';

interface ActasProps {
  accessToken?: string;
}

const Actas: React.FC<ActasProps> = ({ accessToken }) => {
  const { actas: dbActas, socios } = useClubData();
  const [actas, setActas] = useState<Acta[]>(dbActas);

  React.useEffect(() => {
    setActas(dbActas);
  }, [dbActas]);

  const { presidentName, secretaryName } = useMemo(() => {
    let pName = 'Edwin Ernesto Pacheco López';
    let sName = 'Flor Rodríguez Cifuentes';
    
    const president = socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
    const secretary = socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario del club') || s.puesto?.toLowerCase() === 'secretario') || socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario'));
    
    if (president) pName = president.nombre;
    if (secretary) sName = secretary.nombre;
    
    return { presidentName: pName, secretaryName: sName };
  }, [socios]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | 'Ordinaria' | 'Extraordinaria' | 'Reunión de Comisión'>('Todas');
  const [selectedYear, setSelectedYear] = useState<string>('Todos');
  
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingActas, setLoadingActas] = useState(false);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);

  // Sincronización de actas administrada por el ClubDataContext global

  // Sync Google Drive files if logged in
  React.useEffect(() => {
    const fetchActas = async () => {
      if (!accessToken) return;
      setLoadingActas(true);
      try {
        await googleService.initClient();
        googleService.setAccessToken(accessToken);
        const driveFiles = await googleService.fetchActasFromDrive('root');
        if (driveFiles && driveFiles.length > 0) {
          const transformedActas: Acta[] = driveFiles.map((file: any) => ({
            id: file.id,
            titulo: file.name,
            fecha: new Date(file.createdTime).toISOString().split('T')[0],
            contenido: 'Documento en Google Drive. Haz clic en "Ver en Drive" para abrirlo.',
            autor: 'Sistema Drive',
            pdfUrl: file.webViewLink,
            categoria: 'Ordinaria'
          }));
          
          // Merge with localStorage
          setActas(prev => {
            const merged = [...prev];
            transformedActas.forEach(ta => {
              if (!merged.some(m => m.id === ta.id)) {
                merged.push(ta);
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('Error fetching actas from Drive:', error);
      } finally {
        setLoadingActas(false);
      }
    };
    fetchActas();
  }, [accessToken]);

  // Extract years
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    actas.forEach(a => {
      if (a.fecha) {
        const yStr = a.fecha.split('-')[0];
        if (yStr && yStr.length === 4) {
          yearsSet.add(yStr);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [actas]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = actas.length;
    const latest = actas.length > 0 
      ? [...actas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0].fecha 
      : 'Sin registros';

    const authors: Record<string, number> = {};
    actas.forEach(a => {
      authors[a.autor] = (authors[a.autor] || 0) + 1;
    });
    let topAuthor = 'N/A';
    let maxCount = 0;
    Object.entries(authors).forEach(([auth, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topAuthor = auth;
      }
    });

    return { total, latest, topAuthor };
  }, [actas]);

  // Filter logic
  const filteredActas = useMemo(() => {
    return actas.filter(a => {
      const matchesSearch = a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.contenido.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || a.categoria === selectedCategory;
      const matchesYear = selectedYear === 'Todos' || (a.fecha && a.fecha.startsWith(selectedYear));
      return matchesSearch && matchesCategory && matchesYear;
    });
  }, [actas, searchTerm, selectedCategory, selectedYear]);

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setLoadingAi(true);
    const result = await geminiService.summarizeActas(actas, aiQuery);
    setAiResult(result);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-extrabold text-blue-900 tracking-tight">Libro de Actas Digital</h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Consulta, visualiza e imprime el registro histórico oficial de nuestras sesiones.</p>
        </div>
      </header>

      {/* Statistics Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in duration-300">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 text-blue-900 p-3.5 rounded-2xl">
            <FileText size={24} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Actas Archivadas</span>
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl">
            <Calendar size={24} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Última Sesión</span>
            <span className="text-base font-extrabold text-slate-800">{stats.latest}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl">
            <User size={24} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Redactor Principal</span>
            <span className="text-sm font-extrabold text-slate-800 truncate block max-w-[150px]">{stats.topAuthor}</span>
          </div>
        </div>
      </section>

      {/* Smart AI Search Box */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-3xl -mr-32 -mt-32 rounded-full group-hover:bg-yellow-500/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-yellow-500 p-2.5 rounded-xl">
              <Sparkles className="text-blue-900" size={22} />
            </div>
            <h2 className="text-2xl font-black italic tracking-tight uppercase">Búsqueda Inteligente</h2>
          </div>
          <p className="text-blue-100 mb-6 text-base font-light leading-relaxed">
            Pregúntale a nuestra IA sobre resoluciones, debates, acuerdos o temas tratados en actas anteriores.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Escribe tu duda aquí..."
              className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-md text-sm font-semibold"
            />
            <button
              onClick={handleAiSearch}
              disabled={loadingAi}
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-black px-8 py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0 w-full sm:w-auto"
            >
              {loadingAi ? 'Buscando...' : (
                <>
                  <span>Consultar</span>
                  <Sparkles size={18} />
                </>
              )}
            </button>
          </div>

          {/* AI Suggestion Chips */}
          <div className="mt-6 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-wider flex items-center shrink-0">
              <HelpCircle size={13} className="mr-1" /> Preguntas sugeridas:
            </span>
            {[
              '¿Qué se acordó sobre la remodelación de la cueva?',
              'Resumen de asambleas ordinarias',
              '¿Qué solicitudes de sillas de ruedas se aprobaron?'
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiQuery(q);
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs text-blue-100 hover:text-white font-medium transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {aiResult && (
            <div className="mt-8 bg-white/10 p-6 rounded-[2rem] border border-white/20 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-400 flex items-center">
                  <MessageCircle size={16} className="mr-2" /> Respuesta de IA
                </span>
                <button onClick={() => setAiResult(null)} className="text-white/50 hover:text-white transition-colors p-1"><X size={18} /></button>
              </div>
              <p className="text-sm md:text-base leading-relaxed font-normal whitespace-pre-wrap">{aiResult}</p>
            </div>
          )}
        </div>
      </section>

      {/* Filtering and Query Tools */}
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-6 top-5 text-slate-400 group-focus-within:text-blue-900 transition-colors" size={24} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, fecha o contenido de sesión..."
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none transition-all text-base font-semibold"
          />
        </div>

        {/* Categories and Date Filters */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-nowrap overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none w-[calc(100%+2rem)] sm:w-auto gap-2">
            {(['Todas', 'Ordinaria', 'Extraordinaria', 'Reunión de Comisión'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-900 text-white shadow-md shadow-blue-900/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                {cat === 'Todas' ? 'Todas las Actas' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Año de Sesión:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-900/10 transition-all cursor-pointer"
            >
              <option value="Todos">Todos los años</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actas List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loadingActas ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <Loader2 className="animate-spin text-blue-900 mb-4" size={48} />
              <p className="text-slate-400 font-bold">Sincronizando con Google Drive...</p>
            </div>
          ) : (
            <>
              {filteredActas.map(acta => {
                // Get brief extract of content
                const cleanExcerpt = acta.contenido
                  .replace(/^[A-ZÁÉÍÓÚÑ\s0-9]+:$/gm, '') // strip headers
                  .replace(/\s+/g, ' ') // normalize spaces
                  .trim();
                const excerpt = cleanExcerpt.length > 130 ? cleanExcerpt.substring(0, 130) + '...' : cleanExcerpt;

                const code = acta.codigoRegistro || generateActaCode(
                  acta.categoria || 'Ordinaria',
                  acta.fecha,
                  acta.numeroActa || '1',
                  presidentName,
                  acta.titulo
                );

                return (
                  <div key={acta.id} className="bg-white border border-slate-200/70 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative text-left">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      {/* Simulated official document sheet visual */}
                      <div className="w-20 h-28 bg-blue-900 rounded-2xl relative shadow-md shrink-0 flex flex-col justify-between p-2.5 overflow-hidden group-hover:scale-105 transition-transform duration-300 border border-blue-950 select-none">
                        {/* Top gold bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-500" />
                        <div className="text-[7px] text-yellow-400 font-black tracking-widest text-center mt-1 uppercase">
                          LEONES
                        </div>
                        {/* Seal background logo */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/5 text-4xl font-black select-none pointer-events-none">
                          L
                        </div>
                        <div className="text-center z-10">
                          <span className="block text-[8px] font-black text-white leading-none">ACTA</span>
                          <span className="block text-[6px] text-blue-200 font-bold mt-0.5">OFICIAL</span>
                        </div>
                        <div className="flex justify-between items-center z-10">
                          <div className="w-5 h-5 rounded-full border border-dashed border-yellow-500/40 flex items-center justify-center">
                            <span className="text-[5px] text-yellow-500 font-black">L</span>
                          </div>
                          <span className="text-[6px] text-slate-300 font-extrabold">{acta.fecha.split('-')[0]}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 flex-grow text-left">
                        {/* Badges row */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            acta.categoria === 'Extraordinaria'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : acta.categoria === 'Reunión de Comisión'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {acta.categoria || 'Ordinaria'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100 text-[9px] font-bold">
                            {acta.fecha}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-blue-900 transition-colors leading-snug">
                          {acta.titulo}
                        </h3>

                        <p className="text-xs text-slate-500 leading-relaxed font-serif text-justify">
                          {excerpt}
                        </p>

                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100/50 mt-2">
                          <span className="text-[10px] text-slate-400 font-medium">Código:</span>
                          <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded break-all tracking-tight font-mono">
                            {code}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-150">
                      {acta.pdfUrl && acta.pdfUrl.startsWith('http') ? (
                        <a
                          href={acta.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 text-blue-900 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer hover:shadow-sm"
                        >
                          <Eye size={14} />
                          <span>Ver en Drive</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => setSelectedActa(acta)}
                          className="px-4 py-2.5 text-blue-900 hover:bg-blue-50 border border-slate-200/80 rounded-xl transition-all font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer hover:shadow-sm"
                        >
                          <Eye size={14} />
                          <span>Leer Digital</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => generateActaPDF(acta, 'open')}
                        className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl transition-all font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer hover:shadow-md"
                      >
                        <FileText size={14} />
                        <span>Ver PDF</span>
                      </button>

                      <button
                        onClick={() => generateActaPDF(acta, 'download')}
                        className="col-span-2 py-2 text-slate-500 hover:text-slate-750 hover:bg-slate-50 rounded-xl transition-all font-bold text-xs flex items-center justify-center space-x-1 border border-dashed border-slate-200 mt-1 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Descargar Documento PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredActas.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-400 italic bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  No se encontraron actas con esos criterios de búsqueda.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reader Modal */}
      {selectedActa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-blue-900/20 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] max-w-5xl w-full h-[93vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 shadow-2xl border border-white/20">
            <div className="py-4 px-6 sm:py-5 sm:px-8 border-b border-slate-100 flex justify-between items-center bg-blue-900 text-white relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
              <div className="text-left pr-12 sm:pr-16">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black truncate max-w-[280px] sm:max-w-lg md:max-w-2xl">{selectedActa.titulo}</h3>
                <p className="text-[10px] sm:text-xs text-blue-200 mt-0.5 uppercase tracking-widest font-bold">{selectedActa.fecha} • SECRETARÍA</p>
              </div>
              <button 
                onClick={() => setSelectedActa(null)} 
                className="absolute top-3.5 right-4 sm:top-4.5 sm:right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-3 sm:p-5 md:p-8 overflow-y-auto bg-slate-150/50 flex-grow shadow-inner">
              <FormattedActa
                titulo={selectedActa.titulo}
                fecha={selectedActa.fecha}
                categoria={selectedActa.categoria || 'Ordinaria'}
                autor={selectedActa.autor}
                contenido={selectedActa.contenido}
                presidentName={presidentName}
                secretaryName={secretaryName}
                numeroActa={selectedActa.numeroActa || '1'}
                codigoRegistro={selectedActa.codigoRegistro}
              />
            </div>

            <div className="py-4 px-6 sm:py-5 sm:px-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-black tracking-tighter italic">Propiedad Privada • Club de Leones Quetzaltenango</p>
              <div className="flex space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedActa(null)}
                  className="flex-grow sm:flex-none px-6 py-2.5 text-slate-500 font-bold hover:text-slate-850 text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => generateActaPDF(selectedActa, 'open')}
                  className="flex-grow sm:flex-none bg-blue-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-xl shadow-blue-900/10 active:scale-95 transition-all cursor-pointer"
                >
                  Ver PDF Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actas;
