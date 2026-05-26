import React from 'react';
import { Calendar as CalendarIcon, ExternalLink, Info, Loader2, MapPin, Clock } from 'lucide-react';
import { googleService } from '../services/googleService';

interface CalendarioProps {
    accessToken?: string;
}

const Calendario: React.FC<CalendarioProps> = ({ accessToken }) => {
    const [events, setEvents] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchEvents = async () => {
            if (!accessToken) return;
            setLoading(true);
            try {
                await googleService.initClient();
                googleService.setAccessToken(accessToken);
                const fetchedEvents = await googleService.fetchCalendarEvents();
                if (fetchedEvents) setEvents(fetchedEvents);
            } catch (error) {
                console.error('Error fetching calendar events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [accessToken]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-blue-900">Calendario de Actividades</h1>
                    <p className="text-slate-500 mt-2">Mantente al tanto de nuestros próximos eventos y servicios comunitarios.</p>
                </div>
                <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-blue-50 text-blue-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                >
                    <ExternalLink size={16} />
                    <span>Abrir en Google Calendar</span>
                </a>
            </header>

            <div className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />

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
                    <div className="bg-blue-900 text-white p-2 rounded-xl">
                        <Info size={20} />
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                        <p className="font-bold text-blue-900 mb-1">Nota sobre sincronización</p>
                        ESTE CALENDARIO SE ACTUALIZA AUTOMÁTICAMENTE CON LAS ACTIVIDADES PROGRAMADAS POR SECRETARÍA.
                        SI DESEAS AGREGAR ESTE CALENDARIO A TU DISPOSITIVO PERSONAL, UTILIZA EL BOTÓN SUPERIOR.
                    </div>
                </div>
            </div>

            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <Loader2 className="animate-spin text-blue-900 mb-4" size={48} />
                        <p className="text-slate-400 font-bold">Buscando actividades en Google Calendar...</p>
                    </div>
                ) : events.length > 0 ? (
                    events.map((event, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-12 -mt-12 rounded-full group-hover:bg-blue-900 transition-colors" />
                            <div className="relative z-10">
                                <div className="bg-blue-50 text-blue-900 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-blue-900 group-hover:text-white transition-colors">
                                    <CalendarIcon size={28} />
                                </div>
                                <h3 className="font-extrabold text-2xl text-slate-800 mb-4 leading-tight group-hover:text-blue-900 transition-colors">{event.summary}</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-slate-500 font-medium">
                                        <Clock size={16} className="mr-2 text-yellow-600" />
                                        <span>{new Date(event.start.dateTime || event.start.date).toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center text-slate-500 font-medium">
                                            <MapPin size={16} className="mr-2 text-yellow-600" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                                    {event.description || 'Sin descripción adicional para este evento.'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium italic text-lg">No hay actividades próximas programadas en este momento.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Calendario;
