import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ExternalLink, Info, Loader2, MapPin, Clock, Heart, Share2, Check, Copy, Search, Filter, UserPlus, X } from 'lucide-react';
import { googleService } from '../services/googleService';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { Actividad } from '../types';
import { InscripcionVoluntarioModal } from '../components/InscripcionVoluntarioModal';

interface CalendarioProps {
    accessToken?: string;
    isAuthenticated?: boolean;
}

const Calendario: React.FC<CalendarioProps> = ({ accessToken, isAuthenticated = false }) => {
    const navigate = useNavigate();
    const { actividades, loading: dbLoading } = useClubData();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'lista' | 'google'>(() => {
        const saved = sessionStorage.getItem('calendario_active_view');
        if (saved) return saved as 'lista' | 'google';
        return 'lista';
    });

    useEffect(() => {
        sessionStorage.setItem('calendario_active_view', activeView);
    }, [activeView]);
    
    // Search and filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScope, setFilterScope] = useState<'todos' | 'publicas' | 'privadas'>('todos');

    // Limit of displayed activities
    const [limit, setLimit] = useState(6);

    // Zoomed image modal state
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Reset limit when search or filter changes
    useEffect(() => {
        setLimit(6);
    }, [searchTerm, filterScope]);

    // Clipboard feedback
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Share popover state
    const [openShareId, setOpenShareId] = useState<string | null>(null);

    // Close share popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.share-popover-container')) {
                setOpenShareId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Volunteer modal states
    const [selectedActForVol, setSelectedActForVol] = useState<Actividad | null>(null);
    const [isVolModalOpen, setIsVolModalOpen] = useState(false);

    useEffect(() => {
        const loadGoogleEvents = async () => {
            if (accessToken) {
                setLoading(true);
                try {
                    await googleService.initClient();
                    googleService.setAccessToken(accessToken);
                    const fetchedEvents = await googleService.fetchCalendarEvents();
                    if (fetchedEvents) setEvents(fetchedEvents);
                } catch (error) {
                    console.error('Error loading Google Calendar events:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        loadGoogleEvents();
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
    const handleShareClick = async (act: Actividad) => {
        const shareUrl = window.location.origin + '/#/actividades';
        const shareText = `¡Te invito a participar en la actividad de Club de Leones Quetzaltenango: "${act.titulo}"! 📅 Fecha: ${act.fecha}. 📍 Lugar: ${act.lugar}.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: act.titulo,
                    text: shareText,
                    url: shareUrl
                });
            } catch (err) {
                console.log("Web Share API failed or canceled, falling back:", err);
                const isUserAbort = err instanceof Error && err.name === 'AbortError';
                if (!isUserAbort) {
                    setOpenShareId(openShareId === act.id ? null : act.id);
                }
            }
        } else {
            setOpenShareId(openShareId === act.id ? null : act.id);
        }
    };

    const executeShare = (act: Actividad, network: 'whatsapp' | 'facebook' | 'copy') => {
        const shareUrl = window.location.origin + '/#/actividades';
        const shareText = `¡Te invito a participar en la actividad de Club de Leones Quetzaltenango: "${act.titulo}"! 📅 Fecha: ${act.fecha}. 📍 Lugar: ${act.lugar}.`;

        if (network === 'whatsapp') {
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        } else if (network === 'facebook') {
            const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        } else if (network === 'copy') {
            const fullText = `${shareText}\n\nEnlace del evento: ${shareUrl}`;
            navigator.clipboard.writeText(fullText).then(() => {
                setCopiedId(act.id);
                setTimeout(() => setCopiedId(null), 2500);
            });
        }
        setOpenShareId(null);
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

    // Sort by date descending (most recent first)
    const sortedActividades = React.useMemo(() => {
        return [...filteredActividades].sort((a, b) => {
            const dateA = new Date(a.fecha.replace(' ', 'T')).getTime();
            const dateB = new Date(b.fecha.replace(' ', 'T')).getTime();
            return dateB - dateA;
        });
    }, [filteredActividades]);

    // Slice to display limit (up to 6, then up to 18)
    const displayedActividades = React.useMemo(() => {
        return sortedActividades.slice(0, limit);
    }, [sortedActividades, limit]);

    // Helper to determine if an activity date is past
    const isActividadFinalizada = (fechaStr: string) => {
        try {
            const normalized = fechaStr.includes('T') ? fechaStr : fechaStr.replace(' ', 'T');
            const eventDate = new Date(normalized);
            return eventDate.getTime() < Date.now();
        } catch (e) {
            return false;
        }
    };

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
                    {loading || (actividades.length === 0 && dbLoading.actividades) ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <Loader2 className="animate-spin text-blue-900 mb-4" size={48} />
                            <p className="text-slate-550 font-extrabold text-base">Cargando cartelera de actividades...</p>
                        </div>
                    ) : displayedActividades.length > 0 ? (
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {displayedActividades.map(act => {
                                    const isFinalizada = isActividadFinalizada(act.fecha);
                                    return (
                                        <article 
                                            key={act.id} 
                                            className="bg-white rounded-[2.5rem] border border-slate-200/70 shadow-sm hover:shadow-2xl transition-all duration-300 group flex flex-col h-full relative"
                                        >
                                            {/* Poster / Image Header */}
                                            <div 
                                                className="relative aspect-video w-full overflow-hidden rounded-t-[2.5rem] bg-slate-100 border-b border-slate-150 cursor-zoom-in"
                                                onClick={() => setZoomedImage(act.imagen || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800')}
                                            >
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
                                                    {isFinalizada && (
                                                        <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border bg-red-600/95 backdrop-blur-sm text-white border-red-500/30">
                                                            Actividad Finalizada
                                                        </span>
                                                    )}
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
                                                    <p className="text-slate-600 text-sm leading-relaxed text-justify whitespace-pre-line font-medium">
                                                        {act.descripcion}
                                                    </p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="space-y-4 pt-4 border-t border-slate-100">
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

                                                    {/* Volunteer CTA */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedActForVol(act);
                                                            setIsVolModalOpen(true);
                                                        }}
                                                        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-xl active:scale-98 flex items-center justify-center space-x-2 text-sm"
                                                    >
                                                        <UserPlus size={16} />
                                                        <span>Me apunto como voluntario</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {/* Load More Button */}
                            {sortedActividades.length > limit && limit === 6 && (
                                <div className="flex justify-center mt-12">
                                    <button
                                        onClick={() => setLimit(18)}
                                        className="bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-4 px-8 rounded-2xl transition-all shadow-md hover:shadow-xl active:scale-95 text-sm"
                                    >
                                        Ver actividades antiguas
                                    </button>
                                </div>
                            )}
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

            {/* Volunteer Modal */}
            {isVolModalOpen && selectedActForVol && (
                <InscripcionVoluntarioModal
                    isOpen={isVolModalOpen}
                    onClose={() => {
                        setIsVolModalOpen(false);
                        setSelectedActForVol(null);
                    }}
                    actividadId={selectedActForVol.id}
                    actividadTitulo={selectedActForVol.titulo}
                />
            )}

            {/* Zoomed Image Modal */}
            {zoomedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setZoomedImage(null)}
                >
                    <button 
                        type="button"
                        onClick={() => setZoomedImage(null)} 
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={zoomedImage} 
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" 
                        alt="Zoomed Actividad" 
                    />
                </div>
            )}
        </div>
    );
};

export default Calendario;
