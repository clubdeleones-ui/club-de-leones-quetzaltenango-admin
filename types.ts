
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
  tipoPeriodo: 'Mensual' | 'Semestral' | 'Anual';
  metodo: 'Transferencia' | 'Depósito' | 'Efectivo';
  bancoReferencia?: string;
  numeroReferencia?: string;
}

export interface Socio {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
  puesto?: string;
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
}

export interface GaleriaItem {
  id: string;
  titulo: string;
  fecha: string;
  url: string;
  descripcion: string;
  categoria?: string;
  contextoPremium?: string;
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
  responsables?: Responsable[]; // Opcional para sillas de ruedas (de 1 a 3 responsables)
  tema?: string; // Opcional para sillas de ruedas (Diabetes, Visión, etc.)
  otroTemaDescripcion?: string; // Opcional
  tipo: 'abiertas' | 'internas' | 'sillas'; // Tipos alineados a minúsculas
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  usuarioCreador?: string; // email o id del socio/admin o 'público'
  fechaCreacion: string;
  resolucionRazon?: string;
  fechaResolucion?: string;

  // Campos específicos para solicitudes de Sillas de Ruedas
  nombreSolicitante?: string;
  dpiSolicitante?: string;
  telefonoSolicitante?: string;
  nombreBeneficiario?: string;
  edadBeneficiario?: number;
  tiempoUso?: string;
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
