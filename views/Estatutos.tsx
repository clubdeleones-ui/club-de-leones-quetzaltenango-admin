import React, { useState, useMemo, useEffect } from 'react';
import { CLUB_STATUTES } from '../constants';
import { ShieldCheck, Scale, ScrollText, Loader2, Search, List, ChevronRight, Hash, Bookmark, Copy, Check, Type, Sun, Moon, Coffee, Sparkles, BookOpen } from 'lucide-react';
import { googleService, GOOGLE_CONFIG } from '../services/googleService';
import { parseStatutes, StatuteSection } from '../utils/textParser';

const SUGGESTIONS = ['Asociados', 'Cuotas', 'Junta Directiva', 'Sesiones', 'Votación', 'Sanciones'];

const removeAccents = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[áäàâ]/g, 'a')
    .replace(/[éëèê]/g, 'e')
    .replace(/[íïìî]/g, 'i')
    .replace(/[óöòô]/g, 'o')
    .replace(/[úüùû]/g, 'u');
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const makeAccentInsensitiveRegex = (query: string) => {
  const escaped = escapeRegExp(removeAccents(query));
  const pattern = escaped
    .replace(/a/g, '[aáäàâ]')
    .replace(/e/g, '[eéëèê]')
    .replace(/i/g, '[iíïìî]')
    .replace(/o/g, '[oóöòô]')
    .replace(/u/g, '[uúüùû]');
  return new RegExp(`(${pattern})`, 'gi');
};

interface EstatutosProps {
  accessToken?: string;
}

