import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, PropuestaSocio } from '../types';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  UserPlus, 
  ArrowLeft, 
  CheckCircle, 
  Image as ImageIcon, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Send 
} from 'lucide-react';

const CARACTERISTICAS_OPCIONES = [
  { id: 'altruismo', label: 'Altruismo y Solidaridad', icon: Heart, description: 'Vocación innata por ayudar de manera desinteresada.' },
  { id: 'honestidad', label: 'Honestidad e Integridad', icon: ShieldCheck, description: 'Comportamiento recto, sincero y ético.' },
  { id: 'proactividad', label: 'Proactividad e Iniciativa', icon: Sparkles, description: 'Iniciativa para resolver problemas y proponer mejoras.' },
  { id: 'liderazgo', label: 'Liderazgo de Servicio', icon: UserPlus, description: 'Capacidad para guiar con el ejemplo y organizar actividades.' },
  { id: 'servicio', label: 'Vocación de Servicio', icon: Heart, description: 'Alineación con el lema de Lions: "Nosotros Servimos".' },
  { id: 'companerismo', label: 'Compañerismo y Empatía', icon: Sparkles, description: 'Habilidad para trabajar armoniosamente en equipo.' },
  { id: 'sensibilidad', label: 'Sensibilidad Comunitaria', icon: ShieldCheck, description: 'Empatía y preocupación real por el desarrollo local.' }
];

// Helper to wrap promises in a timeout to avoid indefinite hanging on bad mobile networks
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

