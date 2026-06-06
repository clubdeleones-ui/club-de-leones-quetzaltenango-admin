
import React, { useState } from 'react';
import { MOCK_ACTAS } from '../constants';
import { Search, FileText, Download, Eye, Sparkles, MessageCircle, X, Loader2 } from 'lucide-react';
import { googleService, GOOGLE_CONFIG } from '../services/googleService';
import { geminiService } from '../services/geminiService';
import { generateActaPDF } from '../utils/pdfGenerator';
import { FormattedActa } from '../components/FormattedActa';

interface ActasProps {
  accessToken?: string;
}

const Actas: React.FC<ActasProps> = ({ accessToken }) => {
  const [actas, setActas] = useState<Acta[]>(MOCK_ACTAS);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingActas, setLoadingActas] = useState(false);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);

  React.useEffect(() => {
    const fetchActas = async () => {
      if (!accessToken) return;
      setLoadingActas(true);
      try {
        await googleService.initClient();
        googleService.setAccessToken(accessToken);
        // En una implementación real buscaríamos una carpeta específica
        // Por ahora listamos archivos recientes si estamos logueados
        const driveFiles = await googleService.fetchActasFromDrive('root');
        if (driveFiles && driveFiles.length > 0) {
          const transformedActas: Acta[] = driveFiles.map((file: any) => ({
            id: file.id,
            titulo: file.name,
            fecha: new Date(file.createdTime).toLocaleDateString(),
            contenido: 'Documento en Google Drive. Haz clic en "Leer ahora" para abrirlo.',
            autor: 'Sistema Drive',
            pdfUrl: file.webViewLink
          }));
          setActas([...MOCK_ACTAS, ...transformedActas]);
        }
      } catch (error) {
        console.error('Error fetching actas from Drive:', error);
      } finally {
        setLoadingActas(false);
      }
    };
    fetchActas();
  }, [accessToken]);

  const filteredActas = actas.filter(a =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.contenido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setLoadingAi(true);
    const result = await geminiService.summarizeActas(MOCK_ACTAS, aiQuery);
    setAiResult(result);
    setLoadingAi(false);
  };

  const downloadPDF = (acta: Acta) => {
    generateActaPDF(acta);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-extrabold text-blue-900 tracking-tight">Libro de Actas Digital</h1>
          <p className="text-lg text-slate-500 mt-2">Consulta y descarga información histórica de las sesiones.</p>
        </div>
      </header>

      {/* Smart AI Search Box */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-3xl -mr-32 -mt-32 rounded-full group-hover:bg-yellow-500/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-yellow-500 p-2 rounded-xl">
              <Sparkles className="text-blue-900" size={24} />
            </div>
            <h2 className="text-2xl font-black italic tracking-tight uppercase">Búsqueda Inteligente</h2>
          </div>
          <p className="text-blue-100 mb-8 text-lg font-light leading-relaxed">
            Pregúntale a nuestra IA sobre temas discutidos en actas pasadas. <br />
            <span className="text-yellow-400 font-medium italic opacity-80">Por ejemplo: "¿Qué se acordó sobre la remodelación de la cueva?"</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Escribe tu duda aquí..."
              className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-md"
            />
            <button
              onClick={handleAiSearch}
              disabled={loadingAi}
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-black px-8 py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20 flex items-center space-x-2"
            >
              {loadingAi ? 'Buscando...' : (
                <>
                  <span>Consultar</span>
                  <Sparkles size={18} />
                </>
              )}
            </button>
          </div>
          {aiResult && (
            <div className="mt-8 bg-white/10 p-6 rounded-[2rem] border border-white/20 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-400 flex items-center">
                  <MessageCircle size={16} className="mr-2" /> Respuesta de IA
                </span>
                <button onClick={() => setAiResult(null)} className="text-white/50 hover:text-white transition-colors p-1"><X size={18} /></button>
              </div>
              <p className="text-lg leading-relaxed font-light">{aiResult}</p>
            </div>
          )}
        </div>
      </section>

      {/* List and Search */}
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-6 top-5 text-slate-400 group-focus-within:text-blue-900 transition-colors" size={24} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, fecha o contenido del acta..."
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none transition-all text-lg"
          />
        </div>

        <div className="grid gap-6">
          {loadingActas ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <Loader2 className="animate-spin text-blue-900 mb-4" size={48} />
              <p className="text-slate-400 font-bold">Sincronizando con Google Drive...</p>
            </div>
          ) : (
            <>
              {filteredActas.map(acta => (
                <div key={acta.id} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-blue-900 transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center space-x-6">
                      <div className="bg-blue-50 text-blue-900 p-4 rounded-2xl group-hover:bg-blue-900 group-hover:text-white transition-colors shadow-inner">
                        <FileText size={32} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-2xl text-slate-800 group-hover:text-blue-900 transition-colors leading-tight">{acta.titulo}</h3>
                        <p className="text-sm text-slate-400 mt-1 font-medium">Publicado por <span className="text-blue-900/60 font-bold uppercase">{acta.autor}</span> • {acta.fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {acta.pdfUrl.startsWith('http') ? (
                        <a
                          href={acta.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-grow md:flex-none px-6 py-3 text-blue-900 font-bold hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center space-x-2 border border-transparent hover:border-blue-100"
                        >
                          <Eye size={20} />
                          <span>Ver en Drive</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => setSelectedActa(acta)}
                          className="flex-grow md:flex-none px-6 py-3 text-blue-900 font-bold hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center space-x-2 border border-transparent hover:border-blue-100"
                        >
                          <Eye size={20} />
                          <span>Leer ahora</span>
                        </button>
                      )}

                      <button
                        onClick={() => downloadPDF(acta)}
                        className="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-100"
                        title="Descargar PDF"
                      >
                        <Download size={22} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredActas.length === 0 && (
                <div className="text-center py-20 text-slate-400 italic bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  No se encontraron actas con esos criterios.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reader Modal */}
      {selectedActa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-blue-900/20 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 shadow-2xl border border-white/20">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-blue-900 text-white relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
              <div>
                <h3 className="text-3xl font-black">{selectedActa.titulo}</h3>
                <p className="text-sm text-blue-200 mt-1 uppercase tracking-widest font-bold">{selectedActa.fecha} • SECRETARÍA</p>
              </div>
              <button onClick={() => setSelectedActa(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                <X size={28} />
              </button>
            </div>
            <div className="p-6 md:p-10 overflow-y-auto bg-slate-150/50 flex-grow shadow-inner">
              <FormattedActa
                titulo={selectedActa.titulo}
                fecha={selectedActa.fecha}
                categoria={selectedActa.categoria || 'Ordinaria'}
                autor={selectedActa.autor}
                contenido={selectedActa.contenido}
              />
            </div>
            <div className="p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400 uppercase font-black tracking-tighter italic">Propiedad Privada • Club de Leones Quetzaltenango</p>
              <div className="flex space-x-4 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedActa(null)}
                  className="flex-grow sm:flex-none px-8 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => downloadPDF(selectedActa)}
                  className="flex-grow sm:flex-none bg-blue-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                >
                  Descargar PDF
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