const Estatutos: React.FC<EstatutosProps> = ({ accessToken }) => {
  const [rawContent, setRawContent] = useState<string>(CLUB_STATUTES);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Accessibility States
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans'>('serif');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem('club_leones_estatutos_bookmarks');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  });

  // Share link copied tooltip state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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

  // Sync bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('club_leones_estatutos_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Check URL hash on load to scroll to target article
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      setTimeout(() => {
        scrollToSection(id);
      }, 800);
    }
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const cleanQuery = removeAccents(searchTerm);
    return sections.filter(s =>
      removeAccents(s.text).includes(cleanQuery) ||
      (s.subText && removeAccents(s.subText).includes(cleanQuery))
    );
  }, [searchTerm, sections]);

  const toc = useMemo(() => sections.filter(s => s.type === 'title' || s.type === 'article'), [sections]);

  // Pinned Bookmarks list
  const bookmarkedArticles = useMemo(() => {
    return sections.filter(s => s.type === 'article' && bookmarks.includes(s.id));
  }, [sections, bookmarks]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      // Update browser URL hash quietly
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const handleCopyLink = (id: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    try {
      const regex = makeAccentInsensitiveRegex(query);
      const parts = text.split(regex);
      const cleanQuery = removeAccents(query);
      return (
        <span>
          {parts.map((part, i) =>
            removeAccents(part) === cleanQuery
              ? <mark key={i} className="bg-yellow-250 text-slate-900 rounded px-0.5 font-bold">{part}</mark>
              : part
          )}
        </span>
      );
    } catch (e) {
      return text;
    }
  };

  // Font size classes
  const fontSizes = {
    sm: { p: 'text-sm sm:text-base leading-relaxed', art: 'text-lg sm:text-xl', ch: 'text-2xl sm:text-3xl' },
    md: { p: 'text-base sm:text-lg leading-[1.8]', art: 'text-xl sm:text-2xl', ch: 'text-3xl sm:text-4xl' },
    lg: { p: 'text-lg sm:text-xl leading-loose', art: 'text-2xl sm:text-3xl', ch: 'text-4xl sm:text-5xl' },
  };

  // Theme styling overrides
  const themeStyles = {
    light: 'bg-white text-slate-700 border-slate-200',
    sepia: 'bg-[#faf6ec] text-[#433422] border-[#eedebe]',
    dark: 'bg-[#121824] text-[#cbd5e1] border-[#1e293b]',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* Search Header Banner */}
      <section className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/60 shadow-md mb-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 sm:left-6 top-3.5 sm:top-5 text-slate-400 group-focus-within:text-blue-900 transition-colors w-5 h-5 sm:w-6 sm:h-6" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="¿Qué artículo deseas consultar hoy? (ej. cuotas, asamblea, secretario...)"
              className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-3 sm:py-5 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl shadow-inner focus:bg-white focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none transition-all text-sm sm:text-lg font-bold"
            />
          </div>
          <div className="flex items-center gap-2 px-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" style={{ scrollbarWidth: 'none' }}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex-shrink-0">Temas frecuentes:</span>
            {SUGGESTIONS.map(sug => (
              <button
                key={sug}
                onClick={() => setSearchTerm(sug)}
                className="text-[11px] bg-blue-50 text-blue-900 font-extrabold px-3.5 py-1.5 rounded-full hover:bg-blue-900 hover:text-white transition-all border border-blue-100 cursor-pointer shadow-sm flex-shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid View */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Table of Contents - Sidebar */}
        <aside className="hidden lg:block w-[20rem] flex-shrink-0">
          <div className="space-y-6 sticky top-60 h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Bookmarks Section */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-black uppercase tracking-wider text-xs">
                <Bookmark size={15} className="text-yellow-500 fill-yellow-500" />
                <span>Mis Marcadores ({bookmarkedArticles.length})</span>
              </div>
              
              {bookmarkedArticles.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {bookmarkedArticles.map(item => (
                    <button
                      key={`bookmark-${item.id}`}
                      onClick={() => scrollToSection(item.id)}
                      className="w-full text-left p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 flex items-center space-x-2 group cursor-pointer text-xs font-bold text-slate-600 hover:text-blue-900"
                    >
                      <ChevronRight size={12} className="opacity-50" />
                      <span className="truncate">{item.text}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] font-bold text-slate-400 block px-2">
                  Haz clic en el marcador de cualquier artículo para anclarlo aquí.
                </span>
              )}
            </div>

            {/* Document Index Section */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-blue-900 font-black uppercase tracking-wider text-xs border-b border-slate-100 pb-3">
                <List size={16} />
                <span>Índice del Reglamento</span>
              </div>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <button
                    key={`toc-${item.id}`}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 group cursor-pointer border ${
                      activeId === item.id
                        ? 'bg-blue-900 border-blue-900 text-white shadow-md shadow-blue-900/10'
                        : 'border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {item.type === 'title' ? (
                      <BookOpen size={14} className={`flex-shrink-0 mt-0.5 ${activeId === item.id ? 'text-yellow-400' : 'text-blue-900'}`} />
                    ) : (
                      <span className={`text-[10px] font-black uppercase flex-shrink-0 mt-0.5 ${activeId === item.id ? 'text-yellow-400' : 'text-slate-400 group-hover:text-blue-900'}`}>
                        Art.
                      </span>
                    )}
                    <span className={`text-xs truncate ${item.type === 'title' ? 'font-black' : 'font-extrabold'}`}>
                      {item.type === 'title' ? item.text : item.text.replace(/ARTÍCULO\s+/i, '')}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Document Content Panel */}
        <main className="flex-1 space-y-6">
          
          {/* Reader View Accessibility Bar */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            
            {/* Font style */}
            <div className="flex items-center space-x-2">
              <Type size={15} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Fuente:</span>
              <div className="bg-slate-50 p-0.5 rounded-xl border border-slate-200/50 inline-flex">
                <button
                  onClick={() => setFontStyle('serif')}
                  className={`px-3 py-1 text-xs font-serif font-black rounded-lg cursor-pointer transition-all ${
                    fontStyle === 'serif' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-500'
                  }`}
                >
                  Serif
                </button>
                <button
                  onClick={() => setFontStyle('sans')}
                  className={`px-3 py-1 text-xs font-sans font-black rounded-lg cursor-pointer transition-all ${
                    fontStyle === 'sans' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-500'
                  }`}
                >
                  Sans
                </button>
              </div>
            </div>

            {/* Font size */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Tamaño:</span>
              <div className="bg-slate-50 p-0.5 rounded-xl border border-slate-200/50 inline-flex">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg cursor-pointer transition-all ${
                    fontSize === 'sm' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-500'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('md')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg cursor-pointer transition-all ${
                    fontSize === 'md' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-500'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg cursor-pointer transition-all ${
                    fontSize === 'lg' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-500'
                  }`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Reading Mode Theme switcher */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Fondo:</span>
              <div className="bg-slate-50 p-0.5 rounded-xl border border-slate-200/50 inline-flex">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-all flex items-center space-x-1 ${
                    theme === 'light' ? 'bg-white text-blue-950 shadow-sm border border-slate-200' : 'text-slate-500'
                  }`}
                >
                  <Sun size={12} />
                  <span className="hidden sm:inline">Claro</span>
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-all flex items-center space-x-1 ${
                    theme === 'sepia' ? 'bg-white text-amber-950 shadow-sm border border-slate-200' : 'text-slate-500'
                  }`}
                >
                  <Coffee size={12} />
                  <span className="hidden sm:inline">Sepia</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-all flex items-center space-x-1 ${
                    theme === 'dark' ? 'bg-white text-white shadow-sm border border-slate-800' : 'text-slate-500'
                  }`}
                >
                  <Moon size={12} />
                  <span className="hidden sm:inline">Oscuro</span>
                </button>
              </div>
            </div>

          </div>

          {loading ? (
            <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col items-center justify-center space-y-6">
              <Loader2 className="animate-spin text-blue-900" size={64} />
              <p className="text-xl text-slate-400 font-bold animate-pulse">Sincronizando con Google Docs...</p>
            </div>
          ) : (
            // Core Reader Panel
            <div className={`p-6 sm:p-12 md:p-16 rounded-[2.5rem] shadow-md border transition-colors duration-300 relative overflow-hidden ${themeStyles[theme]}`}>
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <ShieldCheck size={240} />
              </div>

              <div className={`space-y-8 ${fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`}>
                {filteredSections.map((section) => {
                  
                  // Render Chapters titles
                  if (section.type === 'title') {
                    const isChapter = section.text.startsWith('CAPÍTULO');
                    return (
                      <div 
                        id={section.id} 
                        key={section.id} 
                        className={`pt-12 border-t first:border-0 first:pt-0 scroll-mt-60 ${
                          theme === 'dark' ? 'border-slate-800' : theme === 'sepia' ? 'border-[#eedeba]' : 'border-slate-100'
                        }`}
                      >
                        <h2 className={`font-black uppercase tracking-tight ${fontSizes[fontSize].ch} ${
                          isChapter 
                            ? 'text-blue-900 border-b-2 border-yellow-500 pb-3 block ' + (theme === 'dark' ? 'text-yellow-400' : '') 
                            : 'text-slate-800 mt-6'
                        }`}>
                          {highlightText(section.text, searchTerm)}
                        </h2>
                      </div>
                    );
                  }

                  // Render Article Cards
                  if (section.type === 'article') {
                    const isBookmarked = bookmarks.includes(section.id);
                    const isCopied = copiedId === section.id;
                    return (
                      <div 
                        id={section.id} 
                        key={section.id} 
                        className={`scroll-mt-60 p-5 rounded-2xl border transition-all mt-8 relative ${
                          activeId === section.id 
                            ? (theme === 'dark' 
                                ? 'bg-slate-900/50 border-blue-900/40 ring-1 ring-blue-900/20' 
                                : theme === 'sepia' 
                                ? 'bg-amber-100/30 border-[#dbcaaa] ring-1 ring-[#dbcaaa]/20' 
                                : 'bg-blue-50/30 border-blue-200 ring-1 ring-blue-100')
                            : (theme === 'dark' ? 'border-slate-800/70 hover:border-slate-700/60' : theme === 'sepia' ? 'border-amber-250/30 hover:border-amber-200' : 'border-slate-150 hover:border-slate-200')
                        }`}
                      >
                        {/* Gold accent bar */}
                        <div className="absolute top-4 left-0 w-1 h-10 bg-yellow-500 rounded-r" />

                        <div className="flex items-center justify-between mb-4 pl-2">
                          <div className="flex items-center space-x-2">
                            <Hash className="text-yellow-500 flex-shrink-0" size={18} />
                            <h3 className={`font-black uppercase tracking-tight ${fontSizes[fontSize].art} ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                              {highlightText(section.text, searchTerm)}
                            </h3>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center space-x-1.5 relative z-10">
                            {/* Copy Link Button */}
                            <button
                              onClick={() => handleCopyLink(section.id)}
                              className={`p-2 rounded-xl transition-all border cursor-pointer ${
                                theme === 'dark' 
                                  ? 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-100' 
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                              }`}
                              title="Copiar enlace al artículo"
                            >
                              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>

                            {/* Bookmark Toggle Button */}
                            <button
                              onClick={() => toggleBookmark(section.id)}
                              className={`p-2 rounded-xl transition-all border cursor-pointer ${
                                isBookmarked 
                                  ? 'bg-yellow-50 border-yellow-250 text-yellow-500 shadow-sm' 
                                  : (theme === 'dark' 
                                      ? 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-400' 
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500')
                              }`}
                              title={isBookmarked ? "Quitar de marcadores" : "Guardar en marcadores"}
                            >
                              <Bookmark size={14} className={isBookmarked ? 'fill-yellow-500' : ''} />
                            </button>

                            {/* Temporary Copied Toast */}
                            {isCopied && (
                              <div className="absolute right-0 bottom-full mb-2 bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg shadow-md animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
                                ¡Enlace copiado!
                              </div>
                            )}
                          </div>
                        </div>

                        {section.subText && (
                          <h4 className="text-md sm:text-lg font-extrabold text-blue-900/60 pl-2 mb-2 italic">
                            {highlightText(section.subText, searchTerm)}
                          </h4>
                        )}
                      </div>
                    );
                  }

                  // Render Standard Paragraphs
                  return (
                    <p 
                      key={section.id} 
                      className={`text-justify pl-2 ${fontSizes[fontSize].p} ${
                        theme === 'dark' ? 'text-slate-300' : theme === 'sepia' ? 'text-[#4e3f30]' : 'text-slate-650'
                      }`}
                    >
                      {highlightText(section.text, searchTerm)}
                    </p>
                  );
                })}

                {/* No results placeholder */}
                {filteredSections.length === 0 && (
                  <div className="text-center py-20 space-y-4">
                    <div className="bg-slate-50/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 border border-slate-200/50">
                      <Search size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">No encontramos resultados</h3>
                    <p className="text-slate-500 text-sm">Intenta buscar palabras clave como "cuotas", "asamblea" o "secretario".</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-blue-900 font-extrabold text-sm hover:underline cursor-pointer"
                    >
                      Restablecer filtros y ver todo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Legal Support Card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 sm:p-12 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <div className="relative z-10 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-black mb-2">Asistencia en Estatutos</h3>
              <p className="text-blue-100 text-sm sm:text-base font-light max-w-lg">Cualquier duda o solicitud de aclaración sobre la interpretación de los artículos vigentes, favor elevar la consulta a la Junta Directiva.</p>
            </div>
            <button className="relative z-10 whitespace-nowrap bg-yellow-400 text-blue-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-yellow-300 transition-all shadow-md shadow-yellow-500/10 active:scale-95 cursor-pointer">
              Consultar Directiva
            </button>
          </div>

        </main>
      </div>

      {/* Floating Action Button for Mobile Sidebar (TOC & Bookmarks) */}
      <button
        onClick={() => setShowMobileSidebar(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-blue-900 text-white p-4 rounded-full shadow-2xl hover:bg-blue-800 transition-all active:scale-95 flex items-center justify-center border border-blue-800"
        title="Ver índice y marcadores"
      >
        <List size={24} />
      </button>

      {/* Mobile Drawer (TOC & Bookmarks) */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-300">
          {/* Backdrop */}
          <div 
            onClick={() => setShowMobileSidebar(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          {/* Content Panel */}
          <div className="absolute right-0 top-0 h-full w-[18rem] max-w-[85vw] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-black text-blue-900 uppercase tracking-wider text-xs">Navegación</span>
              <button 
                onClick={() => setShowMobileSidebar(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Bookmarks Section */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-slate-800 font-black uppercase tracking-wider text-[11px]">
                  <Bookmark size={14} className="text-yellow-500 fill-yellow-500" />
                  <span>Mis Marcadores ({bookmarkedArticles.length})</span>
                </div>
                
                {bookmarkedArticles.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {bookmarkedArticles.map(item => (
                      <button
                        key={`mobile-bookmark-${item.id}`}
                        onClick={() => {
                          scrollToSection(item.id);
                          setShowMobileSidebar(false);
                        }}
                        className="w-full text-left p-1.5 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 flex items-center space-x-2 group cursor-pointer text-xs font-bold text-slate-600 hover:text-blue-900"
                      >
                        <ChevronRight size={10} className="opacity-50" />
                        <span className="truncate">{item.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 block px-1">
                    Haz clic en el marcador de cualquier artículo para anclarlo aquí.
                  </span>
                )}
              </div>

              {/* Document Index Section */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-blue-900 font-black uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
                  <List size={14} />
                  <span>Índice del Reglamento</span>
                </div>
                <nav className="space-y-0.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                  {toc.map((item) => (
                    <button
                      key={`mobile-toc-${item.id}`}
                      onClick={() => {
                        scrollToSection(item.id);
                        setShowMobileSidebar(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-start space-x-2 group cursor-pointer border ${
                        activeId === item.id
                          ? 'bg-blue-900 border-blue-900 text-white shadow-md'
                          : 'border-transparent hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {item.type === 'title' ? (
                        <BookOpen size={12} className={`flex-shrink-0 mt-0.5 ${activeId === item.id ? 'text-yellow-400' : 'text-blue-900'}`} />
                      ) : (
                        <span className={`text-[9px] font-black uppercase flex-shrink-0 mt-0.5 ${activeId === item.id ? 'text-yellow-400' : 'text-slate-400'}`}>
                          Art.
                        </span>
                      )}
                      <span className={`text-xs truncate ${item.type === 'title' ? 'font-black' : 'font-extrabold'}`}>
                        {item.type === 'title' ? item.text : item.text.replace(/ARTÍCULO\s+/i, '')}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estatutos;
