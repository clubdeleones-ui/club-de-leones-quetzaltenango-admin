import React, { useState, useMemo } from 'react';
import { Solicitud, Socio, UserRole } from '../types';
import { useClubData } from '../context/ClubDataContext';
import { firebaseService } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';
import {
  Archive,
  Search,
  Calendar,
  Filter,
  FileText,
  Phone,
  User,
  CheckCircle,
  XOctagon,
  Clock,
  Accessibility,
  Building,
  Lock,
  Layers,
  RefreshCw,
  Copy,
  Users,
  Tag,
  ArrowUpDown,
  Download,
  Eye,
  RotateCcw
} from 'lucide-react';

interface BibliotecaSolicitudesSecretariaProps {
  user: Socio | null;
}

const TEMAS_SOLICITUD = [
  'Todos los Temas',
  'Diabetes',
  'Visión',
  'Mitigación del Hambre',
  'Cáncer Infantil',
  'Medio Ambiente',
  'Alivio del Desastre',
  'Apoyo a la Juventud',
  'Causas Humanitarias',
  'Silla de Ruedas',
  'Alquiler Salón / Parqueo',
  'Otra'
];

export const BibliotecaSolicitudesSecretaria: React.FC<BibliotecaSolicitudesSecretariaProps> = ({ user }) => {
  const { solicitudes, refreshData, loading } = useClubData();
  const { showToast } = useToast();
  const { showAlert, showConfirm } = useModal();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTema, setSelectedTema] = useState('Todos los Temas');
  const [selectedTipo, setSelectedTipo] = useState<'todos' | 'abiertas' | 'internas' | 'sillas' | 'salon' | 'agenda'>('todos');
  const [selectedEstado, setSelectedEstado] = useState<'todos' | 'Aprobada' | 'Rechazada' | 'Pendiente'>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [sortOrder, setSortOrder] = useState<'recientes' | 'antiguas'>('recientes');

  // Filter archived requests
  const solicitudesArchivadas = useMemo(() => {
    return solicitudes.filter(s => s.archivada === true);
  }, [solicitudes]);

  // Apply search and multi-criteria filters
  const filteredList = useMemo(() => {
    return solicitudesArchivadas.filter(sol => {
      // Search query filter (matches title, description, applicant name, beneficiary name, code)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = sol.nombre?.toLowerCase().includes(q);
        const matchesDesc = sol.descripcion?.toLowerCase().includes(q);
        const matchesCode = sol.id?.toLowerCase().includes(q);
        const matchesSolicitante = sol.nombreSolicitante?.toLowerCase().includes(q) || sol.salonNombreSolicitante?.toLowerCase().includes(q);
        const matchesBeneficiario = sol.nombreBeneficiario?.toLowerCase().includes(q);
        const matchesResponsables = sol.responsables?.some(r => r.nombre.toLowerCase().includes(q));
        const matchesPunto = sol.agendaNombrePunto?.toLowerCase().includes(q) || sol.agendaContenido?.toLowerCase().includes(q);

        if (!matchesName && !matchesDesc && !matchesCode && !matchesSolicitante && !matchesBeneficiario && !matchesResponsables && !matchesPunto) {
          return false;
        }
      }

      // Filter by request type
      if (selectedTipo !== 'todos' && sol.tipo !== selectedTipo) {
        return false;
      }

      // Filter by status
      if (selectedEstado !== 'todos' && sol.estado !== selectedEstado) {
        return false;
      }

      // Filter by Tema / Causa
      if (selectedTema !== 'Todos los Temas') {
        if (selectedTema === 'Silla de Ruedas' && sol.tipo !== 'sillas') return false;
        if (selectedTema === 'Alquiler Salón / Parqueo' && sol.tipo !== 'salon') return false;
        if (selectedTema !== 'Silla de Ruedas' && selectedTema !== 'Alquiler Salón / Parqueo') {
          if (sol.tema !== selectedTema) return false;
        }
      }

      // Filter by Date Range (fechaCreacion or fecha)
      const fechaRef = sol.fechaCreacion || sol.fecha;
      if (fechaDesde && fechaRef && fechaRef < fechaDesde) {
        return false;
      }
      if (fechaHasta && fechaRef && fechaRef > fechaHasta) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.fechaCreacion || a.fecha || '';
      const dateB = b.fechaCreacion || b.fecha || '';
      return sortOrder === 'recientes' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
  }, [solicitudesArchivadas, searchQuery, selectedTipo, selectedEstado, selectedTema, fechaDesde, fechaHasta, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    return {
      totalArchivadas: solicitudesArchivadas.length,
      conAdjuntos: solicitudesArchivadas.filter(s => s.documentoUrl).length,
      aprobadas: solicitudesArchivadas.filter(s => s.estado === 'Aprobada').length,
      rechazadas: solicitudesArchivadas.filter(s => s.estado === 'Rechazada').length,
    };
  }, [solicitudesArchivadas]);

  // Handle Un-archiving a request
  const handleUnarchive = async (sol: Solicitud) => {
    const confirmed = await showConfirm(
      "Desarchivar Solicitud",
      `¿Desea restaurar la solicitud "${sol.nombre || sol.id}" a la lista de solicitudes activas?`,
      { confirmText: 'Restaurar', cancelText: 'Cancelar', type: 'info' }
    );

    if (!confirmed) return;

    try {
      const updated: Solicitud = { ...sol, archivada: false };
      await firebaseService.saveSolicitud(updated);
      showToast("Solicitud restaurada exitosamente a la lista activa", "success");
      await refreshData();
    } catch (err) {
      console.error("Error al desarchivar la solicitud:", err);
      showToast("Ocurrió un error al desarchivar la solicitud", "error");
    }
  };

  const handleCopyCode = (id: string) => {
    navigator.clipboard.writeText(id);
    showToast(`Código de solicitud "${id}" copiado al portapapeles`, "info");
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTema('Todos los Temas');
    setSelectedTipo('todos');
    setSelectedEstado('todos');
    setFechaDesde('');
    setFechaHasta('');
    setSortOrder('recientes');
  };

  return (
    <div className="space-y-6 w-full text-left animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
          <Archive size={300} />
        </div>
        
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-amber-300 border border-white/10">
            <Archive size={14} />
            <span className="uppercase tracking-widest">Secretaría General del Club</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black leading-tight">
            Biblioteca Digital de Solicitudes Archivadas
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium leading-relaxed">
            Repositorio oficial para la consulta histórica de cartas, expedientes, resoluciones y solicitudes procesadas. Utilice los filtros avanzados para ubicar correspondencia por fecha o tema.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-blue-200 block tracking-wider">Total Archivadas</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats.totalArchivadas}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-blue-200 block tracking-wider">Con Cartas / Adjuntos</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">{stats.conAdjuntos}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-blue-200 block tracking-wider">Aprobadas</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{stats.aprobadas}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-blue-200 block tracking-wider">Rechazadas / Otras</span>
            <span className="text-xl sm:text-2xl font-black text-rose-300">{stats.rechazadas}</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
            <Filter size={16} className="text-blue-900" />
            <span>Buscador & Filtros de Archivo</span>
          </h3>
          {(searchQuery || selectedTema !== 'Todos los Temas' || selectedTipo !== 'todos' || selectedEstado !== 'todos' || fechaDesde || fechaHasta) && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-blue-900 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-all flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw size={12} />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por contenido, título de solicitud, correlativo, nombre de solicitante o beneficiario..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Multi-Criteria Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Tema / Causa */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Tema / Causa Global
            </label>
            <select
              value={selectedTema}
              onChange={(e) => setSelectedTema(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {TEMAS_SOLICITUD.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Solicitud */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Tipo de Solicitud
            </label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              <option value="todos">Todas las categorías</option>
              <option value="abiertas">🔓 Abiertas</option>
              <option value="sillas">♿ Silla de Ruedas</option>
              <option value="salon">🏛️ Salón y Parqueo</option>
              <option value="internas">🔒 Internas</option>
              <option value="agenda">💬 Agenda</option>
            </select>
          </div>

          {/* Estado Final */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Estado Final
            </label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="Aprobada">🟢 Aprobadas</option>
              <option value="Rechazada">🔴 Rechazadas</option>
              <option value="Pendiente">🟡 Pendientes</option>
            </select>
          </div>

          {/* Rango de Fechas */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Fecha Hasta / Orden
            </label>
            <div className="flex space-x-1.5">
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                onClick={() => setSortOrder(prev => prev === 'recientes' ? 'antiguas' : 'recientes')}
                className="px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                title={sortOrder === 'recientes' ? "Ordenado: Más recientes primero" : "Ordenado: Más antiguas primero"}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
          Mostrando <span className="text-blue-900 font-extrabold">{filteredList.length}</span> solicitudes archivadas
        </p>
      </div>

      {/* Main List */}
      {loading.solicitudes ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <div className="animate-spin text-blue-900"><RefreshCw size={32} /></div>
          <p className="text-slate-500 text-xs font-bold">Cargando biblioteca de correspondencia...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Archive size={30} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No se encontraron solicitudes archivadas</h3>
            <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto">
              {searchQuery || selectedTema !== 'Todos los Temas' 
                ? "No hay coincidencias con los términos de búsqueda o filtros seleccionados." 
                : "Aún no se han archivado solicitudes desde el módulo de gestión."}
            </p>
          </div>
          {(searchQuery || selectedTema !== 'Todos los Temas') && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredList.map((sol) => {
            const isWheelchair = sol.tipo === 'sillas';
            const isSalon = sol.tipo === 'salon';
            const isAgenda = sol.tipo === 'agenda';

            const statusColor = 
              sol.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              sol.estado === 'Rechazada' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200';

            return (
              <div
                key={sol.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4 flex-grow">
                  {/* Top Bar: Badges & Tracking ID */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {isWheelchair && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 flex items-center space-x-1">
                          <Accessibility size={12} className="mr-0.5" />
                          <span>Silla de Ruedas</span>
                        </span>
                      )}
                      {isSalon && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-700 border-amber-200 flex items-center space-x-1">
                          <Building size={12} className="mr-0.5" />
                          <span>Salón / Parqueo</span>
                        </span>
                      )}
                      {isAgenda && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center space-x-1">
                          <FileText size={12} className="mr-0.5" />
                          <span>Punto de Agenda</span>
                        </span>
                      )}
                      {!isWheelchair && !isSalon && !isAgenda && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-700 border-slate-200">
                          {sol.tema || 'Solicitud General'}
                        </span>
                      )}

                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center space-x-1 ${statusColor}`}>
                        {sol.estado === 'Aprobada' && <CheckCircle size={10} className="mr-1" />}
                        {sol.estado === 'Rechazada' && <XOctagon size={10} className="mr-1" />}
                        {sol.estado === 'Pendiente' && <Clock size={10} className="mr-1" />}
                        <span>{sol.estado}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(sol.id)}
                      className="text-[10px] font-mono font-bold text-slate-400 hover:text-blue-900 bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Copiar código de seguimiento"
                    >
                      <Copy size={10} />
                      <span>{sol.id}</span>
                    </button>
                  </div>

                  {/* Title & Dates */}
                  <div className="space-y-1">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug break-words">
                      {isWheelchair 
                        ? `Solicitud de Silla - Beneficiario: ${sol.nombreBeneficiario}`
                        : isSalon
                        ? `Reservación Salón: ${sol.salonDia}`
                        : isAgenda
                        ? sol.agendaNombrePunto
                        : sol.nombre}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400">
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                        Registrada: {formatDisplayDate(sol.fechaCreacion || sol.fecha)}
                      </span>
                    </div>
                  </div>

                  {/* Attachment Card Highlight */}
                  {sol.documentoUrl && (
                    <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="p-2 bg-blue-900 text-white rounded-xl flex-shrink-0 shadow-xs">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="text-xs font-black text-blue-950 block truncate">Carta / Documento Adjunto</span>
                          <span className="text-[10px] font-semibold text-blue-700 truncate block">
                            {sol.documentoNombre || 'Archivo adjunto oficial'}
                          </span>
                        </div>
                      </div>
                      <a
                        href={sol.documentoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
                      >
                        <Eye size={12} />
                        <span>Abrir Carta</span>
                      </a>
                    </div>
                  )}

                  {/* Content / Description Details */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    {isWheelchair && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Solicitante:</span>
                          <span className="font-extrabold text-slate-800">{sol.nombreSolicitante}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">DPI Solicitante:</span>
                          <span className="font-mono text-slate-700">{sol.dpiSolicitante}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Teléfono:</span>
                          <a href={`tel:${sol.telefonoSolicitante}`} className="text-blue-900 font-extrabold flex items-center space-x-1">
                            <Phone size={10} />
                            <span>{sol.telefonoSolicitante}</span>
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Edad Beneficiario:</span>
                          <span className="font-bold text-slate-700">{sol.edadBeneficiario} años</span>
                        </div>
                      </div>
                    )}

                    {isSalon && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Solicitante:</span>
                          <span className="font-extrabold text-slate-800">{sol.salonNombreSolicitante}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Horario:</span>
                          <span className="font-bold text-slate-700">{sol.salonHoraInicio} - {sol.salonHoraFin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Asistentes:</span>
                          <span className="font-bold text-slate-700">{sol.salonAsistentes} personas</span>
                        </div>
                      </div>
                    )}

                    {!isWheelchair && !isSalon && (
                      <p className="text-slate-700 leading-relaxed font-medium break-words">
                        {isAgenda ? sol.agendaContenido : sol.descripcion}
                      </p>
                    )}

                    {sol.responsables && sol.responsables.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/50 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Responsables:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {sol.responsables.map((r, i) => (
                            <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700">
                              {r.nombre} ({r.telefono})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="truncate max-w-[150px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Público'}</span>

                  <button
                    onClick={() => handleUnarchive(sol)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="Restaurar solicitud a la lista de solicitudes activas"
                  >
                    <RotateCcw size={12} />
                    <span>Desarchivar Solicitud</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
