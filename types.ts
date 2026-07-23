
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TESORERO = 'TESORERO',
  SECRETARIO = 'SECRETARIO',
  ASESOR_SERVICIOS = 'ASESOR_SERVICIOS',
  PRESIDENTE_AFILIACION = 'PRESIDENTE_AFILIACION',
  SOCIO = 'SOCIO',
  DONANTE = 'DONANTE',
  GUEST = 'GUEST'
}

export interface PagoCuota {
  id: string;
  fechaPago: string; // "YYYY-MM-DD"
  monto: number;
  periodo: string; // e.g., "Enero 2026", "1er Semestre 2026", "Año 2026"
  tipoPeriodo: 'Mensual' | 'Semestral' | 'Anual' | 'Trimestral';
  metodo: 'Transferencia' | 'Depósito' | 'Efectivo';
  bancoReferencia?: string;
  numeroReferencia?: string;
  tipoCuota?: 'inscripcion' | 'ordinaria' | 'extraordinaria' | 'donacion';
  descripcion?: string;
  comprobanteUrl?: string;
}

export interface Socio {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole | string;
  puesto?: string;
  password?: string;
  puestosAdicionales?: string[];   // Cargos o comisiones adicionales
  codigoSocio?: string;            // Código único de identificación del socio
  estadoCuotas: 'Al día' | 'Pendiente' | 'En mora';
  montoPendiente: number;
  foto: string;
  fechaIngreso: string;
  telefono?: string;
  estatus?: string;
  fechaFin?: string;
  club?: string;
  qrToken?: string;
  dpi?: string;                    // DPI o identificación oficial
  fechaNacimiento?: string;        // Fecha de nacimiento
  direccion?: string;              // Dirección de residencia
  profesion?: string;              // Profesión u ocupación
  editadoPor?: string;
  fechaEdicion?: string;
  historialPagos?: PagoCuota[];
  fechaUltimoPago?: string;
}

export interface Acta {
  id: string;
  titulo: string;
  fecha: string;
  contenido: string;
  autor: string;
  pdfUrl: string;
  categoria?: string;
  estado?: 'Borrador' | 'Publicada';
  codigoRegistro?: string;
  numeroActa?: string;
}

export interface Donacion {
  id: string;
  donante: string;
  monto: number;
  fecha: string;
  proyecto: string;
  tipo: 'Individual' | 'Empresarial';
}

export interface Beneficio {
  id: string;
  titulo: string;
  descripcion: string;
  convenioCon: string;
  descuento: string;
  categoria: 'Salud' | 'Comercio' | 'Recreación' | 'Otros';
}

export interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  imagen: string;
  publica: boolean;
  conBotonDonacion?: boolean;
  donacionUrl?: string;
  conBotonVoluntariado?: boolean;
  conBotonAsistencia?: boolean;
  costoSocio?: number;
  costoInvitado?: number;
  vestimenta?: string;
}

export interface RegistroParticipacion {
  id: string;
  actividadId: string;
  actividadTitulo: string;
  nombre: string;
  esSocio: boolean;
  esSocioLeo?: boolean;
  telefono: string;
  llevaInvitados: boolean;
  cantidadInvitados: number;
  fechaRegistro: string;
}


export interface GaleriaItem {
  id: string;
  titulo: string;
  fecha: string;
  url: string;
  descripcion: string;
  categoria?: string;
  contextoPremium?: string;
  esFondoPantalla?: boolean;
  
  // Museo de Personajes Ilustres
  tipoPersonaje?: 'presidente' | 'directiva' | 'relevante' | 'fundador';
  periodoServicio?: string;
  puestoCargo?: string;
  logrosDestacados?: string[];
  citaHonorifica?: string;
}

export interface HitoHistorico {
  id: string;
  titulo: string;
  fecha: string;
  descripcion: string;
  imagenUrl?: string;
  videoUrl?: string;
  categoria: 'Club de Leones' | 'Ciudad de Quetzaltenango';
  estado: 'Borrador' | 'Publicado';
}

export interface ContactoAgenda {
  id: string;
  nombre: string;
  telefono: string;
  organizacion: string;
  referencia: string;
  campoTrabajo: string;
}

export interface AuthState {
  user: Socio | null;
  isAuthenticated: boolean;
  accessToken?: string;
}

