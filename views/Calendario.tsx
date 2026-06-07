import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ExternalLink, Info, Loader2, MapPin, Clock, Heart, Share2, Check, Copy, Search, Filter } from 'lucide-react';
import { googleService } from '../services/googleService';
import { firebaseService } from '../services/firebaseService';
import { Actividad } from '../types';

interface CalendarioProps {
    accessToken?: string;
    isAuthenticated?: boolean;
}

const Calendario: React.FC<CalendarioProps> = ({ accessToken, isAuthenticated = false }) => {
    const navigate = useNavigate();
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'lista' | 'google'>('lista');
    
    // Search and filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScope, setFilterScope] = useState<'todos' | 'publicas' | 'privadas'>('todos');

    // Clipboard feedback
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                // Fetch activities from Firestore
                const data = await firebaseService.getActividades();
                // Sort by date descending or ascending? Let's sort by date ascending to show what's coming up first
                const sorted = (data || []).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
                setActividades(sorted);

                // Fetch events from Google Calendar if token is present
                if (accessToken) {
                    await googleService.initClient();
                    googleService.setAccessToken(accessToken);
                    const fetchedEvents = await googleService.fetchCalendarEvents();
                    if (fetchedEvents) setEvents(fetchedEvents);
                }
            } catch (error) {
                console.error('Error loading activity data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, [accessToken]);

    // Handle donation redirection
    const handleDonateClick = (act: Actividad) => {
        if (act.donacionUrl && act.donacionUrl.startsWith('http')) {
            window.open(act.donacionUrl, '_blank', 'noopener,noreferrer');
        } else {
            navigate('/donar');
        }
    };

    // Social share triggers
    const handleShare = (act: Actividad, network: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
        const shareUrl = window.location.origin + '/#/actividades';
        const shareText = `¡Te invito a participar en la actividad de Club de Leones Quetzaltenango: "${act.titulo}"! 📅 Fecha: ${act.fecha}. 📍 Lugar: ${act.lugar}.`;

        if (network === 'whatsapp') {
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        } else if (network === 'facebook') {
            const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        } else if (network === 'twitter') {
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        } else if (network === 'copy') {
            const fullText = `${shareText}\n\nEnlace del evento: ${shareUrl}`;
            navigator.clipboard.writeText(fullText).then(() => {
                setCopiedId(act.id);
                setTimeout(() => setCopiedId(null), 2500);
            });
        }
    };

    // Filtered activities list
    const filteredActividades = actividades.filter(act => {
        const matchesSearch = act.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              act.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              act.lugar.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Scope filters
        if (filterScope === 'publicas') {
            return matchesSearch && act.publica;
        } else if (filterScope === 'privadas') {
            return matchesSearch && !act.publica;
        }
        
        // If not authenticated, hide private activities from the feed
        if (!isAuthenticated) {
            return matchesSearch && act.publica;
        }
        
        return matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">Actividades y Eventos</h1>
                    <p className="text-slate-500 mt-1.5 font-medium">Sé parte de nuestras iniciativas comunitarias y apoya las causas de Quetzaltenango.</p>
                </div>
                
                {/* Custom Tab Selector */}
                <div className="bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex space-x-1 border border-slate-200/50 self-start">
                    <button
                        onClick={() => setActiveView('lista')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            activeView === 'lista' 
                                ? 'bg-white text-blue-900 shadow-md shadow-slate-200/50' 
                                : 'text-slate-600 hover:text-blue-900'
                        }`}
                    >
                        Cartelera de Actividades
                    </button>
                    <button
                        onClick={() => setActiveView('google')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            activeView === 'google' 
                                ? 'bg-white text-blue-900 shadow-md shadow-slate-200/50' 
                                : 'text-slate-600 hover:text-blue-900'
                        }`}
                    >
                        Vista de Calendario
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT BLOCK */}
            {activeView === 'lista' ? (
                <div className="space-y-8">
                    {/* Controls Bar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50 p-4 rounded-3xl border border-slate-200/50">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar actividades por título, lugar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Filter Toggles (only if authenticated to see both public and private events) */}
                        {isAuthenticated && (
                            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setFilterScope('todos')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        filterScope === 'todos' ? 'bg-blue-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilterScope('publicas')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        filterScope === 'publicas' ? 'bg-blue-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Público
                                </button>
                                <button
                                    onClick={() => setFilterScope('privadas')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        filterScope === 'privadas' ? 'bg-blue-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Socios
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Activities Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <Loader2 className="animate-spin text-blue-900 mb-4" size={48} />
                            <p className="text-slate-550 font-extrabold text-base">Cargando cartelera de actividades...</p>
                        </div>
                    ) : filteredActividades.length > 0 ? (
                        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredActividades.map(act => (
                                <article 
                                    key={act.id} 
                                    className="bg-white rounded-[2.5rem] border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group flex flex-col h-full"
                                >
                                    {/* Poster / Image Header */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-150">
                                        <img 
                                            src={act.imagen || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800'} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            alt={act.titulo}
                                        />
                                        
                                        {/* Status Tag Overlay */}
                                        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border ${
                                                act.publica 
                                                    ? 'bg-emerald-500/90 backdrop-blur-sm text-white border-emerald-400/30' 
                                                    : 'bg-blue-900/90 backdrop-blur-sm text-white border-blue-800/30'
                                            }`}>
                                                {act.publica ? 'Público' : 'Solo Socios'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content Body */}
                                    <div className="p-6 md:p-8 flex flex-col flex-grow justify-between space-y-6">
                                        <div className="space-y-4">
                                            {/* Date, Time & Place widgets */}
                                            <div className="space-y-2">
                                                <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <Clock size={14} className="mr-2 text-yellow-600 shrink-0" />
                                                    <span>{act.fecha}</span>
                                                </div>
                                                <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <MapPin size={14} className="mr-2 text-blue-900 shrink-0" />
                                                    <span className="truncate">{act.lugar}</span>
                                                </div>
                                            </div>

                                            {/* Title & Description */}
                                            <h3 className="font-extrabold text-2xl text-slate-800 leading-tight group-hover:text-blue-900 transition-colors">
                                                {act.titulo}
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed text-justify whitespace-pre-line">
                                                {act.descripcion}
                                            </p>
                                        </div>

                                        {/* Sharing Bar & Action Button */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            {/* Specialized Social Share Row */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                                                    <Share2 size={12} className="mr-1.5" />
                                                    Compartir
                                                </span>
                                                <div className="flex items-center space-x-1.5">
                                                    {/* WhatsApp */}
                                                    <button
                                                        onClick={() => handleShare(act, 'whatsapp')}
                                                        className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 flex items-center justify-center transition-all shadow-sm"
                                                        title="Compartir por WhatsApp"
                                                    >
                                                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.062 5.248 5.309 0 11.77 0c3.13 0 6.073 1.22 8.283 3.43 2.21 2.21 3.427 5.153 3.427 8.284 0 6.462-5.247 11.71-11.71 11.71-2.007 0-3.978-.517-5.719-1.498L0 24zm6.59-2.031c1.6.953 3.56 1.458 5.56 1.46 5.375 0 9.75-4.373 9.75-9.75 0-2.595-1.01-5.035-2.83-6.858-1.821-1.82-4.26-2.83-6.86-2.83-5.378 0-9.75 4.372-9.75 9.75 0 2.012.524 3.986 1.524 5.589l-.999 3.65 3.755-.985zM17.43 15.65c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.36.24-.68.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.87-1.76-2.18-.18-.32-.02-.49.14-.65.15-.14.32-.32.48-.48.16-.16.21-.27.32-.48.11-.21.05-.4-.03-.56-.08-.16-.71-1.7-.97-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.39-.01-.6-.01s-.55.08-.84.4c-.29.32-1.1 1.08-1.1 2.63s1.12 3.05 1.28 3.25c.16.2 2.2 3.35 5.33 4.7 1.86.8 2.94.86 4 .7.6-.09 1.89-.77 2.15-1.52.26-.75.26-1.4.18-1.52-.09-.12-.3-.24-.62-.4z"/>
                                                        </svg>
                                                    </button>
                                                    {/* Facebook */}
                                                    <button
                                                        onClick={() => handleShare(act, 'facebook')}
                                                        className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 flex items-center justify-center transition-all shadow-sm"
                                                        title="Compartir en Facebook"
                                                    >
                                                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                        </svg>
                                                    </button>
                                                    {/* Twitter / X */}
                                                    <button
                                                        onClick={() => handleShare(act, 'twitter')}
                                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-sm"
                                                        title="Compartir en Twitter/X"
                                                    >
                                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                                        </svg>
                                                    </button>
                                                    {/* Copy Link */}
                                                    <button
                                                        onClick={() => handleShare(act, 'copy')}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                                                            copiedId === act.id 
                                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                        }`}
                                                        title="Copiar datos y enlace"
                                                    >
                                                        {copiedId === act.id ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Donation CTA */}
                                            {act.conBotonDonacion && (
                                                <button
                                                    onClick={() => handleDonateClick(act)}
                                                    className="w-full bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-xl active:scale-98 flex items-center justify-center space-x-2 text-sm"
                                                >
                                                    <Heart size={16} className="fill-current" />
                                                    <span>Apoyar con Donación</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold italic text-lg">No se encontraron actividades con los filtros actuales.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Google Calendar Integration View */
                <div className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h3 className="font-extrabold text-2xl text-slate-800">Calendario Mensual</h3>
                            <p className="text-xs text-slate-500 mt-1">Sincronizado directamente con las cuentas autorizadas del club</p>
                        </div>
                        <a
                            href="https://calendar.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 bg-blue-50 text-blue-900 px-4 py-2.5 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors border border-blue-100 self-start"
                        >
                            <ExternalLink size={14} />
                            <span>Abrir en Google Calendar</span>
                        </a>
                    </div>

                    {/* Responsive Iframe Container */}
                    <div className="aspect-video w-full min-h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                        <iframe
                            src="https://calendar.google.com/calendar/embed?src=es.gt%23holiday%40group.v.calendar.google.com&ctz=America%2FGuatemala"
                            style={{ border: 0 }}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                        ></iframe>
                    </div>

                    <div className="mt-8 flex items-start space-x-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                        <div className="bg-blue-900 text-white p-2 rounded-xl shrink-0">
                            <Info size={20} />
                        </div>
                        <div className="text-sm text-slate-650 leading-relaxed font-medium">
                            <p className="font-black text-blue-900 mb-1">Nota sobre sincronización</p>
                            Este calendario se actualiza automáticamente con los feriados y las actividades programadas en Google Calendar. Si deseas agregar este calendario a tu dispositivo personal, utiliza el enlace superior.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendario;
