import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, ExternalLink, Info, Loader2, MapPin, Clock, Heart, Share2, Check, Copy, Search, Filter, UserPlus, X as XIcon, ChevronLeft, ChevronRight, Shirt, Plus, Building, Home, Lock, AlertCircle, CheckCircle2, Upload, CalendarPlus, Sparkles, DollarSign, Users, MessageCircle, Send, Eye, CalendarCheck, CheckCheck, Compass, Globe } from 'lucide-react';
import { googleService } from '../services/googleService';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { useModal } from '../context/ModalContext';
import { Actividad, Solicitud } from '../types';
import { InscripcionVoluntarioModal } from '../components/InscripcionVoluntarioModal';
import { ConfirmarParticipacionModal } from '../components/ConfirmarParticipacionModal';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';

interface CalendarioProps {
    accessToken?: string;
    isAuthenticated?: boolean;
}

const Calendario: React.FC<CalendarioProps> = ({ accessToken, isAuthenticated = false }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
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

    // Ficha Detallada & Share states
    const [selectedActividadDetail, setSelectedActividadDetail] = useState<Actividad | null>(null);
    const [sharingActividad, setSharingActividad] = useState<Actividad | null>(null);

    // Deep-linking: auto-open activity detail modal if ?id= or ?actividad= is present in URL
    useEffect(() => {
        const actId = searchParams.get('id') || searchParams.get('actividad');
        if (actId && actividades.length > 0) {
            const found = actividades.find(a => a.id === actId);
            if (found) {
                setSelectedActividadDetail(found);
            }
        }
    }, [searchParams, actividades]);

    const handleOpenActivityDetail = (act: Actividad) => {
        setSelectedActividadDetail(act);
        setSearchParams({ id: act.id });
    };

    const handleCloseActivityDetail = () => {
        setSelectedActividadDetail(null);
        searchParams.delete('id');
        searchParams.delete('actividad');
        setSearchParams(searchParams);
    };

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

    // RSVP modal states
    const [selectedActForRsvp, setSelectedActForRsvp] = useState<Actividad | null>(null);
    const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);

    // Custom calendar view states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const getActivitiesForDay = (day: number) => {
        return actividades.filter(act => {
            const dateStr = act.fecha.split(' ')[0];
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const actYear = parseInt(parts[0], 10);
                const actMonth = parseInt(parts[1], 10) - 1;
                const actDay = parseInt(parts[2], 10);
                return actYear === year && actMonth === month && actDay === day;
            }
            const dateObj = new Date(act.fecha.replace(' ', 'T'));
            if (!isNaN(dateObj.getTime())) {
                return dateObj.getFullYear() === year && dateObj.getMonth() === month && dateObj.getDate() === day;
            }
            return false;
        });
    };

    const { user, solicitudes } = useClubData();
    const { showAlert } = useModal();
    const isSocio = Boolean(user && user.rol !== 'DONANTE' && user.rol !== 'GUEST');

    // Socio Salon Reservation Modal States
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
    const [reserveDateStr, setReserveDateStr] = useState('');
    const [reserveNombre, setReserveNombre] = useState('');
    const [reserveHoraInicio, setReserveHoraInicio] = useState('09:00');
    const [reserveHoraFin, setReserveHoraFin] = useState('13:00');
    const [reserveCompromisoLimpieza, setReserveCompromisoLimpieza] = useState<'dejar_limpio' | 'pagar_limpieza'>('dejar_limpio');
    const [isSavingReservation, setIsSavingReservation] = useState(false);
    const [isDayAvailabilityModalOpen, setIsDayAvailabilityModalOpen] = useState(false);

    // Socio Activity Scheduling Modal States
    const [isActividadModalOpen, setIsActividadModalOpen] = useState(false);
    const [newActividad, setNewActividad] = useState({
        titulo: '',
        descripcion: '',
        fecha: '',
        lugar: '',
        esEnSalon: false,
        publica: true,
        conBotonDonacion: false,
        donacionUrl: '',
        conBotonVoluntariado: true,
        conBotonAsistencia: true,
        costoSocio: '',
        costoInvitado: '',
        vestimenta: 'Libre / Informal',
        imagen: ''
    });
    const [newActividadImageFile, setNewActividadImageFile] = useState<File | null>(null);
    const [newActividadImagePreview, setNewActividadImagePreview] = useState<string | null>(null);
    const [isSavingActividad, setIsSavingActividad] = useState(false);

    const handleOpenActividadModal = (dNum?: number) => {
        if (!user || user.rol === 'DONANTE' || user.rol === 'GUEST') {
            showAlert("Acceso Requerido", "Debes iniciar sesión con tu cuenta de socio activo para programar una actividad.");
            return;
        }
        const targetDay = dNum || (selectedDate ? selectedDate.getDate() : new Date().getDate());
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T09:00`;
        setNewActividad({
            titulo: '',
            descripcion: '',
            fecha: formattedDate,
            lugar: 'Salón de Eventos del Club',
            esEnSalon: true,
            publica: true,
            conBotonDonacion: false,
            donacionUrl: '',
            conBotonVoluntariado: true,
            conBotonAsistencia: true,
            costoSocio: '',
            costoInvitado: '',
            vestimenta: 'Libre / Informal',
            imagen: ''
        });
        setNewActividadImageFile(null);
        setNewActividadImagePreview(null);
        setIsActividadModalOpen(true);
    };

    const handleSaveActividad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActividad.titulo.trim() || !newActividad.fecha || !newActividad.lugar.trim()) {
            showAlert("Campos Requeridos", "Por favor completa el título, la fecha y el lugar de la actividad.");
            return;
        }
        setIsSavingActividad(true);
        try {
            let finalImageUrl = newActividad.imagen;
            if (newActividadImageFile) {
                const compressedBase64 = await compressImageFile(newActividadImageFile, 1200, 1200, 0.8);
                finalImageUrl = await firebaseService.uploadGaleriaImage(compressedBase64, 'actividad');
            }

            const created: Actividad = {
                id: `ev-${Date.now()}`,
                titulo: newActividad.titulo.trim(),
                descripcion: newActividad.descripcion.trim(),
                fecha: newActividad.fecha.replace('T', ' '),
                lugar: newActividad.lugar.trim(),
                imagen: finalImageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800',
                publica: newActividad.publica,
                conBotonDonacion: newActividad.conBotonDonacion,
                donacionUrl: newActividad.conBotonDonacion ? (newActividad.donacionUrl || '#/donar') : '',
                conBotonVoluntariado: newActividad.conBotonVoluntariado,
                conBotonAsistencia: newActividad.conBotonAsistencia,
                costoSocio: newActividad.costoSocio ? parseFloat(newActividad.costoSocio) : 0,
                costoInvitado: newActividad.costoInvitado ? parseFloat(newActividad.costoInvitado) : 0,
                vestimenta: newActividad.vestimenta || 'Libre / Informal',
                esEnSalon: newActividad.esEnSalon,
                tipoLugar: newActividad.esEnSalon ? 'salon' : 'exterior'
            };

            await firebaseService.saveActividad(created);
            setIsActividadModalOpen(false);
            showAlert("¡Actividad Programada con Éxito!", `La actividad "${created.titulo}" ha sido programada e incorporada inmediatamente al calendario oficial con su distintivo de color.`);
        } catch (err: any) {
            console.error("Error saving activity:", err);
            showAlert("Error al Programar", "Ocurrió un problema al guardar la actividad. Por favor intenta de nuevo.");
        } finally {
            setIsSavingActividad(false);
        }
    };

    const getSalonReservationsForDay = (day: number) => {
        const dateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return solicitudes.filter(sol => {
            if (sol.tipo !== 'salon' || sol.archivada) return false;
            return sol.salonDia === dateFormatted;
        });
    };

    const isActividadEnSalon = (act: Actividad) => {
        if (act.esEnSalon) return true;
        const lugarLower = (act.lugar || '').toLowerCase();
        return lugarLower.includes('salón') || lugarLower.includes('salon') || lugarLower.includes('cueva') || lugarLower.includes('sede');
    };

    const handleOpenReserveModal = (dNum?: number) => {
        const targetDay = dNum || (selectedDate ? selectedDate.getDate() : new Date().getDate());
        const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
        setReserveDateStr(formatted);
        if (!user || user.rol === 'DONANTE' || user.rol === 'GUEST') {
            navigate(`/solicitudes?tab=salon&dia=${formatted}`);
            return;
        }
        setIsReserveModalOpen(true);
    };

    const handleSaveSocioReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !reserveDateStr || !reserveNombre.trim()) return;
        setIsSavingReservation(true);
        const trackingCodeId = `SLN-${Math.floor(100 + Math.random() * 900)}`;
        const nuevaSolicitud: Solicitud = {
            id: trackingCodeId,
            nombre: `Reserva Socio - ${reserveNombre.trim()}`,
            tipo: 'salon',
            estado: 'Pendiente',
            faseTracking: 'recibido',
            usuarioCreador: `${user.nombre} (${user.correo})`,
            fechaCreacion: new Date().toISOString().split('T')[0],
            salonDia: reserveDateStr,
            salonHoraInicio: reserveHoraInicio,
            salonHoraFin: reserveHoraFin,
            salonTipoAlquiler: 'salon',
            salonCompromisoLimpieza: reserveCompromisoLimpieza,
            salonCostoTotal: reserveCompromisoLimpieza === 'pagar_limpieza' ? 300 : 0,
            salonRequisitosAceptados: true,
            salonEsSocio: true,
            salonNombreSolicitante: user.nombre,
            salonEmail: user.correo,
            salonTelefono: user.telefono || ''
        };

        try {
            await firebaseService.saveSolicitud(nuevaSolicitud);
            setIsReserveModalOpen(false);
            setReserveNombre('');
            showAlert("¡Salón Apartado con Éxito!", `La fecha (${reserveDateStr}) ha sido apartada inmediatamente en el calendario. El espacio queda apartado a la espera de la confirmación de Secretaría.`);
        } catch (err) {
            console.error("Error al apartar el salón:", err);
            showAlert("Error", "No se pudo apartar el salón. Por favor intenta de nuevo.");
        } finally {
            setIsSavingReservation(false);
        }
    };

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

    // Link and sharing helpers
    const getShareUrl = (act: Actividad) => {
        return `${window.location.origin}/#/actividades?id=${act.id}`;
    };

    const getShareText = (act: Actividad) => {
        const enSalon = isActividadEnSalon(act);
        return `🦁 *Club de Leones Quetzaltenango*\n\n📌 *${act.titulo}*\n📅 *Fecha:* ${act.fecha}\n📍 *Lugar:* ${act.lugar || (enSalon ? 'Salón de Eventos del Club de Leones' : 'Exterior')}\n\n👉 *Mira la ficha oficial, ubicación y confirma tu participación aquí:*`;
    };

    const handleShareWhatsApp = (act: Actividad) => {
        const text = `${getShareText(act)}\n${getShareUrl(act)}`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleShareFacebook = (act: Actividad) => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl(act))}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleShareTelegram = (act: Actividad) => {
        const text = getShareText(act);
        const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl(act))}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCopyLink = (act: Actividad) => {
        const shareUrl = getShareUrl(act);
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopiedId(act.id);
            setTimeout(() => setCopiedId(null), 2500);
        });
    };

    const handleNativeShare = async (act: Actividad) => {
        const shareUrl = getShareUrl(act);
        const shareText = `¡Te invito a participar en la actividad del Club de Leones Quetzaltenango: "${act.titulo}"! 📅 Fecha: ${act.fecha}. 📍 Lugar: ${act.lugar}.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: act.titulo,
                    text: shareText,
                    url: shareUrl
                });
            } catch (err) {
                const isUserAbort = err instanceof Error && err.name === 'AbortError';
                if (!isUserAbort) {
                    setSharingActividad(act);
                }
            }
        } else {
            setSharingActividad(act);
        }
    };

    const getGoogleCalendarUrl = (act: Actividad) => {
        try {
            const title = encodeURIComponent(act.titulo);
            const details = encodeURIComponent(`${act.descripcion}\n\nOrganiza: Club de Leones Quetzaltenango\nFicha oficial: ${getShareUrl(act)}`);
            const location = encodeURIComponent(act.lugar || 'Club de Leones Quetzaltenango');
            const normalized = act.fecha.includes('T') ? act.fecha : act.fecha.replace(' ', 'T');
            const startDate = new Date(normalized);
            if (isNaN(startDate.getTime())) return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
            const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
            const startIso = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
            const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
        } catch {
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(act.titulo)}`;
        }
    };

    const getGoogleMapsUrl = (lugar: string) => {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar + ', Quetzaltenango, Guatemala')}`;
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
                                                         {act.vestimenta && (
                                                             <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                 <Shirt size={14} className="mr-2 text-indigo-600 shrink-0" />
                                                                 <span>Vestimenta: <span className="text-indigo-900 font-extrabold">{act.vestimenta}</span></span>
                                                             </div>
                                                         )}

                                                        {/* Cost info */}
                                                        {((act.costoSocio !== undefined && act.costoSocio > 0) || (act.costoInvitado !== undefined && act.costoInvitado > 0)) && (
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                {act.costoSocio !== undefined && act.costoSocio > 0 ? (
                                                                    <span className="text-[10px] bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wide shadow-sm">
                                                                        Socios: Q{act.costoSocio.toFixed(2)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wide shadow-sm">
                                                                        Socios: Gratis
                                                                    </span>
                                                                )}
                                                                {act.costoInvitado !== undefined && act.costoInvitado > 0 ? (
                                                                    <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wide shadow-sm">
                                                                        Invitados: Q{act.costoInvitado.toFixed(2)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wide shadow-sm">
                                                                        Invitados: Gratis
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Title & Description */}
                                                    <h3 
                                                        onClick={() => handleOpenActivityDetail(act)}
                                                        className="font-extrabold text-2xl text-slate-800 leading-tight group-hover:text-blue-900 transition-colors cursor-pointer hover:underline"
                                                    >
                                                        {act.titulo}
                                                    </h3>
                                                    <p className="text-slate-600 text-sm leading-relaxed text-justify whitespace-pre-line font-medium line-clamp-4">
                                                        {act.descripcion}
                                                    </p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                                    {/* Ficha & Share Quick Bar */}
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSharingActividad(act)}
                                                            className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-xl transition-all border border-emerald-200 shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                                                        >
                                                            <MessageCircle size={15} className="text-emerald-600" />
                                                            <span>Compartir</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenActivityDetail(act)}
                                                            className="py-2.5 px-3 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-900 font-extrabold text-xs rounded-xl transition-all border border-slate-200 shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                                                        >
                                                            <Eye size={15} className="text-blue-900" />
                                                            <span>Ver Ficha</span>
                                                        </button>
                                                    </div>

                                                    {/* Donation CTA */}
                                                    {act.conBotonDonacion && (
                                                        <button
                                                            onClick={() => handleDonateClick(act)}
                                                            className="w-full bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-xl active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer"
                                                        >
                                                            <Heart size={15} className="fill-current" />
                                                            <span>Apoyar con Donación</span>
                                                        </button>
                                                    )}

                                                    {/* Volunteer CTA */}
                                                    {act.conBotonVoluntariado !== false && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedActForVol(act);
                                                                setIsVolModalOpen(true);
                                                            }}
                                                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-xl active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer"
                                                        >
                                                            <UserPlus size={15} />
                                                            <span>Me apunto como voluntario</span>
                                                        </button>
                                                    )}

                                                    {/* RSVP CTA (Confirmar participación) */}
                                                    {act.conBotonAsistencia === true && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedActForRsvp(act);
                                                                setIsRsvpModalOpen(true);
                                                            }}
                                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-xl active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer"
                                                        >
                                                            <Check size={15} />
                                                            <span>Confirmar participación</span>
                                                        </button>
                                                    )}
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
                /* Custom Monthly Grid Calendar View */
                <div className="space-y-6">
                    <div className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />

                        {/* Calendar Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-800">Calendario de Actividades y Salón</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                  Visualiza ocupación de salón, actividades externas y fechas apartadas en tiempo real.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => handleOpenActividadModal()}
                                    className="px-4 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-black rounded-2xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                                >
                                    <Plus size={15} />
                                    <span>Programar Actividad</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOpenReserveModal()}
                                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-2xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                                >
                                    <Building size={14} />
                                    <span>Apartar Salón</span>
                                </button>
                                <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-150">
                                    <button
                                        onClick={handlePrevMonth}
                                        className="p-2 hover:bg-white hover:text-blue-900 rounded-xl transition-all shadow-sm active:scale-90"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs sm:text-sm font-black text-slate-800 px-3 min-w-[110px] text-center select-none uppercase tracking-wide">
                                        {monthNames[month]} {year}
                                    </span>
                                    <button
                                        onClick={handleNextMonth}
                                        className="p-2 hover:bg-white hover:text-blue-900 rounded-xl transition-all shadow-sm active:scale-90"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Visual Legend */}
                        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-50/70 rounded-2xl border border-slate-150 text-[10px] font-extrabold text-slate-600">
                            <span className="text-slate-400 uppercase tracking-widest mr-1">Simbología:</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-900 text-white">🏛️ En Salón</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-900 text-white">📍 Exterior</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white">⏳ Salón Apartado</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white">✅ Salón Reservado</span>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                            {/* Days of week */}
                            {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((dName, idx) => (
                                <div key={idx} className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {dName}
                                </div>
                            ))}

                            {/* Previous Month Days */}
                            {Array.from({ length: firstDayIndex }).map((_, idx) => {
                                const dNum = prevTotalDays - firstDayIndex + idx + 1;
                                return (
                                    <div key={`prev-${idx}`} className="bg-slate-50/40 border border-slate-100 rounded-2xl p-2 md:p-3 min-h-[70px] md:min-h-[90px] text-left opacity-30 select-none">
                                        <span className="text-xs font-bold text-slate-400">{dNum}</span>
                                    </div>
                                );
                            })}

                            {/* Current Month Days */}
                            {Array.from({ length: totalDays }).map((_, idx) => {
                                const dNum = idx + 1;
                                const isToday = new Date().getDate() === dNum && new Date().getMonth() === month && new Date().getFullYear() === year;
                                const isSelected = selectedDate && selectedDate.getDate() === dNum && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                                const dayActivities = getActivitiesForDay(dNum);
                                const dayReservations = getSalonReservationsForDay(dNum);
                                const hasOccupancy = dayActivities.length > 0 || dayReservations.length > 0;

                                return (
                                    <button
                                        key={`curr-${idx}`}
                                        onClick={() => {
                                            setSelectedDate(new Date(year, month, dNum));
                                            setIsDayAvailabilityModalOpen(true);
                                        }}
                                        className={`border rounded-2xl p-1.5 md:p-2.5 min-h-[85px] md:min-h-[105px] text-left transition-all flex flex-col justify-between hover:border-blue-900/50 hover:shadow-md cursor-pointer w-full ${
                                            isSelected 
                                                ? 'bg-blue-900/5 border-blue-900 shadow-md shadow-blue-900/5' 
                                                : isToday
                                                    ? 'bg-yellow-50/50 border-yellow-500/50'
                                                    : 'bg-white border-slate-150'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className={`text-xs md:text-sm font-black ${
                                                isSelected 
                                                    ? 'text-blue-900' 
                                                    : isToday
                                                        ? 'text-yellow-600'
                                                        : 'text-slate-800'
                                            }`}>
                                                {dNum}
                                            </span>
                                            {isToday && (
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full shrink-0" title="Hoy" />
                                            )}
                                        </div>
                                        
                                        {/* Activity and Reservation Indicators (Señalamiento Fuerte) */}
                                        {hasOccupancy ? (
                                            <div className="w-full space-y-1 mt-1">
                                                {/* Desktop/Tablet Labels */}
                                                <div className="hidden sm:block space-y-1">
                                                    {/* Salon Reservations */}
                                                    {dayReservations.map((res, rIdx) => (
                                                        <div 
                                                            key={`res-${rIdx}`} 
                                                            className={`text-[8.5px] font-black truncate px-1 py-0.5 rounded border leading-none text-left flex items-center gap-0.5 shadow-2xs ${
                                                                res.estado === 'Aprobada'
                                                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                                                    : 'bg-amber-500 text-white border-amber-600 animate-pulse'
                                                            }`}
                                                            title={`Salón ${res.estado}: ${res.salonNombreSolicitante || 'Reserva'} (${res.salonHoraInicio || ''}-${res.salonHoraFin || ''})`}
                                                        >
                                                            <span>{res.estado === 'Aprobada' ? '🟢' : '⏳'}</span>
                                                            <span className="truncate">{res.estado === 'Aprobada' ? 'Salón Reservado' : 'Apartado (Socio)'}</span>
                                                        </div>
                                                    ))}

                                                    {/* Activities */}
                                                    {dayActivities.slice(0, 2).map((act, actIdx) => {
                                                        const enSalon = isActividadEnSalon(act);
                                                        return (
                                                            <div 
                                                                key={`act-${actIdx}`} 
                                                                className={`text-[8.5px] font-black truncate px-1 py-0.5 rounded border leading-none text-left flex items-center gap-0.5 shadow-2xs ${
                                                                    enSalon
                                                                        ? 'bg-purple-900 text-white border-purple-950'
                                                                        : 'bg-blue-900 text-white border-blue-950'
                                                                }`}
                                                                title={`${act.titulo} (${enSalon ? 'En Salón' : 'Exterior'})`}
                                                            >
                                                                <span>{enSalon ? '🏛️' : '📍'}</span>
                                                                <span className="truncate">{act.titulo}</span>
                                                            </div>
                                                        );
                                                    })}

                                                    {dayActivities.length + dayReservations.length > 3 && (
                                                        <div className="text-[8px] font-black text-slate-500 pl-0.5">
                                                            +{dayActivities.length + dayReservations.length - 3} más
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mobile Indicator Dots with High-Visibility Colors */}
                                                <div className="sm:hidden flex justify-center gap-1 flex-wrap pt-1">
                                                    {dayReservations.map((res, rIdx) => (
                                                        <span key={`res-m-${rIdx}`} className={`w-2.5 h-2.5 rounded-full shadow-2xs ${res.estado === 'Aprobada' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                                    ))}
                                                    {dayActivities.map((act, actIdx) => (
                                                        <span key={`act-m-${actIdx}`} className={`w-2.5 h-2.5 rounded-full shadow-2xs ${isActividadEnSalon(act) ? 'bg-purple-700' : 'bg-blue-700'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="hidden sm:block text-[8px] font-bold text-slate-300 group-hover:text-slate-400 transition-colors mt-auto">
                                                Disponible
                                            </div>
                                        )}
                                    </button>
                                );
                            })}

                            {/* Next Month Days padding to 42 cells */}
                            {Array.from({ length: 42 - (firstDayIndex + totalDays) }).map((_, idx) => {
                                const dNum = idx + 1;
                                return (
                                    <div key={`next-${idx}`} className="bg-slate-50/40 border border-slate-100 rounded-2xl p-2 md:p-3 min-h-[70px] md:min-h-[90px] text-left opacity-30 select-none">
                                        <span className="text-xs font-bold text-slate-400">{dNum}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Activities List for Selected Day */}
                    {selectedDate && (
                        <div className="space-y-4 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <h4 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                                    <CalendarIcon className="text-blue-900" size={20} />
                                    <span>Actividades para el {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}</span>
                                </h4>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    {getActivitiesForDay(selectedDate.getDate()).length} {getActivitiesForDay(selectedDate.getDate()).length === 1 ? 'actividad' : 'actividades'}
                                </span>
                            </div>

                            {getActivitiesForDay(selectedDate.getDate()).length === 0 ? (
                                <div className="bg-slate-50/50 border border-slate-150 rounded-3xl p-12 text-center text-slate-450 font-bold italic">
                                    No hay actividades programadas para este día.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {getActivitiesForDay(selectedDate.getDate()).map(act => {
                                        const dateObj = new Date(act.fecha.replace(' ', 'T'));
                                        const timeStr = !isNaN(dateObj.getTime()) 
                                            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '';
                                            
                                        return (
                                            <div key={act.id} className="bg-white rounded-3xl border border-slate-150 shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition-all space-y-4">
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap gap-2 items-center justify-between">
                                                        <span className="text-[9px] bg-blue-50 text-blue-900 border border-blue-150 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                            {act.publica ? 'Pública' : 'Privada'}
                                                        </span>
                                                        {timeStr && (
                                                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {timeStr}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <h5 className="font-extrabold text-lg text-slate-800 leading-snug">{act.titulo}</h5>
                                                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                                                        <MapPin size={13} className="text-blue-900" />
                                                        <span>{act.lugar}</span>
                                                    </p>
                                                    {act.vestimenta && (
                                                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                                                            <Shirt size={13} className="text-indigo-600" />
                                                            <span>Vestimenta: <span className="text-indigo-900 font-extrabold capitalize">{act.vestimenta}</span></span>
                                                        </p>
                                                    )}
                                                    <p className="text-slate-600 text-xs leading-relaxed font-medium line-clamp-3">{act.descripcion}</p>
                                                </div>

                                                <div className="space-y-2 pt-3 border-t border-slate-100">
                                                    {/* Cost info */}
                                                    {((act.costoSocio !== undefined && act.costoSocio > 0) || (act.costoInvitado !== undefined && act.costoInvitado > 0)) && (
                                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                                            <span className="text-[9px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold">
                                                                Socio: {act.costoSocio ? `Q${act.costoSocio.toFixed(2)}` : 'Gratis'}
                                                            </span>
                                                            <span className="text-[9px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold">
                                                                Invitado: {act.costoInvitado ? `Q${act.costoInvitado.toFixed(2)}` : 'Gratis'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        {act.conBotonAsistencia && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedActForRsvp(act);
                                                                    setIsRsvpModalOpen(true);
                                                                }}
                                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-1 cursor-pointer"
                                                            >
                                                                <Check size={12} />
                                                                <span>Asistir</span>
                                                            </button>
                                                        )}
                                                        {act.conBotonVoluntariado !== false && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedActForVol(act);
                                                                    setIsVolModalOpen(true);
                                                                }}
                                                                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-2 px-3 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-1 cursor-pointer"
                                                            >
                                                                <UserPlus size={12} />
                                                                <span>Voluntario</span>
                                                            </button>
                                                        )}
                                                        {act.conBotonDonacion && (
                                                            <button
                                                                onClick={() => handleDonateClick(act)}
                                                                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold py-2 px-3 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-1 cursor-pointer"
                                                            >
                                                                <Heart size={12} className="fill-current" />
                                                                <span>Donar</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
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

            {/* RSVP / Confirmar Participación Modal */}
            {isRsvpModalOpen && selectedActForRsvp && (
                <ConfirmarParticipacionModal
                    isOpen={isRsvpModalOpen}
                    onClose={() => {
                        setIsRsvpModalOpen(false);
                        setSelectedActForRsvp(null);
                    }}
                    actividadId={selectedActForRsvp.id}
                    actividadTitulo={selectedActForRsvp.titulo}
                />
            )}

            {/* Socio Salon Reservation Modal */}
            {isReserveModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 relative">
                        <button
                            type="button"
                            onClick={() => setIsReserveModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl"
                        >
                            <XIcon size={20} />
                        </button>

                        <div className="space-y-2 text-left">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-extrabold">
                                <Building size={14} className="text-amber-600" />
                                <span>Apartado Inmediato de Salón</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Apartar Salón del Club</h3>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                Como socio activo, la fecha seleccionada quedará **apartada de inmediato** en el calendario bloqueando colisiones. Secretaría confirmará el apartado formalmente.
                            </p>
                        </div>

                        <form onSubmit={handleSaveSocioReservation} className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Fecha Seleccionada *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={reserveDateStr}
                                    onChange={(e) => setReserveDateStr(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-slate-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Nombre de la Actividad / Evento *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={reserveNombre}
                                    onChange={(e) => setReserveNombre(e.target.value)}
                                    placeholder="Ej. Sesión Ordinaria de Comisión / Evento Familiar Socio"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Hora Inicio *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={reserveHoraInicio}
                                        onChange={(e) => setReserveHoraInicio(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Hora Fin *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={reserveHoraFin}
                                        onChange={(e) => setReserveHoraFin(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Compromiso de Limpieza *
                                </label>
                                <select
                                    value={reserveCompromisoLimpieza}
                                    onChange={(e) => setReserveCompromisoLimpieza(e.target.value as any)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 bg-white cursor-pointer"
                                >
                                    <option value="dejar_limpio">Dejar limpio después del evento (Sin costo)</option>
                                    <option value="pagar_limpieza">Pagar servicio de limpieza (Q. 300.00)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsReserveModalOpen(false)}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingReservation}
                                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-xl shadow-md text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                                >
                                    {isSavingReservation ? (
                                        <span>Apartando...</span>
                                    ) : (
                                        <span>Apartar Salón Ahora</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Day Availability & Details Modal */}
            {isDayAvailabilityModalOpen && selectedDate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto text-left">
                        <button
                            type="button"
                            onClick={() => setIsDayAvailabilityModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl"
                        >
                            <XIcon size={20} />
                        </button>

                        {/* Modal Header */}
                        <div className="space-y-1 pr-6">
                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-900 text-xs font-extrabold">
                                <CalendarIcon size={13} className="text-blue-700" />
                                <span>Consulta de Disponibilidad</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900">
                                {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold">
                                Estado de ocupación del salón y actividades programadas.
                            </p>
                        </div>

                        {/* Salon Status Section */}
                        {(() => {
                            const dayReservations = getSalonReservationsForDay(selectedDate.getDate());
                            const dayActivities = getActivitiesForDay(selectedDate.getDate());
                            const salonActividad = dayActivities.find(a => isActividadEnSalon(a));

                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                                            Estado del Salón del Club
                                        </h4>

                                        {dayReservations.length > 0 ? (
                                            <div className="space-y-2">
                                                {dayReservations.map((res, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                                                            res.estado === 'Aprobada'
                                                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                                                : 'bg-amber-50/80 border-amber-200 text-amber-950'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between font-black">
                                                            <span className="flex items-center gap-1.5 text-xs">
                                                                {res.estado === 'Aprobada' ? '🟢 Salón Reservado (Confirmado)' : '⏳ Salón Apartado (Pendiente)'}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/70">
                                                                {res.salonEsSocio ? 'Socio' : 'Público'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] font-semibold text-slate-700">
                                                            <div><strong>Evento:</strong> {res.nombre || 'Reserva de Instalaciones'}</div>
                                                            <div><strong>Horario:</strong> {res.salonHoraInicio || '00:00'} - {res.salonHoraFin || '00:00'}</div>
                                                            <div><strong>Solicitante:</strong> {res.salonNombreSolicitante || res.usuarioCreador || 'Anónimo'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : salonActividad ? (
                                            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs space-y-1">
                                                <div className="font-black text-xs flex items-center gap-1.5">
                                                    <span>🏛️ Ocupado por Actividad Oficial del Club</span>
                                                </div>
                                                <div className="text-[11px] font-semibold text-purple-900">
                                                    <strong>Actividad:</strong> {salonActividad.titulo}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                                                <div className="font-black text-xs flex items-center gap-1.5 text-emerald-950">
                                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                                    <span>Salón Completamente Disponible</span>
                                                </div>
                                                <p className="text-[11px] font-semibold text-emerald-800 leading-relaxed">
                                                    No hay eventos o reservaciones registradas para este día. Puedes apartar la fecha inmediatamente.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Activities List Section */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                                            Actividades del Día ({dayActivities.length})
                                        </h4>

                                        {dayActivities.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No hay actividades registradas en el programa para esta fecha.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                {dayActivities.map(act => {
                                                    const enSalon = isActividadEnSalon(act);
                                                    return (
                                                        <div key={act.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                                                            <div className="flex items-center justify-between">
                                                                <span 
                                                                    onClick={() => {
                                                                        setIsDayAvailabilityModalOpen(false);
                                                                        handleOpenActivityDetail(act);
                                                                    }}
                                                                    className="font-black text-slate-900 hover:text-blue-900 cursor-pointer text-sm"
                                                                >
                                                                    {act.titulo}
                                                                </span>
                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                                    enSalon ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                                                                }`}>
                                                                    {enSalon ? '🏛️ En Salón' : '📍 Exterior'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-600 font-semibold line-clamp-2">{act.descripcion}</p>
                                                            {act.lugar && <p className="text-[10px] text-slate-500 font-bold">📍 {act.lugar}</p>}
                                                            
                                                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/50">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSharingActividad(act)}
                                                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center space-x-1 cursor-pointer"
                                                                >
                                                                    <MessageCircle size={11} />
                                                                    <span>Compartir</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsDayAvailabilityModalOpen(false);
                                                                        handleOpenActivityDetail(act);
                                                                    }}
                                                                    className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold text-[10px] rounded-lg flex items-center space-x-1 cursor-pointer"
                                                                >
                                                                    <Eye size={11} />
                                                                    <span>Ver Ficha</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 flex flex-col sm:flex-row gap-2.5 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDayAvailabilityModalOpen(false);
                                                handleOpenActividadModal(selectedDate.getDate());
                                            }}
                                            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 hover:from-blue-800 hover:to-indigo-800 text-white font-black rounded-2xl shadow-md transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                                        >
                                            <Plus size={14} />
                                            <span>Programar Actividad</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDayAvailabilityModalOpen(false);
                                                handleOpenReserveModal(selectedDate.getDate());
                                            }}
                                            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                                        >
                                            <Building size={14} />
                                            <span>{isSocio ? 'Apartar Salón' : 'Solicitar Alquiler'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsDayAvailabilityModalOpen(false)}
                                            className="w-full sm:w-auto py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* PROGRAMAR ACTIVIDAD FORM MODAL */}
            {isActividadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
                    <form onSubmit={handleSaveActividad} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-6 text-left relative max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="space-y-0.5">
                                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-900 text-[10px] font-black uppercase tracking-wider">
                                    <CalendarPlus size={12} className="text-blue-700" />
                                    <span>Programación de Actividad</span>
                                </div>
                                <h4 className="text-xl sm:text-2xl font-black text-blue-900">Programar Nueva Actividad</h4>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsActividadModalOpen(false)} 
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 pr-1">
                            {/* Título */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Título de la Actividad *
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newActividad.titulo} 
                                    onChange={e => setNewActividad({...newActividad, titulo: e.target.value})}
                                    placeholder="Ej. Jornada Médica Visual / Sesión de Juramentación"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-xs sm:text-sm font-semibold text-slate-800"
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Descripción Detallada *
                                </label>
                                <textarea 
                                    rows={3} 
                                    required
                                    value={newActividad.descripcion} 
                                    onChange={e => setNewActividad({...newActividad, descripcion: e.target.value})}
                                    placeholder="Describe el propósito del evento, quiénes participan y objetivo del servicio..."
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-xs sm:text-sm leading-relaxed font-normal text-slate-700"
                                />
                            </div>

                            {/* Fecha y Hora */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Fecha y Hora *
                                    </label>
                                    <input 
                                        type="datetime-local" 
                                        required 
                                        value={newActividad.fecha} 
                                        onChange={e => setNewActividad({...newActividad, fecha: e.target.value})}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs sm:text-sm font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Vestimenta Sugerida
                                    </label>
                                    <select
                                        value={newActividad.vestimenta}
                                        onChange={e => setNewActividad({...newActividad, vestimenta: e.target.value})}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white cursor-pointer"
                                    >
                                        <option value="Libre / Informal">Libre / Informal</option>
                                        <option value="Chaleco Leonístico">Chaleco Leonístico</option>
                                        <option value="Formal / Etiqueta">Formal / Etiqueta</option>
                                        <option value="Sport Elegante">Sport Elegante</option>
                                        <option value="Uniforme de Servicio">Uniforme de Servicio</option>
                                    </select>
                                </div>
                            </div>

                            {/* Ubicación y Tipo de Lugar */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Lugar / Ubicación *
                                </label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewActividad({
                                            ...newActividad, 
                                            esEnSalon: true, 
                                            lugar: 'Salón de Eventos del Club'
                                        })}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                                            newActividad.esEnSalon
                                                ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                                        }`}
                                    >
                                        <span>🏛️ En Salón</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewActividad({
                                            ...newActividad, 
                                            esEnSalon: false, 
                                            lugar: newActividad.lugar === 'Salón de Eventos del Club' ? '' : newActividad.lugar
                                        })}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                                            !newActividad.esEnSalon
                                                ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50'
                                        }`}
                                    >
                                        <span>📍 En Exterior / Otro</span>
                                    </button>
                                </div>
                                <input 
                                    type="text" 
                                    required 
                                    value={newActividad.lugar} 
                                    onChange={e => setNewActividad({...newActividad, lugar: e.target.value})}
                                    placeholder="Ej. Salón de Eventos del Club / Parque Central Xela"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-xs sm:text-sm font-semibold text-slate-800"
                                />
                            </div>

                            {/* Afiche / Imagen */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Imagen / Afiche de la Actividad
                                </label>
                                <div className="space-y-2">
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-all overflow-hidden relative group">
                                        {newActividadImagePreview ? (
                                            <>
                                                <img src={newActividadImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                                                    Cambiar Imagen
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-3 text-center">
                                                <Upload className="w-6 h-6 text-slate-400 mb-1 group-hover:text-blue-900 transition-colors" />
                                                <p className="text-xs font-bold text-slate-600">Subir Afiche o Foto</p>
                                                <p className="text-[10px] text-slate-400">PNG, JPG o WEBP (Optimización automática)</p>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const validation = validateImageFile(file);
                                                    if (!validation.valid) {
                                                        showAlert("Imagen Inválida", validation.error || "Formato no admitido.");
                                                        return;
                                                    }
                                                    setNewActividadImageFile(file);
                                                    try {
                                                        const compressed = await compressImageFile(file, 800, 800, 0.7);
                                                        setNewActividadImagePreview(compressed);
                                                    } catch (err) {
                                                        console.error("Error preview image:", err);
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setNewActividadImagePreview(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }
                                            }}
                                        />
                                    </label>

                                    <input 
                                        type="text" 
                                        value={newActividad.imagen} 
                                        onChange={e => {
                                            setNewActividad({...newActividad, imagen: e.target.value});
                                            setNewActividadImageFile(null);
                                            setNewActividadImagePreview(null);
                                        }}
                                        placeholder="O ingresa enlace de imagen (Opcional)"
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Opciones de Participación */}
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Opciones y Difusión</span>
                                
                                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={newActividad.publica} 
                                        onChange={e => setNewActividad({...newActividad, publica: e.target.checked})}
                                        className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900 cursor-pointer"
                                    />
                                    <span>Actividad visible públicamente en el portal web</span>
                                </label>

                                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={newActividad.conBotonAsistencia} 
                                        onChange={e => setNewActividad({...newActividad, conBotonAsistencia: e.target.checked})}
                                        className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900 cursor-pointer"
                                    />
                                    <span>Habilitar botón de Confirmación de Asistencia (RSVP)</span>
                                </label>

                                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={newActividad.conBotonVoluntariado} 
                                        onChange={e => setNewActividad({...newActividad, conBotonVoluntariado: e.target.checked})}
                                        className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900 cursor-pointer"
                                    />
                                    <span>Habilitar botón de Convocatoria de Voluntarios</span>
                                </label>

                                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={newActividad.conBotonDonacion} 
                                        onChange={e => setNewActividad({...newActividad, conBotonDonacion: e.target.checked})}
                                        className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900 cursor-pointer"
                                    />
                                    <span>Habilitar Botón de Donaciones</span>
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsActividadModalOpen(false)}
                                className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 text-xs cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingActividad}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                            >
                                {isSavingActividad ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Guardando Actividad...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        <span>Guardar y Programar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* MODAL PREMIUM: FICHA DETALLADA DE LA ACTIVIDAD */}
            {selectedActividadDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-0 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-6 text-left relative max-h-[92vh] overflow-y-auto flex flex-col">
                        {/* Header Poster Image */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 rounded-t-[2rem] sm:rounded-t-[2.5rem]">
                            <img 
                                src={selectedActividadDetail.imagen || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1200'} 
                                alt={selectedActividadDetail.titulo}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                            
                            {/* Close & Share Top Buttons */}
                            <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                                <button
                                    type="button"
                                    onClick={() => setSharingActividad(selectedActividadDetail)}
                                    className="p-2.5 bg-white/90 hover:bg-white text-slate-800 hover:text-emerald-700 rounded-full backdrop-blur-md shadow-lg transition-all cursor-pointer"
                                    title="Compartir Ficha"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseActivityDetail}
                                    className="p-2.5 bg-white/90 hover:bg-white text-slate-800 hover:text-red-700 rounded-full backdrop-blur-md shadow-lg transition-all cursor-pointer"
                                    title="Cerrar Ficha"
                                >
                                    <XIcon size={18} />
                                </button>
                            </div>

                            {/* Badge Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2 z-10">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border ${
                                    selectedActividadDetail.publica 
                                        ? 'bg-emerald-500 text-white border-emerald-400' 
                                        : 'bg-blue-900 text-white border-blue-800'
                                }`}>
                                    {selectedActividadDetail.publica ? 'Actividad Pública' : 'Solo Socios'}
                                </span>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border ${
                                    isActividadEnSalon(selectedActividadDetail)
                                        ? 'bg-purple-900 text-white border-purple-800'
                                        : 'bg-blue-900 text-white border-blue-800'
                                }`}>
                                    {isActividadEnSalon(selectedActividadDetail) ? '🏛️ Salón de Eventos' : '📍 En Exterior'}
                                </span>
                                {isActividadFinalizada(selectedActividadDetail.fecha) && (
                                    <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border bg-red-600 text-white border-red-500">
                                        Finalizada
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Modal Body Content */}
                        <div className="p-6 sm:p-8 space-y-6 flex-grow">
                            {/* Title */}
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                                    {selectedActividadDetail.titulo}
                                </h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                                    Ficha Oficial de Actividad • Club de Leones Quetzaltenango
                                </p>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Fecha y Hora */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <Clock size={14} className="text-yellow-600" />
                                        <span>Fecha y Horario</span>
                                    </div>
                                    <p className="text-sm font-extrabold text-slate-900">
                                        {selectedActividadDetail.fecha}
                                    </p>
                                    <a
                                        href={getGoogleCalendarUrl(selectedActividadDetail)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-900 hover:underline pt-0.5"
                                    >
                                        <CalendarCheck size={12} />
                                        <span>Agregar a Google Calendar</span>
                                    </a>
                                </div>

                                {/* Lugar */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <MapPin size={14} className="text-blue-900" />
                                        <span>Ubicación</span>
                                    </div>
                                    <p className="text-sm font-extrabold text-slate-900 truncate">
                                        {selectedActividadDetail.lugar || (isActividadEnSalon(selectedActividadDetail) ? 'Salón de Eventos del Club' : 'Por definir')}
                                    </p>
                                    {selectedActividadDetail.lugar && (
                                        <a
                                            href={getGoogleMapsUrl(selectedActividadDetail.lugar)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-900 hover:underline pt-0.5"
                                        >
                                            <Compass size={12} />
                                            <span>Ver en Google Maps</span>
                                        </a>
                                    )}
                                </div>

                                {/* Vestimenta */}
                                {selectedActividadDetail.vestimenta && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <Shirt size={14} className="text-indigo-600" />
                                            <span>Código de Vestimenta</span>
                                        </div>
                                        <p className="text-sm font-extrabold text-slate-900 capitalize">
                                            {selectedActividadDetail.vestimenta}
                                        </p>
                                    </div>
                                )}

                                {/* Cuotas / Precios */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <DollarSign size={14} className="text-emerald-600" />
                                        <span>Aporte / Entrada</span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-800 space-y-0.5">
                                        <div>
                                            Socios: <span className="font-extrabold text-blue-900">{selectedActividadDetail.costoSocio && selectedActividadDetail.costoSocio > 0 ? `Q${selectedActividadDetail.costoSocio.toFixed(2)}` : 'Entrada Libre'}</span>
                                        </div>
                                        <div>
                                            Invitados: <span className="font-extrabold text-amber-900">{selectedActividadDetail.costoInvitado && selectedActividadDetail.costoInvitado > 0 ? `Q${selectedActividadDetail.costoInvitado.toFixed(2)}` : 'Entrada Libre'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción Completa */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                                    Descripción del Evento y Propósito
                                </h4>
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium text-justify">
                                    {selectedActividadDetail.descripcion}
                                </p>
                            </div>

                            {/* Action Buttons inside Detail Ficha */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSharingActividad(selectedActividadDetail)}
                                    className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 text-sm cursor-pointer"
                                >
                                    <MessageCircle size={18} />
                                    <span>Compartir Ficha en WhatsApp y Redes</span>
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedActividadDetail.conBotonAsistencia && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleCloseActivityDetail();
                                                setSelectedActForRsvp(selectedActividadDetail);
                                                setIsRsvpModalOpen(true);
                                            }}
                                            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer"
                                        >
                                            <Check size={16} />
                                            <span>Confirmar Asistencia</span>
                                        </button>
                                    )}

                                    {selectedActividadDetail.conBotonVoluntariado !== false && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleCloseActivityDetail();
                                                setSelectedActForVol(selectedActividadDetail);
                                                setIsVolModalOpen(true);
                                            }}
                                            className="py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer"
                                        >
                                            <UserPlus size={16} />
                                            <span>Me apunto como Voluntario</span>
                                        </button>
                                    )}

                                    {selectedActividadDetail.conBotonDonacion && (
                                        <button
                                            type="button"
                                            onClick={() => handleDonateClick(selectedActividadDetail)}
                                            className="py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer sm:col-span-2"
                                        >
                                            <Heart size={16} className="fill-current" />
                                            <span>Apoyar esta Causa con Donación</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PREMIUM: COMPARTIR EN REDES Y WHATSAPP */}
            {sharingActividad && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-left space-y-5 relative">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="space-y-0.5">
                                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                                    <Share2 size={12} className="text-emerald-700" />
                                    <span>Difusión Oficial</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900">Compartir Ficha</h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSharingActividad(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        {/* Activity Snippet Card */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3.5">
                            <img
                                src={sharingActividad.imagen || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400'}
                                alt="Mini Afiche"
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div className="space-y-0.5 overflow-hidden">
                                <h5 className="font-extrabold text-sm text-slate-900 truncate">
                                    {sharingActividad.titulo}
                                </h5>
                                <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                                    <Clock size={11} className="text-yellow-600 shrink-0" />
                                    <span className="truncate">{sharingActividad.fecha}</span>
                                </p>
                                <p className="text-[10px] text-blue-900 font-bold">
                                    {isActividadEnSalon(sharingActividad) ? '🏛️ Salón de Eventos' : '📍 Exterior'}
                                </p>
                            </div>
                        </div>

                        {/* Social Networks Action Grid */}
                        <div className="space-y-2.5">
                            {/* WhatsApp Button */}
                            <button
                                type="button"
                                onClick={() => handleShareWhatsApp(sharingActividad)}
                                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
                            >
                                <MessageCircle size={18} />
                                <span>Compartir en WhatsApp</span>
                            </button>

                            {/* Facebook & Telegram Row */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleShareFacebook(sharingActividad)}
                                    className="py-2.5 px-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-extrabold rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
                                >
                                    <Globe size={15} />
                                    <span>Facebook</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleShareTelegram(sharingActividad)}
                                    className="py-2.5 px-3 bg-[#229ED9] hover:bg-[#1f8ec3] text-white font-extrabold rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
                                >
                                    <Send size={15} />
                                    <span>Telegram</span>
                                </button>
                            </div>

                            {/* Native Device Share (Mobile) */}
                            {typeof navigator !== 'undefined' && 'share' in navigator && (
                                <button
                                    type="button"
                                    onClick={() => handleNativeShare(sharingActividad)}
                                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer"
                                >
                                    <Share2 size={15} />
                                    <span>Compartir mediante aplicaciones del teléfono</span>
                                </button>
                            )}
                        </div>

                        {/* Copy Link Direct Widget */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Enlace Directo a la Ficha
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={getShareUrl(sharingActividad)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none select-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleCopyLink(sharingActividad)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${
                                        copiedId === sharingActividad.id
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-blue-900 hover:bg-blue-800 text-white'
                                    }`}
                                >
                                    {copiedId === sharingActividad.id ? (
                                        <>
                                            <CheckCheck size={14} />
                                            <span>¡Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span>Copiar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
                        <XIcon size={24} />
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