export interface PropuestaSocio {
  id: string;
  proponente: string;
  nombreCandidato: string;
  profesionCandidato: string;
  fotoCandidato?: string;
  caracteristicas: string[];
  motivoPropuesta: string;
  porQueBuenLeon: string;
  fechaPropuesta: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  generoCandidato?: 'Masculino' | 'Femenino';
  estadoCivil?: string;
  hijos?: string;
  nombreEsposa?: string;
  habilitarOpinion?: boolean;
  fechaLimiteOpinion?: string;
  presidenteComision?: string;
  invitacionConfirmada?: boolean;
  telefonoConfirmacionCandidato?: string;
  fechaConfirmacionInvitacion?: string;
  opiniones?: { 
    id: string; 
    fecha: string; 
    comentario: string;
    metadatos?: {
      navegador: string;
      sistemaOperativo: string;
      dispositivo: string;
      idioma: string;
      resolucion: string;
      zonaHoraria: string;
    };
  }[];
}

export interface Responsable {
  nombre: string;
  telefono: string;
}

export interface Solicitud {
  id: string;
  nombre: string; // Nombre de la solicitud (o nombre de la persona que solicita en caso de silla de ruedas)
  fecha?: string; // Opcional para sillas de ruedas
  descripcion?: string; // Opcional para sillas de ruedas (detalles extra)
  faseTracking?: 'recibido' | 'en_proceso' | 'en_analisis' | 'resolucion';
  responsables?: Responsable[]; // Opcional para sillas de ruedas (de 1 a 3 responsables)
  tema?: string; // Opcional para sillas de ruedas (Diabetes, Visión, etc.)
  otroTemaDescripcion?: string; // Opcional
  tipo: 'abiertas' | 'internas' | 'sillas' | 'agenda' | 'salon'; // Tipos alineados a minúsculas
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  usuarioCreador?: string; // email o id del socio/admin o 'público'
  fechaCreacion: string;
  resolucionRazon?: string;
  fechaResolucion?: string;
  documentoUrl?: string; // URL de la imagen o PDF de la carta/solicitud adjunta
  documentoNombre?: string; // Nombre original del archivo adjunto
  archivada?: boolean; // Indicador de si la solicitud ha sido archivada

  // Campos específicos para solicitudes de Sillas de Ruedas
  nombreSolicitante?: string;
  dpiSolicitante?: string;
  telefonoSolicitante?: string;
  nombreBeneficiario?: string;
  edadBeneficiario?: number;
  tiempoUso?: string;

  // Campos específicos para Puntos de Agenda
  agendaSocioNombre?: string;
  agendaNombrePunto?: string;
  agendaContenido?: string;
  agendaRazon?: string;

  // Campos específicos para alquiler de salón y parqueo
  salonDia?: string;
  salonHoraInicio?: string;
  salonHoraFin?: string;
  salonTipoAlquiler?: 'salon' | 'parqueo' | 'ambos';
  salonAsistentes?: number;
  salonCompromisoLimpieza?: 'dejar_limpio' | 'pagar_limpieza';
  salonCostoTotal?: number;
  salonRequisitosAceptados?: boolean;
  salonEsSocio?: boolean;
  salonTelefono?: string;
  salonEmail?: string;
  salonNombreSolicitante?: string;
}

export interface VehiculoParqueo {
  id: string;
  tipoPlaca: string;
  numeroPlaca: string;
  isExtranjera: boolean;
  color: string;
  colorLabel: string;
  horaEntrada: string;
  horaSalida?: string;
  estado: 'Activo' | 'Completado';
  costo?: number;
  metodoPago?: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  numeroEspacio?: number;
}

export interface RubroPresupuesto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  fechaCreacion: string;
  activo: boolean;
}

export interface FondoPresupuesto {
  id: string;
  tipo: 'Cuotas' | 'Autónomo' | 'Actividad';
  monto: number;
  descripcion: string;
  fecha: string;
}

export interface AsignacionComision {
  id: string;
  comision: string; // ID of the Comision
  monto: number;
  rubroId: string;
  temporalidad: 'Mensual' | 'Bimensual' | 'Trimestral' | 'Semestral' | 'Anual' | 'Unica';
  actividad?: string;
  descripcion: string;
  fechaCreacion: string;
}

export interface Comision {
  id: string;
  nombre: string;
  proposito: string;
  miembros: string[]; // IDs de los socios
  coordinador?: string; // ID del socio coordinador
  actasVinculadas?: string[]; // IDs o Títulos de actas
  fechaCreacion: string;
  estado: 'Activa' | 'Inactiva';
}

export interface MinutaPunto {
  id: string;
  punto: string;
  discusion: string;
}

