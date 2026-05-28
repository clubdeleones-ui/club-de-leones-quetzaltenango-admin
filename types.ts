
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

export interface Socio {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
  puesto?: string;
  estadoCuotas: 'Al día' | 'Pendiente' | 'En mora';
  montoPendiente: number;
  foto: string;
  fechaIngreso: string;
  telefono?: string;
  estatus?: string;
  fechaFin?: string;
  club?: string;
  qrToken?: string;
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
}

export interface GaleriaItem {
  id: string;
  titulo: string;
  fecha: string;
  url: string;
  descripcion: string;
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
  estadoCivil?: string;
  hijos?: string;
  nombreEsposa?: string;
}

export interface Responsable {
  nombre: string;
  telefono: string;
}

export interface Solicitud {
  id: string;
  nombre: string; // Nombre de la solicitud
  fecha: string;
  descripcion: string;
  responsables: Responsable[]; // de 1 a 3 responsables
  tema: string; // Diabetes, Visión, Mitigación del Hambre, Cáncer Infantil, Medio Ambiente, Alivio del Desastre, Apoyo a la Juventud, Causas Humanitarias, Otra
  otroTemaDescripcion?: string; // si escoge Otra
  tipo: 'Abierta' | 'Interna';
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  usuarioCreador?: string; // email o id del socio/admin o 'público'
  fechaCreacion: string;
}
