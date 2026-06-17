import React, { useState, useEffect } from 'react';
import { MOCK_PROPUESTAS } from '../constants';
import { Socio, PropuestaSocio, UserRole } from '../types';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile } from '../utils/imageCompressor';
import { generateCartasInvitacionPDF } from '../utils/pdfGenerator';
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
  MessageSquare,
  User,
  ChevronDown
} from 'lucide-react';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = "Timeout exceeded"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const guessGender = (name: string): 'Masculino' | 'Femenino' => {
  const firstName = name.trim().split(' ')[0].toLowerCase();
  if (firstName.endsWith('a') || firstName.endsWith('is') || firstName.endsWith('y')) {
    const maleExceptions = ['luca', 'noa', 'elias', 'josue', 'rene'];
    if (maleExceptions.includes(firstName)) {
      return 'Masculino';
    }
    return 'Femenino';
  }
  const femaleNames = ['beatriz', 'carmen', 'dolores', 'isabel', 'lourdes', 'mercedes', 'pilar', 'raquel', 'ruth', 'ester', 'estér', 'irene', 'consuelo', 'socorro'];
  if (femaleNames.includes(firstName)) {
    return 'Femenino';
  }
  return 'Masculino';
};

const formatLongDateSpanish = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

const formatShortDateSpanish = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

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
  const [viewingOpinionsPropuesta, setViewingOpinionsPropuesta] = useState<PropuestaSocio | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isSavingPropuesta, setIsSavingPropuesta] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOpenCollectiveModal, setIsOpenCollectiveModal] = useState(false);
  const [isOpenLettersModal, setIsOpenLettersModal] = useState(false);
  const [isOpenActionsDropdown, setIsOpenActionsDropdown] = useState(false);
  const [copiedCollective, setCopiedCollective] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [charlaDate, setCharlaDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((4 + 7 - d.getDay()) % 7 || 7)); // Next Thursday
    return d.toISOString().split('T')[0];
  });
  const [limiteDate, setLimiteDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // Next Monday
    return d.toISOString().split('T')[0];
  });
  const [charlaDateText, setCharlaDateText] = useState<string>('');
  const [limiteDateText, setLimiteDateText] = useState<string>('');
  const [telefonoConfirmacion, setTelefonoConfirmacion] = useState<string>('5691 1935');
  const [candidateGenders, setCandidateGenders] = useState<Record<string, 'Masculino' | 'Femenino'>>({});

  useEffect(() => {
    if (charlaDate) setCharlaDateText(formatLongDateSpanish(charlaDate));
  }, [charlaDate]);

  useEffect(() => {
    if (limiteDate) setLimiteDateText(formatShortDateSpanish(limiteDate));
  }, [limiteDate]);

  useEffect(() => {
    if (isOpenLettersModal) {
      const initialGenders: Record<string, 'Masculino' | 'Femenino'> = {};
      propuestas.filter(p => p.estado === 'Aprobado').forEach(p => {
        if (p.generoCandidato) {
          initialGenders[p.id] = p.generoCandidato;
        } else {
          initialGenders[p.id] = guessGender(p.nombreCandidato);
        }
      });
      setCandidateGenders(initialGenders);
    }
  }, [isOpenLettersModal, propuestas]);

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
          <div className="relative self-stretch sm:self-auto">
            <button
              onClick={() => setIsOpenActionsDropdown(!isOpenActionsDropdown)}
              className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-lg shadow-indigo-950/20 flex items-center space-x-2 transition-all active:scale-95 justify-center w-full sm:w-auto shrink-0"
            >
              <Briefcase size={15} />
              <span>Acciones del Comité</span>
              <ChevronDown size={15} className={`transition-transform duration-200 ${isOpenActionsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {isOpenActionsDropdown && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsOpenActionsDropdown(false)}
                />
                
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opciones Disponibles</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsOpenActionsDropdown(false);
                      setIsOpenCollectiveModal(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start space-x-3 transition-colors"
                  >
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-900 shrink-0">
                      <Share2 size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Compartir Evaluación</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Copiar link de votación colectiva</div>
                    </div>
                  </button>

                  {propuestas.some(p => p.estado === 'Aprobado') && (
                    <button
                      onClick={() => {
                        setIsOpenActionsDropdown(false);
                        setIsOpenLettersModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start space-x-3 transition-colors border-t border-slate-50"
                    >
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                        <Mail size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Generar Cartas</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Crear invitaciones para aprobados</div>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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

                  {/* Banner de RSVP Digital para Candidatos Aprobados */}
                  {propuesta.estado === 'Aprobado' && (
                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl shrink-0 ${propuesta.invitacionConfirmada ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {propuesta.invitacionConfirmada ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800 text-xs leading-none">Invitación Oficial</h5>
                          <p className="text-[10px] text-slate-550 font-bold mt-1.5">
                            {propuesta.invitacionConfirmada 
                              ? `Confirmado: ${propuesta.telefonoConfirmacionCandidato || 'Sin teléfono'}` 
                              : 'Pendiente de Confirmación'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                          onClick={async () => {
                            const nextConfirmState = !propuesta.invitacionConfirmada;
                            let phone = propuesta.telefonoConfirmacionCandidato || '';
                            if (nextConfirmState && !phone) {
                              const inputPhone = window.prompt("Ingrese el teléfono del candidato para la confirmación (opcional):", "");
                              if (inputPhone === null) return;
                              phone = inputPhone;
                            }
                            const updated = { 
                              ...propuesta, 
                              invitacionConfirmada: nextConfirmState,
                              telefonoConfirmacionCandidato: phone
                            };
                            setPropuestas(propuestas.map(p => p.id === propuesta.id ? updated : p));
                            try {
                              await firebaseService.updateProposal(propuesta.id, { 
                                invitacionConfirmada: nextConfirmState,
                                telefonoConfirmacionCandidato: phone
                              });
                            } catch (err) {
                              console.error("Error updating proposal confirmation:", err);
                            }
                          }}
                          className="text-[10px] font-black bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-xl transition-all shadow-md shadow-blue-900/10 active:scale-95 uppercase tracking-wider shrink-0"
                        >
                          {propuesta.invitacionConfirmada ? 'Marcar Pendiente' : 'Confirmar'}
                        </button>
                      </div>
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
                    <div className="mt-4 bg-gradient-to-r from-emerald-50/65 to-teal-50/45 border border-emerald-100/70 rounded-2xl p-4 flex items-center justify-between shadow-sm/50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-650 rounded-xl relative">
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <MessageSquare size={16} />
                        </div>
                        <div>
                          <h5 className="font-black text-emerald-900 text-xs leading-none">Opiniones Recibidas</h5>
                          <p className="text-[10px] text-emerald-700/80 font-bold mt-1.5">Se han registrado {propuesta.opiniones.length} opiniones de los Leones.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setViewingOpinionsPropuesta(propuesta)}
                        className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-750 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/10 active:scale-95 uppercase tracking-wider shrink-0"
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
              if (!editingPropuesta.proponente || !editingPropuesta.nombreCandidato || !editingPropuesta.profesionCandidato || !editingPropuesta.motivoPropuesta || !editingPropuesta.porQueBuenLeon || !editingPropuesta.estadoCivil || !editingPropuesta.hijos || !editingPropuesta.generoCandidato) {
                alert('Por favor complete todos los campos obligatorios.');
                return;
              }

              setIsSavingPropuesta(true);
              try {
                const updatedPropuesta = {
                  ...editingPropuesta,
                  nombreEsposa: editingPropuesta.estadoCivil === 'Casado' ? editingPropuesta.nombreEsposa : ''
                };

                // 1. Update React state immediately (Optimistic Update)
                setPropuestas(prev => prev.map(p => p.id === updatedPropuesta.id ? updatedPropuesta : p));

                // 2. Save to localStorage immediately as unsynced
                const localPropuestas = localStorage.getItem('club_leones_propuestas');
                const propuestasActuales: PropuestaSocio[] = localPropuestas ? JSON.parse(localPropuestas) : [];
                localStorage.setItem('club_leones_propuestas', JSON.stringify(
                  propuestasActuales.map(p => p.id === updatedPropuesta.id ? { ...updatedPropuesta, synced: false } : p)
                ));

                // 3. Close the modal immediately so there is ZERO waiting time for the user!
                setEditingPropuesta(null);
                setIsSavingPropuesta(false);

                // 4. Sync with Firebase in the background
                (async () => {
                  try {
                    let finalPhotoUrl = updatedPropuesta.fotoCandidato || '';
                    if (finalPhotoUrl && finalPhotoUrl.startsWith('data:')) {
                      finalPhotoUrl = await withTimeout(
                        firebaseService.uploadCandidatePhoto(finalPhotoUrl, updatedPropuesta.id),
                        12000,
                        "El servidor tardó demasiado en subir la fotografía."
                      );
                      updatedPropuesta.fotoCandidato = finalPhotoUrl;
                      
                      // Update React state & localStorage with the uploaded photo URL
                      setPropuestas(prev => prev.map(p => p.id === updatedPropuesta.id ? { ...p, fotoCandidato: finalPhotoUrl } : p));
                    }

                    await withTimeout(
                      firebaseService.updateProposal(updatedPropuesta.id, updatedPropuesta),
                      10000,
                      "El servidor de base de datos tardó demasiado."
                    );

                    // Mark as synced in localStorage
                    const currentLocal = localStorage.getItem('club_leones_propuestas');
                    const currentProps: PropuestaSocio[] = currentLocal ? JSON.parse(currentLocal) : [];
                    localStorage.setItem('club_leones_propuestas', JSON.stringify(
                      currentProps.map(p => p.id === updatedPropuesta.id ? { ...p, fotoCandidato: finalPhotoUrl, synced: true } : p)
                    ));
                  } catch (backgroundErr: any) {
                    console.error("Error en sincronización en segundo plano:", backgroundErr);
                    setErrorMsg(`Cambios guardados localmente. Sincronización pendiente: ${backgroundErr?.message || backgroundErr}`);
                  }
                })();

              } catch (err: any) {
                console.error("Error local de guardado:", err);
                alert(`Error al procesar los cambios: ${err?.message || err}`);
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

              {/* Nombre, Profesión y Género */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Género del Candidato *</label>
                  <div className="relative">
                    <select 
                      required
                      value={editingPropuesta.generoCandidato || ''}
                      onChange={e => setEditingPropuesta({ ...editingPropuesta, generoCandidato: e.target.value as 'Masculino' | 'Femenino' })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold appearance-none bg-white cursor-pointer"
                    >
                      <option value="">Seleccione género</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
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

              {/* Confirmación de Invitación (Visible si el candidato está aprobado) */}
              {editingPropuesta.estado === 'Aprobado' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in duration-300">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Asistencia e Invitación Oficial
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 pt-2">
                      <input 
                        type="checkbox"
                        id="edit-invitacion-confirmada"
                        checked={editingPropuesta.invitacionConfirmada || false}
                        onChange={e => setEditingPropuesta({ ...editingPropuesta, invitacionConfirmada: e.target.checked })}
                        className="w-4 h-4 text-blue-900 border-slate-350 rounded focus:ring-blue-900 focus:ring-2 cursor-pointer"
                      />
                      <label htmlFor="edit-invitacion-confirmada" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                        ¿Invitación Confirmada?
                      </label>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Teléfono de Confirmación del Candidato
                      </label>
                      <input 
                        type="text"
                        value={editingPropuesta.telefonoConfirmacionCandidato || ''}
                        onChange={e => setEditingPropuesta({ ...editingPropuesta, telefonoConfirmacionCandidato: e.target.value })}
                        placeholder="Ej. 5691 1935"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
                      />
                    </div>
                  </div>
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

      {/* SHARE CONFIG MODAL */}
      {shareConfigPropuesta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-xl p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setShareConfigPropuesta(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-blue-900">Compartir Ficha del Candidato</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{shareConfigPropuesta.nombreCandidato}</p>
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

              {/* Date Limit Configuration */}
              {shareConfigPropuesta.habilitarOpinion && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-black text-slate-800">
                      Fecha y Hora Límite
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Define el momento límite para recibir opiniones. Deja vacío si no deseas establecer un límite de tiempo.
                    </p>
                  </div>
                  <input
                    type="datetime-local"
                    value={shareConfigPropuesta.fechaLimiteOpinion || ''}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const updated = { ...shareConfigPropuesta, fechaLimiteOpinion: val || undefined };
                      setPropuestas(propuestas.map(p => p.id === updated.id ? updated : p));
                      setShareConfigPropuesta(updated);
                      try {
                        await firebaseService.updateProposal(updated.id, { fechaLimiteOpinion: val || null });
                      } catch (err) {
                        console.error("Error setting proposal opinion date limit:", err);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-600"
                  />
                </div>
              )}

              {/* President of Commission Configuration */}
              {shareConfigPropuesta.habilitarOpinion && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-black text-slate-800">
                      Presidente de la Comisión de Afiliación
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Selecciona al presidente designado para coordinar y recibir esta consulta.
                    </p>
                  </div>
                  <select
                    value={shareConfigPropuesta.presidenteComision || ''}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const updated = { ...shareConfigPropuesta, presidenteComision: val || undefined };
                      setPropuestas(propuestas.map(p => p.id === updated.id ? updated : p));
                      setShareConfigPropuesta(updated);
                      try {
                        await firebaseService.updateProposal(updated.id, { presidenteComision: val || null });
                      } catch (err) {
                        console.error("Error setting proposal commission president:", err);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700"
                  >
                    <option value="">No designado</option>
                    {socios.map(socio => (
                      <option key={socio.id} value={socio.nombre}>{socio.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

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

      {/* VIEW OPINIONS MODAL */}
      {viewingOpinionsPropuesta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setViewingOpinionsPropuesta(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2.5 text-blue-900">
                <MessageSquare size={22} className="shrink-0" />
                <h2 className="text-xl sm:text-2xl font-black">Opiniones Recibidas</h2>
              </div>
              <p className="text-xs text-slate-505 font-bold uppercase tracking-wider">{viewingOpinionsPropuesta.nombreCandidato}</p>
            </div>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {viewingOpinionsPropuesta.opiniones && viewingOpinionsPropuesta.opiniones.length > 0 ? (
                viewingOpinionsPropuesta.opiniones.map((op) => (
                  <div 
                    key={op.id} 
                    className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/60 text-xs relative group flex justify-between items-start gap-4 hover:border-slate-300 transition-all shadow-sm/30"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Opinión Anónima
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {op.fecha}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-semibold text-xs bg-white p-3.5 rounded-xl border border-slate-150 break-words shadow-sm/10">
                        "{op.comentario}"
                      </p>
                      
                      {/* Technical details context */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">
                          Detalles Técnicos del Envío
                        </span>
                        {op.metadatos ? (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            <span className="bg-slate-100 border border-slate-200/50 text-[9.5px] font-extrabold text-slate-655 px-2.5 py-1 rounded-lg flex items-center" title="Sistema Operativo">
                              <span className="mr-1">💻</span> {op.metadatos.sistemaOperativo}
                            </span>
                            <span className="bg-slate-100 border border-slate-200/50 text-[9.5px] font-extrabold text-slate-655 px-2.5 py-1 rounded-lg flex items-center" title="Navegador">
                              <span className="mr-1">🌐</span> {op.metadatos.navegador}
                            </span>
                            <span className="bg-slate-100 border border-slate-200/50 text-[9.5px] font-extrabold text-slate-655 px-2.5 py-1 rounded-lg flex items-center" title="Tipo de Dispositivo">
                              <span className="mr-1">📱</span> {op.metadatos.dispositivo}
                            </span>
                            <span className="bg-slate-100 border border-slate-200/50 text-[9.5px] font-extrabold text-slate-655 px-2.5 py-1 rounded-lg flex items-center" title="Resolución de pantalla">
                              <span className="mr-1">🖥️</span> {op.metadatos.resolucion}
                            </span>
                            <span className="bg-slate-100 border border-slate-200/50 text-[9.5px] font-extrabold text-slate-655 px-2.5 py-1 rounded-lg flex items-center truncate max-w-[165px]" title={`Zona horaria: ${op.metadatos.zonaHoraria}`}>
                              <span className="mr-1">🕒</span> {op.metadatos.zonaHoraria.split('/').pop()?.replace('_', ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-semibold">
                            Sin información de dispositivo (opinión previa a actualización).
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("¿Está seguro de eliminar esta opinión permanentemente?")) return;
                        const filtered = (viewingOpinionsPropuesta.opiniones || []).filter(o => o.id !== op.id);
                        const updated = { ...viewingOpinionsPropuesta, opiniones: filtered };
                        setPropuestas(propuestas.map(p => p.id === updated.id ? updated : p));
                        setViewingOpinionsPropuesta(updated);
                        try {
                          await firebaseService.updateProposal(updated.id, { opiniones: filtered });
                        } catch (err) {
                          console.error("Error deleting opinion:", err);
                        }
                      }}
                      className="p-2 text-slate-450 hover:text-red-655 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                      title="Eliminar opinión permanentemente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 italic font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No se han recibido opiniones anónimas aún para este candidato.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingOpinionsPropuesta(null)}
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

              {/* Deadline configuration for the entire list */}
              <div className="space-y-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center">
                  <Clock size={14} className="mr-1.5 text-indigo-700 animate-pulse" />
                  Límite para opinar (Toda la lista)
                </label>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Establece una fecha y hora límite unificada para todos los candidatos que tienen habilitada la consulta de opinión en esta lista.
                </p>
                <input
                  type="datetime-local"
                  value={propuestas.filter(p => p.estado === 'Pendiente').find(p => p.fechaLimiteOpinion)?.fechaLimiteOpinion || ''}
                  onChange={async (e) => {
                    const val = e.target.value;
                    const updatedPropuestas = propuestas.map(p => 
                      p.estado === 'Pendiente' ? { ...p, fechaLimiteOpinion: val || undefined } : p
                    );
                    setPropuestas(updatedPropuestas);
                    
                    const pending = propuestas.filter(p => p.estado === 'Pendiente');
                    for (const prop of pending) {
                      try {
                        await firebaseService.updateProposal(prop.id, { fechaLimiteOpinion: val || null });
                      } catch (err) {
                        console.error("Error setting proposal opinion date limit:", err);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all text-xs"
                />
              </div>

              {/* President of Commission configuration for the entire list */}
              <div className="space-y-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center">
                  <User size={14} className="mr-1.5 text-indigo-700" />
                  Presidente de la Comisión (Toda la lista)
                </label>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Asigna al presidente de la comisión de afiliación que coordinará esta lista colectiva de consulta.
                </p>
                <select
                  value={propuestas.filter(p => p.estado === 'Pendiente').find(p => p.presidenteComision)?.presidenteComision || ''}
                  onChange={async (e) => {
                    const val = e.target.value;
                    const updatedPropuestas = propuestas.map(p => 
                      p.estado === 'Pendiente' ? { ...p, presidenteComision: val || undefined } : p
                    );
                    setPropuestas(updatedPropuestas);
                    
                    const pending = propuestas.filter(p => p.estado === 'Pendiente');
                    for (const prop of pending) {
                      try {
                        await firebaseService.updateProposal(prop.id, { presidenteComision: val || null });
                      } catch (err) {
                        console.error("Error setting proposal commission president:", err);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all text-xs text-slate-700"
                >
                  <option value="">No designado</option>
                  {socios.map(socio => (
                    <option key={socio.id} value={socio.nombre}>{socio.nombre}</option>
                  ))}
                </select>
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
                        className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-4">
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

      {isOpenLettersModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setIsOpenLettersModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-blue-900">Generar Cartas de Invitación</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Configurar evento y descargar cartas para los nuevos socios aprobados</p>
            </div>

            <div className="space-y-6">
              {/* Event Settings */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Fecha de la Charla *
                    </label>
                    <input
                      type="date"
                      value={charlaDate}
                      onChange={e => setCharlaDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700"
                    />
                    <input
                      type="text"
                      value={charlaDateText}
                      onChange={e => setCharlaDateText(e.target.value)}
                      placeholder="Ej. jueves 25 de julio de 2024"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700 mt-1.5"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Formato largo de la fecha que se imprimirá en la carta.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Fecha Límite de Confirmación *
                    </label>
                    <input
                      type="date"
                      value={limiteDate}
                      onChange={e => setLimiteDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700"
                    />
                    <input
                      type="text"
                      value={limiteDateText}
                      onChange={e => setLimiteDateText(e.target.value)}
                      placeholder="Ej. 22 de julio de 2024"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700 mt-1.5"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Fecha límite para confirmar asistencia.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-200/60">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Teléfono de Confirmación *
                  </label>
                  <input
                    type="text"
                    value={telefonoConfirmacion}
                    onChange={e => setTelefonoConfirmacion(e.target.value)}
                    placeholder="Ej. 5691 1935"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Número de contacto (llamadas o WhatsApp) impreso en la sección de RSVP.</p>
                </div>
              </div>

              {/* Candidates List */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Listado de Socios Aprobados
                </h3>
                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                  {propuestas.filter(p => p.estado === 'Aprobado').map(p => (
                    <div 
                      key={p.id}
                      className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-350 transition-all shadow-sm"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <img
                          src={p.fotoCandidato || `https://picsum.photos/seed/${p.id}/100/100`}
                          alt={p.nombreCandidato}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-slate-900 truncate">
                            {p.nombreCandidato}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate font-semibold">
                            {p.profesionCandidato}
                          </p>
                        </div>
                      </div>

                      {/* Gender Selector Toggle */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex rounded-xl bg-slate-250 p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setCandidateGenders({ ...candidateGenders, [p.id]: 'Masculino' })}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              candidateGenders[p.id] === 'Masculino'
                                ? 'bg-blue-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Estimado
                          </button>
                          <button
                            type="button"
                            onClick={() => setCandidateGenders({ ...candidateGenders, [p.id]: 'Femenino' })}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              candidateGenders[p.id] === 'Femenino'
                                ? 'bg-blue-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Estimada
                          </button>
                        </div>

                        {/* Individual Download */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!charlaDateText || !limiteDateText) {
                              alert('Por favor complete las fechas.');
                              return;
                            }
                            generateCartasInvitacionPDF(
                              [{ id: p.id, nombreCandidato: p.nombreCandidato, generoCandidato: candidateGenders[p.id] || 'Masculino' }],
                              charlaDateText,
                              limiteDateText,
                              telefonoConfirmacion,
                              'download'
                            );
                          }}
                          className="p-2.5 bg-white border border-slate-200 rounded-xl text-emerald-600 hover:bg-emerald-550 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-center shrink-0 animate-pulse hover:animate-none"
                          title="Descargar carta individual"
                        >
                          <Mail size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpenLettersModal(false)}
                className="px-5 py-3 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-xs order-last sm:order-first"
              >
                Cerrar Ventana
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!charlaDateText || !limiteDateText) {
                    alert('Por favor complete las fechas.');
                    return;
                  }
                  const approvedList = propuestas.filter(p => p.estado === 'Aprobado');
                  if (approvedList.length === 0) return;
                  const inputs = approvedList.map(p => ({
                    id: p.id,
                    nombreCandidato: p.nombreCandidato,
                    generoCandidato: candidateGenders[p.id] || 'Masculino'
                  }));
                  generateCartasInvitacionPDF(inputs, charlaDateText, limiteDateText, telefonoConfirmacion, 'download');
                }}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-750 text-white font-black rounded-xl transition-all text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/15 active:scale-95"
              >
                <Mail size={14} />
                <span>Descargar Todas las Cartas (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