export interface MinutaComision {
  id: string;
  tema: string;
  comisionId: string;
  miembrosComision: string[];
  otrosParticipantes: string[];
  fechaHora: string;
  puntos: MinutaPunto[];
  solicitudVinculadaId?: string;
}

export interface SolicitudVoluntario {
  id: string;
  actividadId: string;
  actividadTitulo: string;
  nombre: string;
  correo: string;
  telefono: string; // Almacenará el teléfono completo con prefijo, ej. "+50255555555"
  mensaje?: string;
  fechaRegistro: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

export interface AgendaPunto {
  id: string;
  titulo: string;
  descripcion: string;
  origenTipo: 'manual' | 'solicitud';
  origenId?: string; // ID de la solicitud vinculada, si existe
  asignadoAComisionId?: string; // ID de la comisión asignada, si aplica
  urgencia?: 'Alta' | 'Media' | 'Baja';
  fechaLimite?: string;
  comisionNombre?: string;
  agregadoAActas?: boolean;
  proponenteNombre?: string; // Nombre del socio o persona tercera que propone el punto (Opcional)
  proponenteSocioId?: string; // ID del socio si fue seleccionado de la lista (Opcional)
}

export interface ReunionAgenda {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  puntos: AgendaPunto[];
  estado: 'Borrador' | 'Finalizada';
  fechaCreacion: string;
  autor: string;
  categoria?: 'protocolaria' | 'ordinaria' | 'extraordinaria' | 'comisiones';
  codigo?: string;
  presidencia?: string;
}

export interface TareaComision {
  id: string;
  comisionId: string;
  agendaId?: string;
  agendaPuntoId?: string;
  punto: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaLimite?: string;
  urgencia: 'Alta' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'Resuelta';
  fechaResolucion?: string;
  minutaResolucionId?: string;
}

export interface Asistencia {
  id: string;
  socioId: string;
  socioNombre: string;
  tipo: 'reunion' | 'actividad' | 'voluntariado';
  eventoId: string;
  eventoTitulo: string;
  fecha: string;
  asistio: boolean;
}

export interface BienInventario {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidadMedida: string;
  estado: 'excelente' | 'bueno' | 'regular' | 'dañado' | 'en_reparacion';
  ubicacion: string;
  responsableNombre: string;
  valorEstimado?: number;
  fechaAdquisicion?: string;
  esDonacion: boolean;
  donanteNombre?: string;
  imagenUrl?: string;
  notas?: string;
  historial?: {
    id: string;
    fecha: string;
    tipo: 'registro' | 'mantenimiento' | 'actualizacion_estado' | 'prestamo' | 'donado';
    descripcion: string;
    usuario: string;
  }[];
}

export interface CategoriaInventario {
  id: string;
  label: string;
  prefix: string;
}

export interface ConvencionActividad {
  id: string;
  title: string;
  description: string;
  time: string;
  iconName: string;
}

export interface ConvencionExperiencia {
  id: string;
  title: string;
  desc: string;
  badge: string;
}

export interface ConvencionConfig {
  titulo: string;
  lema: string;
  fechaEvento: string;
  horaEvento: string;
  fotoSede: string;
  fotoSedeEtiqueta?: string;
  fotoSedeDescripcion?: string;
  inscripcionesAbiertas: boolean;
  actividadesCulturales?: ConvencionActividad[];
  experienciasUnicas?: ConvencionExperiencia[];
}

export interface ConvencionRegistro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  club: string;
  cargo: string;
  distrito: string;
  fechaRegistro: string;
}

export interface TareaVoluntario {
  id: string;
  descripcion: string;
  socioId: string | null;
  socioNombre: string | null;
  socioTelefono?: string | null;
}

export interface MaterialNecesidad {
  id: string;
  descripcion: string;
  cantidad: number;
  socioId: string | null;
  socioNombre: string | null;
  socioTelefono?: string | null;
  completado: boolean;
}

export interface ComisionRequerimiento {
  id: string;
  nombreComision: string;
  objetivo: string;
  acciones: TareaVoluntario[];
  necesidades: MaterialNecesidad[];
}

export interface RequerimientoActividad {
  id: string;
  tituloActividad: string;
  comisionCreadoraId: string;
  comisionCreadoraNombre: string;
  fechaActividad: string;
  lugarActividad: string;
  descripcionActividad: string;
  fechaLimiteConvocatoria: string;
  estado: 'Borrador' | 'Activa' | 'Cerrada';
  comisionesRequeridas: ComisionRequerimiento[];
  fechaCreacion: string;
  creadoPorNombre: string;
}

