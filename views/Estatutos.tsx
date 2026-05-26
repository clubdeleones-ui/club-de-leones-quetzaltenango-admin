import React, { useState, useMemo, useEffect } from 'react';
import { CLUB_STATUTES } from '../constants';
import { ShieldCheck, Scale, ScrollText, Loader2, Search, List, ChevronRight, Hash, Bookmark } from 'lucide-react';
import { googleService, GOOGLE_CONFIG } from '../services/googleService';
import { parseStatutes, StatuteSection } from '../utils/textParser';

const SUGGESTIONS = ['Membresía', 'Cuotas', 'Junta Directiva', 'Sesiones', 'Votaciones', 'Expulsión'];

interface EstatutosProps {
  accessToken?: string;
}

const Estatutos: React.FC<EstatutosProps> = ({ accessToken }) => {
  const [rawContent, setRawContent] = useState<string>(CLUB_STATUTES);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sections = useMemo(() => parseStatutes(rawContent), [rawContent]);

  useEffect(() => {
    const fetchStatutes = async () => {
      setLoading(true);
      try {
        await googleService.initClient();
        if (accessToken) {
          googleService.setAccessToken(accessToken);
        }
        const realContent = await googleService.fetchDocContent(GOOGLE_CONFIG.ESTATUTOS_DOC_ID);
        if (realContent) setRawContent(realContent);
      } catch (error) {
        console.error('Error fetching statutes, using fallback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatutes();
  }, [accessToken]);

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const lowerQuery = searchTerm.toLowerCase();
    return sections.filter(s =>
      s.text.toLowerCase().includes(lowerQuery) ||
      (s.subText && s.subText.toLowerCase().includes(lowerQuery))
    );
  }, [searchTerm, sections]);

  const toc = useMemo(() => sections.filter(s => s.type === 'title' || s.type === 'article'), [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-yellow-200 text-blue-900 rounded px-1">{part}</mark>
            : part
        )}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search Header */}
      <section className="sticky top-20 z-40 bg-slate-50/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-blue-100 shadow-lg mb-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="relative group">
            <Search className="absolute left-6 top-5 text-slate-400 group-focus-within:text-blue-900 transition-colors" size={24} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="¿Qué estás buscando en los estatutos? (ej. cuotas, expulsión...)"
              className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none transition-all text-lg"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Sugerencias:</span>
            {SUGGESTIONS.map(sug => (
              <button
                key={sug}
                onClick={() => setSearchTerm(sug)}
                className="text-xs bg-blue-50 text-blue-900 font-bold px-4 py-2 rounded-full hover:bg-blue-900 hover:text-white transition-all border border-blue-100"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Table of Contents - Desktop Sidebar */}
        <aside className="hidden lg:block w-80 sticky top-60 h-[calc(100vh-200px)] overflow-y-auto pr-4 scrollbar-hide">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-blue-900 font-black uppercase tracking-tighter text-xl">
              <List size={24} />
              <span>Índice de Contenidos</span>
            </div>
            <nav className="space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 group ${activeId === item.id
                      ? 'bg-blue-900 text-white shadow-lg'
                      : 'hover:bg-blue-50 text-slate-600'
                    }`}
                >
                  {item.type === 'title' ? (
                    <Bookmark size={18} className={activeId === item.id ? 'text-yellow-400' : 'text-blue-900'} />
                  ) : (
                    <ChevronRight size={18} className="opacity-40" />
                  )}
                  <span className={`text-sm ${item.type === 'title' ? 'font-black' : 'font-medium'}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-12">
          {loading ? (
            <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center space-y-6">
              <Loader2 className="animate-spin text-blue-900" size={64} />
              <p className="text-xl text-slate-400 font-bold animate-pulse">Sincronizando con Google Docs...</p>
            </div>
          ) : (
            <article className="bg-white p-10 md:p-20 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <ShieldCheck size={200} className="text-blue-900" />
              </div>

              {filteredSections.map((section) => {
                if (section.type === 'title') {
                  return (
                    <div id={section.id} key={section.id} className="pt-8 border-t-2 border-slate-50 first:border-0 first:pt-0">
                      <h2 className={`text-3xl font-black text-blue-900 uppercase italic tracking-tighter ${section.level === 1 ? 'text-4xl' : 'text-2xl mt-4 text-slate-800'}`}>
                        {highlightText(section.text, searchTerm)}
                      </h2>
                    </div>
                  );
                }
                if (section.type === 'article') {
                  return (
                    <div id={section.id} key={section.id} className="group scroll-mt-60">
                      <div className="flex items-center space-x-3 mb-4">
                        <Hash className="text-yellow-500" size={24} />
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                          {highlightText(section.text, searchTerm)}
                        </h3>
                      </div>
                      {section.subText && (
                        <h4 className="text-xl font-bold text-blue-900/60 mb-6 italic">
                          {highlightText(section.subText, searchTerm)}
                        </h4>
                      )}
                    </div>
                  );
                }
                return (
                  <p key={section.id} className="text-xl text-slate-700 leading-[1.8] text-justify font-serif selection:bg-blue-900 selection:text-white">
                    {highlightText(section.text, searchTerm)}
                  </p>
                );
              })}

              {filteredSections.length === 0 && (
                <div className="text-center py-20 space-y-4">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Search size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">No encontramos resultados</h3>
                  <p className="text-slate-500">Intenta con otras palabras clave o revisa el índice lateral.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-900 font-bold hover:underline"
                  >
                    Ver todo el reglamento
                  </button>
                </div>
              )}
            </article>
          )}

          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-12 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <div className="relative z-10 text-center md:text-left">
              <h3 className="text-3xl font-black mb-2">Consulta de Socios Directivos</h3>
              <p className="text-blue-100 text-lg font-light max-w-lg">Cualquier duda sobre la interpretación de estos estatutos, favor consultar con la Primer Vice-Presidencia.</p>
            </div>
            <button className="relative z-10 whitespace-nowrap bg-yellow-400 text-blue-950 px-10 py-5 rounded-2xl font-black text-xl hover:bg-yellow-300 transition-all shadow-xl shadow-yellow-500/20 active:scale-95">
              Contactar Comité Legal
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Estatutos;
