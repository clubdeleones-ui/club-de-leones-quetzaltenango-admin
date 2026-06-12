import React, { useState, useEffect } from 'react';
import { MOCK_PROPUESTAS } from '../constants';
import { Socio, PropuestaSocio, UserRole } from '../types';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  Mail, 
  Calendar, 
  Award, 
  UserCheck, 
  ShieldCheck, 
  Users,
  Briefcase,
  ThumbsUp,
  Clock,
  CheckCircle,
  X,
  Trash2,
  Pencil,
  Image as ImageIcon,
  AlertCircle,
  Share2,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';

interface AfiliacionProps {
  user: Socio;
}

export const Afiliacion: React.FC<AfiliacionProps> = ({ user }) => {
  // Load proposals from localStorage or fallback to mock
  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(() => {
    const local = localStorage.getItem('club_leones_propuestas');
    if (local) return JSON.parse(local);
    localStorage.setItem('club_leones_propuestas', JSON.stringify(MOCK_PROPUESTAS));
    return MOCK_PROPUESTAS;
  });

  const [socios, setSocios] = useState<Socio[]>(() => {
    const local = localStorage.getItem('club_leones_socios_v3');
    if (local) return JSON.parse(local);
    return [];
  });

  const [editingPropuesta, setEditingPropuesta] = useState<PropuestaSocio | null>(null);
  const [shareConfigPropuesta, setShareConfigPropuesta] = useState<PropuestaSocio | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isSavingPropuesta, setIsSavingPropuesta] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOpenCollectiveModal, setIsOpenCollectiveModal] = useState(false);
  const [copiedCollective, setCopiedCollective] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProposalImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPropuesta) {
      setIsCompressingPhoto(true);
      try {
        const compressedBase64 = await compressImageFile(file, 800, 800, 0.7);
        setEditingPropuesta({ ...editingPropuesta, fotoCandidato: compressedBase64 });
      } catch (error) {
        console.error("Error compressing image, falling back to original:", error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditingPropuesta({ ...editingPropuesta, fotoCandidato: reader.result as string });
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  // Fetch from Firebase on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedPropuestas = await firebaseService.getProposals();
        if (fetchedPropuestas) {
          setPropuestas(prev => {
            const fetchedIds = new Set(fetchedPropuestas.map(p => p.id));
            const fetchedNames = new Set(fetchedPropuestas.map(p => p.nombreCandidato.trim().toLowerCase()));
            const unsynced = prev.filter(p => 
              (p as any).synced === false && 
              !fetchedIds.has(p.id) &&
              !fetchedNames.has(p.nombreCandidato.trim().toLowerCase())
            );
            const syncedFetched = fetchedPropuestas.map(p => ({ ...p, synced: true }));
            const merged = [...syncedFetched, ...unsynced];
            localStorage.setItem('club_leones_propuestas', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.error("Error fetching proposals from Firebase:", err);
      }

      try {
        const fetchedSocios = await firebaseService.getSocios();
        if (fetchedSocios && fetchedSocios.length > 0) {
          setSocios(fetchedSocios);
          localStorage.setItem('club_leones_socios_v3', JSON.stringify(fetchedSocios));
        }
      } catch (err) {
        console.error("Error fetching socios from Firebase:", err);
      }
    };

    fetchData();
  }, []);

  // Save proposals to localStorage when state changes to avoid stale local cache
  useEffect(() => {
    localStorage.setItem('club_leones_propuestas', JSON.stringify(propuestas));
  }, [propuestas]);

  const canEditPropuestas = user?.rol === UserRole.SUPER_ADMIN || user?.rol === UserRole.PRESIDENTE_AFILIACION;

  const handleAprobarPropuesta = async (propuesta: PropuestaSocio) => {
    if (!canEditPropuestas) return;

    const nuevoSocio: Socio = {
      id: `socio-${Date.now()}`,
      nombre: propuesta.nombreCandidato,
      correo: propuesta.nombreCandidato.toLowerCase().replace(/[^a-z0-9]+/g, '') + '@leonesxela.com',
      rol: UserRole.SOCIO,
      puesto: 'Socio Ingresado',
      estadoCuotas: 'Al día',
      montoPendiente: 0,
      foto: propuesta.fotoCandidato || `https://picsum.photos/seed/${propuesta.nombreCandidato}/200/200`,
      fechaIngreso: new Date().toISOString().split('T')[0]
    };
    
    // Update local state first for instant response
    const updatedPropuestas = propuestas.map(p => p.id === propuesta.id ? { ...p, estado: 'Aprobado' as const } : p);
    setPropuestas(updatedPropuestas);
    setSocios([nuevoSocio, ...socios]);
    localStorage.setItem('club_leones_socios_v3', JSON.stringify([nuevoSocio, ...socios]));

    try {
      await firebaseService.updateProposalStatus(propuesta.id, 'Aprobado');
      await firebaseService.saveSocio(nuevoSocio);
      alert(`La propuesta para ${propuesta.nombreCandidato} ha sido aprobada. ¡Ahora es miembro activo!`);
    } catch (err: any) {
      console.error("Error approving proposal:", err);
      setErrorMsg(`Se aprobó localmente pero falló la sincronización con Firebase: ${err?.message || err}`);
    }
  };

  const handlePendientePropuesta = async (propuestaId: string) => {
    if (!canEditPropuestas) return;
    setPropuestas(propuestas.map(p => p.id === propuestaId ? { ...p, estado: 'Pendiente' } : p));
    try {
      await firebaseService.updateProposalStatus(propuestaId, 'Pendiente');
    } catch (err) {
      console.error("Error setting proposal to pending:", err);
    }
  };

  const handleRechazarPropuesta = async (propuestaId: string) => {
    if (!canEditPropuestas) return;
    setPropuestas(propuestas.map(p => p.id === propuestaId ? { ...p, estado: 'Rechazado' } : p));
    try {
      await firebaseService.updateProposalStatus(propuestaId, 'Rechazado');
    } catch (err) {
      console.error("Error rejecting proposal:", err);
    }
  };

  const handleDeletePropuesta = async (propuestaId: string) => {
    if (!canEditPropuestas) return;
    if (!window.confirm("¿Está seguro de eliminar esta propuesta permanentemente? Esta acción no se puede deshacer.")) return;
    setPropuestas(propuestas.filter(p => p.id !== propuestaId));
    try {
      await firebaseService.deleteProposal(propuestaId);
    } catch (err) {
      console.error("Error deleting proposal:", err);
      alert("No se pudo eliminar en Firebase.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900">Comité de Afiliación</h2>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Gestión y Aprobación de Candidatos</p>
        </div>
        {canEditPropuestas && (
          <button
            onClick={() => setIsOpenCollectiveModal(true)}
            className="bg-indigo-900 hover:bg-indigo-800 text-white font-black text-xs px-5 py-3.5 rounded-2xl shadow-lg shadow-indigo-900/10 flex items-center space-x-2 transition-all active:scale-95 self-stretch sm:self-auto justify-center shrink-0"
          >
            <Share2 size={15} />
            <span>Compartir Evaluación Colectiva</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-750 text-sm animate-in fade-in relative">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1 pr-6">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Note banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-[2rem] p-8 shadow-xl flex items-start space-x-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent"></div>
        <div className="p-3 bg-white/10 rounded-2xl shrink-0">
          <UserCheck size={28} className="text-yellow-400" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-extrabold text-lg">Candidaturas en Proceso de Evaluación</h4>
          <p className="text-blue-100 text-sm leading-relaxed max-w-4xl">
            A continuación se listan las personas que han sido postuladas para ingresar a nuestro club. Como Presidente de Afiliación o Administrador, tienes la facultad de revisar sus perfiles, editar su información, y formalizar su incorporación aprobando su ingreso.
          </p>
        </div>
      </div>

      {propuestas.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center max-w-3xl mx-auto shadow-sm">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
            <UserCheck size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No hay propuestas pendientes</h3>
          <p className="text-slate-600 mt-2 max-w-md mx-auto text-sm font-medium">
            Actualmente no existen candidaturas propuestas en evaluación en el sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {propuestas.map((propuesta) => (
            <div 
              key={propuesta.id} 
              className={`bg-white rounded-3xl overflow-hidden shadow-md border hover:shadow-xl transition-all duration-300 flex flex-col relative ${
                propuesta.estado === 'Aprobado' ? 'border-green-300' : 
                propuesta.estado === 'Rechazado' ? 'border-red-300' : 'border-yellow-300'
              }`}
            >
              {/* Banner Llamativo de Estado */}
              <div className={`w-full py-2.5 px-6 flex items-center justify-center font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase text-white shadow-sm ${
                propuesta.estado === 'Aprobado' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                propuesta.estado === 'Rechazado' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                'bg-gradient-to-r from-yellow-400 to-yellow-600'
              }`}>
                {propuesta.estado === 'Pendiente' ? 'En Evaluación' : propuesta.estado}
              </div>

              <div className="p-4 sm:p-6 flex flex-col space-y-5 flex-1 justify-between">
                <div>
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center sm:items-start space-x-4 sm:space-x-5 min-w-0">
                      <img 
                        src={propuesta.fotoCandidato || 'https://picsum.photos/seed/' + propuesta.id + '/200/200'} 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-sm flex-shrink-0 cursor-zoom-in" 
                        alt={propuesta.nombreCandidato} 
                        onClick={() => setSelectedPhoto({
                          url: propuesta.fotoCandidato || 'https://picsum.photos/seed/' + propuesta.id + '/200/200',
                          title: propuesta.nombreCandidato
                        })}
                      />
                      <div className="space-y-1.5 min-w-0 pt-1 flex-1">
                        <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-snug break-words">{propuesta.nombreCandidato}</h3>
                        <div className="flex items-center text-slate-650 text-xs font-medium w-full">
                          <Briefcase size={12} className="mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="break-words w-full">{propuesta.profesionCandidato}</span>
                        </div>
                      </div>
                    </div>
                    
                    {canEditPropuestas && (
                      <div className="flex items-center space-x-2 sm:self-start self-end flex-shrink-0">
                        <button 
                          onClick={() => setShareConfigPropuesta(propuesta)}
                          className="p-2.5 sm:p-2 bg-slate-50 hover:bg-indigo-50 text-slate-450 hover:text-indigo-900 rounded-full transition-all border border-slate-100 shadow-sm flex items-center justify-center"
                          title="Enlace y opiniones"
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingPropuesta(propuesta)}
                          className="p-2.5 sm:p-2 bg-slate-50 hover:bg-blue-50 text-slate-450 hover:text-blue-900 rounded-full transition-all border border-slate-100 shadow-sm flex items-center justify-center"
                          title="Editar propuesta"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePropuesta(propuesta.id)}
                          className="p-2.5 sm:p-2 bg-slate-50 hover:bg-red-50 text-slate-450 hover:text-red-600 rounded-full transition-all border border-slate-100 shadow-sm flex items-center justify-center"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Proponent info */}
                  <div className="bg-slate-50/85 rounded-xl p-3.5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between border border-slate-100/80 mt-4">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-655 flex-shrink-0">
                      <ShieldCheck size={14} className="text-blue-900 flex-shrink-0" />
                      <span>Propuesto por:</span>
                    </div>
                    <span className="font-bold text-xs text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg break-words text-left sm:text-right w-full sm:w-auto" title={propuesta.proponente}>
                      {propuesta.proponente}
                    </span>
                  </div>

                  {/* Family Status Info (Datos Complementarios) */}
                  {(propuesta.estadoCivil || propuesta.hijos) && (
                    <div className="bg-slate-50/55 rounded-2xl p-3.5 border border-slate-100/80 space-y-2.5 text-xs text-slate-700 mt-4">
                      <div className="flex flex-col sm:flex-row gap-1 sm:items-center sm:justify-between">
                        <span className="font-bold text-slate-500 flex items-center flex-shrink-0">
                          <span className="mr-1.5">👪</span> Estado Civil y Familia
                        </span>
                        <span className="font-black text-slate-800 text-left sm:text-right w-full sm:w-auto">
                          {propuesta.estadoCivil || 'No indicado'} • {propuesta.hijos || 'No indicado'}
                        </span>
                      </div>
                      {propuesta.estadoCivil === 'Casado' && propuesta.nombreEsposa && (
                        <div className="flex flex-col sm:flex-row gap-1 sm:items-center sm:justify-between pt-2 border-t border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center flex-shrink-0">
                             <span className="mr-1.5">💍</span> Cónyuge
                          </span>
                          <span className="font-black text-slate-900 break-words text-left sm:text-right w-full sm:w-auto">{propuesta.nombreEsposa}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Qualities / characteristics tags */}
                  <div className="space-y-2 mt-4">
                    <h4 className="font-bold text-xs text-slate-555 uppercase tracking-wider flex items-center">
                      <ThumbsUp size={12} className="mr-1.5 text-slate-400" />
                      Cualidades Destacadas
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {propuesta.caracteristicas.map((carac, index) => (
                        <span 
                          key={index} 
                          className="bg-blue-50/50 hover:bg-blue-50 border border-blue-100/70 text-blue-955 font-semibold px-2.5 py-0.5 rounded-lg text-xs transition-colors"
                        >
                          ✨ {carac}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Justification details */}
                  <div className="space-y-3 pt-4 mt-4 border-t border-slate-100">
                    <div>
                      <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Motivo de Nominación</h4>
                      <p className="text-slate-800 text-xs mt-1 leading-relaxed italic bg-slate-50/30 p-2.5 rounded-xl border border-slate-100/50 font-medium break-words">
                        "{propuesta.motivoPropuesta}"
                      </p>
                    </div>
                    {propuesta.porQueBuenLeon && (
                      <div>
                        <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mt-2">¿Por qué sería un buen León?</h4>
                        <p className="text-slate-800 text-xs mt-1 leading-relaxed italic bg-slate-50/30 p-2.5 rounded-xl border border-slate-100/50 font-medium break-words">
                          "{propuesta.porQueBuenLeon}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Opinions summary banner */}
                  {propuesta.opiniones && propuesta.opiniones.length > 0 && (
                    <div className="mt-4 bg-emerald-50/60 border border-emerald-100/60 rounded-2xl p-3.5 flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-800 flex items-center">
                        <MessageSquare size={14} className="mr-1.5 text-emerald-650" />
                        {propuesta.opiniones.length} opiniones anónimas recibidas
                      </span>
                      <button 
                        onClick={() => setShareConfigPropuesta(propuesta)}
                        className="text-[10px] font-black text-indigo-700 hover:text-indigo-950 uppercase tracking-wider bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/50 hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        Ver opiniones
                      </button>
                    </div>
                  )}
                </div>

                {/* Admin Actions */}
                {canEditPropuestas && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 mt-4 border-t border-slate-100/80">
                    <button
                      onClick={() => propuesta.estado !== 'Aprobado' && handleAprobarPropuesta(propuesta)}
                      disabled={propuesta.estado === 'Aprobado'}
                      className={`flex-1 font-black text-xs px-3 py-2.5 rounded-xl flex justify-center items-center space-x-1.5 transition-all shadow-sm ${
                        propuesta.estado === 'Aprobado'
                          ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-70'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-green-600/20'
                      }`}
                    >
                      <CheckCircle size={14} />
                      <span>Promover</span>
                    </button>
                    <button
                      onClick={() => propuesta.estado !== 'Pendiente' && handlePendientePropuesta(propuesta.id)}
                      disabled={propuesta.estado === 'Pendiente'}
                      className={`flex-1 font-black text-xs px-3 py-2.5 rounded-xl flex justify-center items-center space-x-1.5 transition-all shadow-sm ${
                        propuesta.estado === 'Pendiente'
                          ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed opacity-70'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white active:scale-95 shadow-yellow-600/20'
                      }`}
                    >
                      <Clock size={14} />
                      <span>Evaluando</span>
                    </button>
                    <button
                      onClick={() => propuesta.estado !== 'Rechazado' && handleRechazarPropuesta(propuesta.id)}
                      disabled={propuesta.estado === 'Rechazado'}
                      className={`flex-1 font-black text-xs px-3 py-2.5 rounded-xl flex justify-center items-center space-x-1.5 transition-all shadow-sm ${
                        propuesta.estado === 'Rechazado'
                          ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-70'
                          : 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95 shadow-red-600/20'
                      }`}
                    >
                      <X size={14} />
                      <span>Eliminado</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingPropuesta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setEditingPropuesta(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Editar Propuesta de Candidato</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Modificar información del postulado</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editingPropuesta.proponente || !editingPropuesta.nombreCandidato || !editingPropuesta.profesionCandidato || !editingPropuesta.motivoPropuesta || !editingPropuesta.porQueBuenLeon || !editingPropuesta.estadoCivil || !editingPropuesta.hijos) {
                alert('Por favor complete todos los campos obligatorios.');
                return;
              }

              setIsSavingPropuesta(true);
              try {
                let finalPhotoUrl = editingPropuesta.fotoCandidato || '';
                if (finalPhotoUrl && finalPhotoUrl.startsWith('data:')) {
                  try {
                    finalPhotoUrl = await firebaseService.uploadCandidatePhoto(finalPhotoUrl, editingPropuesta.id);
                  } catch (uploadErr) {
                    console.error("Error uploading candidate photo, using original base64:", uploadErr);
                  }
                }

                const updatedPropuesta = {
                  ...editingPropuesta,
                  fotoCandidato: finalPhotoUrl,
                  nombreEsposa: editingPropuesta.estadoCivil === 'Casado' ? editingPropuesta.nombreEsposa : ''
                };

                // Update local state
                setPropuestas(propuestas.map(p => p.id === updatedPropuesta.id ? updatedPropuesta : p));

                // Save to Firebase
                await firebaseService.updateProposal(updatedPropuesta.id, updatedPropuesta);
                
                // Also update localStorage
                const localPropuestas = localStorage.getItem('club_leones_propuestas');
                const propuestasActuales: PropuestaSocio[] = localPropuestas ? JSON.parse(localPropuestas) : [];
                localStorage.setItem('club_leones_propuestas', JSON.stringify(
                  propuestasActuales.map(p => p.id === updatedPropuesta.id ? { ...updatedPropuesta, synced: true } : p)
                ));
                
                alert('Propuesta actualizada exitosamente.');
                setEditingPropuesta(null);
              } catch (err: any) {
                console.error("Error updating proposal in Firestore:", err);
                
                const updatedPropuestaFallback = {
                  ...editingPropuesta,
                  nombreEsposa: editingPropuesta.estadoCivil === 'Casado' ? editingPropuesta.nombreEsposa : ''
                };

                // fallback localStorage update
                const localPropuestas = localStorage.getItem('club_leones_propuestas');
                const propuestasActuales: PropuestaSocio[] = localPropuestas ? JSON.parse(localPropuestas) : [];
                localStorage.setItem('club_leones_propuestas', JSON.stringify(
                  propuestasActuales.map(p => p.id === updatedPropuestaFallback.id ? { ...updatedPropuestaFallback, synced: false } : p)
                ));
                
                alert(`Se guardó localmente pero no se pudo sincronizar: ${err?.message || err}`);
                setEditingPropuesta(null);
              } finally {
                setIsSavingPropuesta(false);
              }
            }} className="space-y-6">
              
              {/* Proponente */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Socio Proponente *</label>
                <input 
                  type="text"
                  required
                  value={editingPropuesta.proponente}
                  onChange={e => setEditingPropuesta({ ...editingPropuesta, proponente: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                />
              </div>

              {/* Fotografía del Candidato */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fotografía del Candidato</label>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-350 shadow-inner">
                    {editingPropuesta.fotoCandidato ? (
                      <img src={editingPropuesta.fotoCandidato} alt="Previsualización" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-400" size={24} />
                    )}
                  </div>
                  <div className="flex flex-col items-center sm:items-start flex-1 w-full">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProposalImageChange}
                      id="edit-foto-upload"
                      className="hidden" 
                    />
                    <label 
                      htmlFor="edit-foto-upload"
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold px-4 py-2.5 rounded-xl cursor-pointer text-xs transition-colors inline-block active:scale-95 shadow-sm"
                    >
                      Subir Nueva Fotografía
                    </label>
                    {isCompressingPhoto ? (
                      <p className="text-[11px] text-blue-900 mt-2 font-bold animate-pulse">Comprimiendo imagen...</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-2 font-medium">Formatos recomendados: JPG, PNG. Tamaño máximo 2MB.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre y Profesión */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre del Candidato *</label>
                  <input 
                    type="text"
                    required
                    value={editingPropuesta.nombreCandidato}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, nombreCandidato: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Campo Profesional / Ocupación *</label>
                  <input 
                    type="text"
                    required
                    value={editingPropuesta.profesionCandidato}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, profesionCandidato: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Motivo Nominación */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">¿Por qué propone a esta persona? *</label>
                <textarea 
                  rows={3}
                  required
                  value={editingPropuesta.motivoPropuesta}
                  onChange={e => setEditingPropuesta({ ...editingPropuesta, motivoPropuesta: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm font-semibold"
                  spellCheck={true}
                  autoCorrect="on"
                />
              </div>

              {/* Buen Leon */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">¿Por qué considera que sería un buen León? *</label>
                <textarea 
                  rows={3}
                  required
                  value={editingPropuesta.porQueBuenLeon}
                  onChange={e => setEditingPropuesta({ ...editingPropuesta, porQueBuenLeon: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm font-semibold"
                  spellCheck={true}
                  autoCorrect="on"
                />
              </div>

              {/* Datos Complementarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Estado Civil *</label>
                  <select 
                    required
                    value={editingPropuesta.estadoCivil || ''}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, estadoCivil: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold bg-white"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Soltero">Soltero(a)</option>
                    <option value="Casado">Casado(a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Hijos *</label>
                  <select 
                    required
                    value={editingPropuesta.hijos || ''}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, hijos: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold bg-white"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Sin hijos">Sin hijos</option>
                    <option value="Con hijos">Con hijos</option>
                  </select>
                </div>
              </div>

              {editingPropuesta.estadoCivil === 'Casado' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre del Cónyuge (Opcional)</label>
                  <input 
                    type="text"
                    value={editingPropuesta.nombreEsposa || ''}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, nombreEsposa: e.target.value })}
                    placeholder="Ej. María Fernanda López"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                  />
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPropuesta(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPropuesta || isCompressingPhoto}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl shadow-lg shadow-blue-900/10 transition-all text-sm disabled:opacity-50"
                >
                  {isSavingPropuesta ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-900/60 hover:bg-slate-900/90 rounded-full transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title} 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-base font-bold mt-4 bg-slate-900/80 px-4 py-2 rounded-xl shadow-lg border border-white/5">
              {selectedPhoto.title}
            </p>
          </div>
        </div>
      )}

      {/* SHARE CONFIG & OPINIONS MODAL */}
      {shareConfigPropuesta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setShareConfigPropuesta(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-blue-900">Enlace Compartido y Opiniones</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{shareConfigPropuesta.nombreCandidato}</p>
            </div>

            <div className="space-y-6">
              {/* Configuration: Enable/Disable Opinions */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 max-w-[70%]">
                  <label className="block text-sm font-black text-slate-800">
                    Habilitar opiniones anónimas
                  </label>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Si está activo, las personas que tengan el enlace podrán opinar sobre esta postulación de forma anónima.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const nextVal = !shareConfigPropuesta.habilitarOpinion;
                    const updated = { ...shareConfigPropuesta, habilitarOpinion: nextVal };
                    setPropuestas(propuestas.map(p => p.id === updated.id ? updated : p));
                    setShareConfigPropuesta(updated);
                    try {
                      await firebaseService.updateProposal(updated.id, { habilitarOpinion: nextVal });
                    } catch (err) {
                      console.error("Error setting proposal opinion flag:", err);
                    }
                  }}
                  className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${
                    shareConfigPropuesta.habilitarOpinion ? 'bg-blue-900' : 'bg-slate-355'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                    shareConfigPropuesta.habilitarOpinion ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Share Link Generation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Enlace de Compartir (Optimizado para móvil)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#/ficha-evaluacion/${shareConfigPropuesta.id}`}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold select-all text-slate-600 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}${window.location.pathname}#/ficha-evaluacion/${shareConfigPropuesta.id}`;
                      navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className={`px-5 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 shrink-0 ${
                      copiedLink 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-indigo-900 hover:bg-indigo-800 text-white active:scale-95'
                    }`}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>

              {/* Opinions list */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-slate-800">
                  <MessageSquare size={16} />
                  <h3 className="text-sm font-black">
                    Opiniones Recibidas ({shareConfigPropuesta.opiniones?.length || 0})
                  </h3>
                </div>

                <div className="space-y-3.5 max-h-[30vh] overflow-y-auto pr-1">
                  {shareConfigPropuesta.opiniones && shareConfigPropuesta.opiniones.length > 0 ? (
                    shareConfigPropuesta.opiniones.map((op) => (
                      <div 
                        key={op.id} 
                        className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs relative group flex justify-between items-start gap-4 animate-in fade-in duration-300"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Anónimo
                            </span>
                            <span className="text-[9px] text-slate-450 font-bold">
                              • {op.fecha}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-semibold break-words">
                            "{op.comentario}"
                          </p>
                          {op.metadatos && (
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              <span className="bg-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-md" title="Sistema Operativo">
                                💻 {op.metadatos.sistemaOperativo}
                              </span>
                              <span className="bg-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-md" title="Navegador">
                                🌐 {op.metadatos.navegador}
                              </span>
                              <span className="bg-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-md" title="Tipo de Dispositivo">
                                📱 {op.metadatos.dispositivo}
                              </span>
                              <span className="bg-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-md" title="Resolución de pantalla">
                                🖥️ {op.metadatos.resolucion}
                              </span>
                              <span className="bg-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-md truncate max-w-[120px]" title={`Zona horaria: ${op.metadatos.zonaHoraria}`}>
                                🕒 {op.metadatos.zonaHoraria.split('/').pop()?.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm("¿Está seguro de eliminar esta opinión permanentemente?")) return;
                            const filtered = (shareConfigPropuesta.opiniones || []).filter(o => o.id !== op.id);
                            const updated = { ...shareConfigPropuesta, opiniones: filtered };
                            setPropuestas(propuestas.map(p => p.id === updated.id ? updated : p));
                            setShareConfigPropuesta(updated);
                            try {
                              await firebaseService.updateProposal(updated.id, { opiniones: filtered });
                            } catch (err) {
                              console.error("Error deleting opinion:", err);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                          title="Eliminar opinión"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-405 italic font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No se han recibido opiniones anónimas aún para este candidato.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShareConfigPropuesta(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECTIVE SHARE MODAL */}
      {isOpenCollectiveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setIsOpenCollectiveModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-blue-900">Enlace de Evaluación Colectiva</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Enviar todos los postulados pendientes en un solo link</p>
            </div>

            <div className="space-y-6">
              {/* Share Link */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Enlace Colectivo (Muestra todos los candidatos activos)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#/evaluacion-compartida`}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold select-all text-slate-600 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}${window.location.pathname}#/evaluacion-compartida`;
                      navigator.clipboard.writeText(link);
                      setCopiedCollective(true);
                      setTimeout(() => setCopiedCollective(false), 2000);
                    }}
                    className={`px-5 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 shrink-0 ${
                      copiedCollective 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-indigo-900 hover:bg-indigo-850 text-white active:scale-95'
                    }`}
                  >
                    {copiedCollective ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCollective ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>

              {/* List of candidates for quick configuration */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-800">
                  Configuración de opiniones por Candidato
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Activa o desactiva la recepción de opiniones de forma individual para cada postulado.
                </p>

                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                  {propuestas.filter(p => p.estado === 'Pendiente').length > 0 ? (
                    propuestas.filter(p => p.estado === 'Pendiente').map((prop) => (
                      <div 
                        key={prop.id} 
                        className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={prop.fotoCandidato || `https://picsum.photos/seed/${prop.id}/100/100`}
                            alt={prop.nombreCandidato}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-black text-xs text-slate-800 truncate">
                              {prop.nombreCandidato}
                            </h4>
                            <p className="text-[10px] text-slate-450 truncate font-semibold">
                              {prop.profesionCandidato}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const nextVal = !prop.habilitarOpinion;
                            const updated = { ...prop, habilitarOpinion: nextVal };
                            setPropuestas(propuestas.map(p => p.id === updated.id ? updated : p));
                            
                            if (shareConfigPropuesta && shareConfigPropuesta.id === prop.id) {
                              setShareConfigPropuesta(updated);
                            }

                            try {
                              await firebaseService.updateProposal(updated.id, { habilitarOpinion: nextVal });
                            } catch (err) {
                              console.error("Error setting proposal opinion flag:", err);
                            }
                          }}
                          className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
                            prop.habilitarOpinion ? 'bg-blue-900' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                            prop.habilitarOpinion ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-455 italic font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No hay propuestas pendientes en evaluación.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpenCollectiveModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
