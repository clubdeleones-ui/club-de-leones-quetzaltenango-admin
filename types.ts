
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
}