const ProponerSocio: React.FC = () => {
  const navigate = useNavigate();
  
  // Form states
  const [proponente, setProponente] = useState('');
  const [mostrarCamposPropuesta, setMostrarCamposPropuesta] = useState(false);
  const [nombreCandidato, setNombreCandidato] = useState('');
  const [profesionCandidato, setProfesionCandidato] = useState('');
  const [fotoCandidato, setFotoCandidato] = useState<string>('');
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [motivoPropuesta, setMotivoPropuesta] = useState('');
  const [porQueBuenLeon, setPorQueBuenLeon] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [hijos, setHijos] = useState('');
  const [nombreEsposa, setNombreEsposa] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // File Upload Helper (converts to base64 with client-side canvas compression)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressing(true);
      try {
        const compressedBase64 = await compressImageFile(file, 800, 800, 0.7);
        setFotoCandidato(compressedBase64);
      } catch (error) {
        console.error("Error compressing image, falling back to original:", error);
        // Fallback: read original file as DataURL if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setFotoCandidato(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleCheckboxChange = (label: string) => {
    if (caracteristicas.includes(label)) {
      setCaracteristicas(caracteristicas.filter(c => c !== label));
    } else {
      setCaracteristicas([...caracteristicas, label]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proponente || !nombreCandidato || !profesionCandidato || !motivoPropuesta || !porQueBuenLeon || !estadoCivil || !hijos) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }


    setLoading(true);
    const candidateId = `prop-${Date.now()}`;
    let finalPhotoUrl = fotoCandidato || 'https://picsum.photos/seed/' + Math.random() + '/200/200';

    try {
      // 1. Upload photo (simply returns the base64 URL now to avoid Storage latency)
      if (fotoCandidato && fotoCandidato.startsWith('data:')) {
        finalPhotoUrl = await firebaseService.uploadCandidatePhoto(fotoCandidato, candidateId);
      }

      const nuevaPropuesta: PropuestaSocio = {
        id: candidateId,
        proponente,
        nombreCandidato,
        profesionCandidato,
        fotoCandidato: finalPhotoUrl,
        caracteristicas,
        motivoPropuesta,
        porQueBuenLeon,
        fechaPropuesta: new Date().toISOString().split('T')[0],
        estado: 'Pendiente',
        estadoCivil,
        hijos,
        nombreEsposa: estadoCivil === 'Casado' ? nombreEsposa : undefined
      };

      let isSynced = false;
      try {
        // 2. Save proposal to Firestore (Wrapped in a 8-second timeout for quick feedback)
        await withTimeout(
          firebaseService.saveProposal(nuevaPropuesta),
          8000,
          "El servidor de la base de datos central tardó demasiado en responder."
        );
        isSynced = true;
      } catch (firestoreError: any) {
        console.error("Firestore save failed, falling back to local storage:", firestoreError);
        alert(`Aviso: No se pudo subir la propuesta al servidor central (${firestoreError?.message || firestoreError}). La propuesta quedará guardada temporalmente en este dispositivo y se visualizará en tu directorio.`);
      }

      // Add sync state metadata to the local copy
      const propuestaLocal = {
        ...nuevaPropuesta,
        synced: isSynced
      };

      // 3. Save to localStorage
      const localPropuestas = localStorage.getItem('club_leones_propuestas');
      const propuestasActuales = localPropuestas ? JSON.parse(localPropuestas) : [];
      localStorage.setItem('club_leones_propuestas', JSON.stringify([propuestaLocal, ...propuestasActuales]));

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting proposal:", err);
      alert("Ocurrió un error inesperado al procesar la propuesta. Por favor intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNombreCandidato('');
    setProfesionCandidato('');
    setFotoCandidato('');
    setCaracteristicas([]);
    setMotivoPropuesta('');
    setPorQueBuenLeon('');
    setEstadoCivil('');
    setHijos('');
    setNombreEsposa('');
    setSubmitted(false);
    setMostrarCamposPropuesta(false);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 tracking-tight">¡Propuesta Enviada Exitosamente!</h2>
        <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
          Agradecemos tu iniciativa. La propuesta para incorporar a <strong className="text-slate-800">{nombreCandidato}</strong> ha sido registrada en el Libro de Candidaturas del club.
        </p>
        <p className="text-xs text-yellow-600 font-semibold bg-yellow-50 px-4 py-2 rounded-xl w-fit mx-auto">
          La Junta Directiva y Secretaría evaluarán la postulación en la próxima asamblea.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <button
            onClick={handleReset}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-xl transition-all"
          >
            Hacer Otra Propuesta
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/10"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-6 sm:pt-12 pb-8 px-2 sm:px-4 animate-in fade-in duration-700">
      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-200/85 shadow-2xl p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-yellow-500 to-blue-900" />
        
        {/* Title branding */}
        <div className="text-center space-y-3">
          <span className="bg-blue-50 text-blue-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
            Comité de Membresía y Afiliación
          </span>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
            Preside C.L. José Mérida
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 tracking-tight mt-3">Propuesta de Nuevo Socio</h1>
          <p className="text-slate-650 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-medium">
            Nuestra fuerza radica en el servicio y la calidad humana. Si conoces a alguien comprometido con la comunidad, preséntalo para ser un León.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Proponente Section */}
          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <span className="text-yellow-500 mr-2">🔑</span>
              1. Socio Proponente
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre del Socio Activo que lo Propone *</label>
              <input 
                type="text"
                required
                value={proponente}
                onChange={e => setProponente(e.target.value)}
                placeholder="Ej. Elena Castillo Castillo"
                className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
              />
              <p className="text-xs text-slate-600 mt-1.5 font-medium">
                Para proponer formalmente, debe ser un miembro activo y solvente de la institución.
              </p>
            </div>
          </div>

          {/* Toggle button to add proposal fields */}
          {!mostrarCamposPropuesta && (
            <button
              type="button"
              onClick={() => {
                if (!proponente.trim()) {
                  alert('Por favor escriba primero su nombre como Socio Proponente.');
                  return;
                }
                setMostrarCamposPropuesta(true);
              }}
              className="w-full py-3.5 border-2 border-dashed border-blue-200 hover:border-blue-900 text-blue-900 font-bold text-sm rounded-2xl transition-all flex items-center justify-center space-x-3 bg-blue-50/10 hover:bg-blue-50/20 active:scale-[0.99]"
            >
              <UserPlus size={18} />
              <span>Agregar Propuesta de Candidato</span>
            </button>
          )}

          {/* Proposal fields container */}
          {mostrarCamposPropuesta && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-base font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                <span className="text-yellow-500 mr-2">🦁</span>
                2. Datos de la Persona Propuesta
              </h3>

              {/* Candidato Name and Profession */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre Completo del Candidato *</label>
                  <input 
                    type="text"
                    required
                    value={nombreCandidato}
                    onChange={e => setNombreCandidato(e.target.value)}
                    placeholder="Ej. Dr. Mario Juárez Sandoval"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Campo Profesional / Ocupación *</label>
                  <input 
                    type="text"
                    required
                    value={profesionCandidato}
                    onChange={e => setProfesionCandidato(e.target.value)}
                    placeholder="Ej. Médico Pediatra, Abogado, Empresario"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Photo Upload (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fotografía del Candidato (Opcional)</label>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-300 shadow-inner">
                    {fotoCandidato ? (
                      <img src={fotoCandidato} alt="Previsualización" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-400" size={24} />
                    )}
                  </div>
                  <div className="flex flex-col items-center sm:items-start flex-1 w-full">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      id="foto-upload"
                      className="hidden" 
                    />
                    <label 
                      htmlFor="foto-upload"
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-4 py-2 rounded-xl cursor-pointer text-xs transition-colors inline-block active:scale-95"
                    >
                      Subir Imagen
                    </label>
                    {compressing ? (
                      <p className="text-[11px] text-blue-900 mt-2 font-bold animate-pulse">Comprimiendo imagen...</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-2 font-medium">Formatos recomendados: JPG, PNG. Tamaño máximo 2MB.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fila de checkboxes (Características de Lions International) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Cualidades y Características Destacadas *</label>
                <p className="text-xs text-slate-600 font-medium">Marque las características y aptitudes sobresalientes que describe al candidato en su ética y servicio.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {CARACTERISTICAS_OPCIONES.map(opc => {
                    const SelectedIcon = opc.icon;
                    const isSelected = caracteristicas.includes(opc.label);
                    return (
                      <div 
                        key={opc.id}
                        onClick={() => handleCheckboxChange(opc.label)}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-start space-x-2.5 sm:space-x-3 select-none active:scale-[0.98] ${
                          isSelected 
                            ? 'border-blue-900 bg-blue-50/20 shadow-sm' 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handle handled at div click level
                          className="w-4 h-4 text-blue-900 border-slate-300 rounded focus:ring-blue-900 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 flex items-center">
                            <SelectedIcon size={14} className="mr-1.5 text-blue-900/60" />
                            {opc.label}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 leading-tight font-medium">{opc.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Justification Textareas */}
              <div className="space-y-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">¿Por qué propone a esta persona? *</label>
                  <textarea 
                    rows={4}
                    required
                    value={motivoPropuesta}
                    onChange={e => setMotivoPropuesta(e.target.value)}
                    placeholder="Redacte un breve párrafo describiendo los antecedentes de servicio, trayectoria moral o amistad comunitaria..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm"
                    spellCheck={true}
                    autoCorrect="on"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">¿Por qué considera que sería un buen León en el club? *</label>
                  <textarea 
                    rows={4}
                    required
                    value={porQueBuenLeon}
                    onChange={e => setPorQueBuenLeon(e.target.value)}
                    placeholder="Describa el valor agregado que traerá al club: compromiso, tiempo, ideas frescas o redes de ayuda para fortalecer la labor del Club de Leones..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm"
                    spellCheck={true}
                    autoCorrect="on"
                  />
                </div>
              </div>

              {/* Datos Complementarios */}
              <div className="space-y-6 pt-6 border-t border-slate-100/80">
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <span className="text-yellow-500 mr-2">📋</span>
                  3. Datos Complementarios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Estado Civil *</label>
                    <div className="relative">
                      <select 
                        required
                        value={estadoCivil}
                        onChange={e => setEstadoCivil(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold appearance-none bg-white cursor-pointer"
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="Soltero">Soltero(a)</option>
                        <option value="Casado">Casado(a)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Hijos *</label>
                    <div className="relative">
                      <select 
                        required
                        value={hijos}
                        onChange={e => setHijos(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold appearance-none bg-white cursor-pointer"
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="Sin hijos">Sin hijos</option>
                        <option value="Con hijos">Con hijos</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  {estadoCivil === 'Casado' && (
                    <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre del Cónyuge (Opcional)</label>
                      <input 
                        type="text"
                        value={nombreEsposa}
                        onChange={e => setNombreEsposa(e.target.value)}
                        placeholder="Ej. María Fernanda López"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-6 border-t border-slate-100 flex justify-center sm:justify-end">
                <button
                  type="submit"
                  disabled={loading || compressing}
                  className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-3 shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all text-sm disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>{loading ? 'Enviando al Comité...' : compressing ? 'Procesando Imagen...' : 'Enviar Propuesta al Comité'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProponerSocio;
