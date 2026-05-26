
import { Socio, UserRole, Acta, Actividad, GaleriaItem, Donacion, Beneficio } from './types';

export const MOCK_SOCIOS: Socio[] = [
  {
    id: '1',
    nombre: 'Ricardo Méndez',
    correo: 'ricardo@leonesxela.com',
    rol: UserRole.SOCIO,
    puesto: 'Presidente',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/socio1/200/200',
    fechaIngreso: '2015-06-12'
  },
  {
    id: '2',
    nombre: 'Elena Castillo',
    correo: 'elena@leonesxela.com',
    rol: UserRole.SECRETARIO,
    puesto: 'Secretaria',
    estadoCuotas: 'Pendiente',
    montoPendiente: 150,
    foto: 'https://picsum.photos/seed/socio2/200/200',
    fechaIngreso: '2018-09-20'
  },
  {
    id: '3',
    nombre: 'Juan Carlos Pérez',
    correo: 'admin@leonesxela.com',
    rol: UserRole.TESORERO,
    puesto: 'Tesorero',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/socio3/200/200',
    fechaIngreso: '2010-01-15'
  },
  {
    id: '4',
    nombre: 'Club de Leones Quetzaltenango',
    correo: 'clubdeleonesquetzaltenango@gmail.com',
    rol: UserRole.SUPER_ADMIN,
    puesto: 'Administrador Principal',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/adminmain/200/200',
    fechaIngreso: '2026-01-01'
  },
  {
    id: '5',
    nombre: 'Carlos Gómez',
    correo: 'carlos@leonesxela.com',
    rol: UserRole.ASESOR_SERVICIOS,
    puesto: 'Asesor de Servicios',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/socio5/200/200',
    fechaIngreso: '2020-11-05'
  },
  {
    id: '6',
    nombre: 'Sofía Ramos',
    correo: 'donante@leonesxela.com',
    rol: UserRole.DONANTE,
    puesto: 'Donante Distinguido',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/donante1/200/200',
    fechaIngreso: '2025-02-14'
  },
  {
    id: '7',
    nombre: 'Mariela López',
    correo: 'mariela@leonesxela.com',
    rol: UserRole.PRESIDENTE_AFILIACION,
    puesto: 'Presidente de Afiliación',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/socio6/200/200',
    fechaIngreso: '2019-05-10'
  }
];

export const MOCK_ACTAS: Acta[] = [
  {
    id: 'acta-2023-01',
    titulo: 'Asamblea Ordinaria Enero 2024',
    fecha: '2024-01-15',
    contenido: 'Se discutieron los planes para el bingo benéfico de marzo. El tesorero presentó el informe de gastos del año 2023. Se aprobó la remodelación del salón principal del club.',
    autor: 'Elena Castillo',
    pdfUrl: '#'
  },
  {
    id: 'acta-2023-02',
    titulo: 'Reunión de Junta Directiva Febrero 2024',
    fecha: '2024-02-10',
    contenido: 'Coordinación de la jornada médica en el valle de Palajunoj. Se asignaron presupuestos para medicamentos y logística. Nuevos socios propuestos para entrevista.',
    autor: 'Elena Castillo',
    pdfUrl: '#'
  }
];

export const MOCK_ACTIVIDADES: Actividad[] = [
  {
    id: 'ev-1',
    titulo: 'Gran Bingo Benéfico',
    descripcion: 'Evento para recaudar fondos para la escuela local.',
    fecha: '2024-04-15 15:00',
    lugar: 'Sede Central Club de Leones',
    imagen: 'https://picsum.photos/seed/bingo/600/400',
    publica: true
  },
  {
    id: 'ev-2',
    titulo: 'Jornada Oftalmológica',
    descripcion: 'Exámenes de la vista gratuitos para la comunidad.',
    fecha: '2024-05-20 08:00',
    lugar: 'Parque Central Quetzaltenango',
    imagen: 'https://picsum.photos/seed/eye/600/400',
    publica: true
  }
];

export const MOCK_GALERIA: GaleriaItem[] = [
  {
    id: 'g1',
    titulo: 'Inauguración del Club 1945',
    fecha: '1945-10-25',
    url: 'https://picsum.photos/seed/hist1/800/600',
    descripcion: 'Miembros fundadores frente a la primera sede.'
  },
  {
    id: 'g2',
    titulo: 'Cena de Gala 1970',
    fecha: '1970-12-15',
    url: 'https://picsum.photos/seed/hist2/800/600',
    descripcion: 'Celebración del 25 aniversario.'
  }
];

export const CLUB_STATUTES = `
# ESTATUTOS DEL CLUB DE LEONES DE QUETZALTENANGO

## ARTÍCULO I: NOMBRE Y OBJETIVOS
El nombre de esta organización será Club de Leones de Quetzaltenango. Sus objetivos son:
- Crear y fomentar un espíritu de comprensión entre los pueblos del mundo.
- Promover los principios de buen gobierno y de buena ciudadanía.

## ARTÍCULO II: MEMBRESÍA
La membresía en este club se limitará a personas de buen carácter moral y buena reputación en la comunidad.

## ARTÍCULO III: CUOTAS
Las cuotas mensuales serán fijadas por la Junta Directiva y deberán cancelarse en los primeros 10 días de cada mes.
`;

export const MOCK_DONACIONES: Donacion[] = [
  {
    id: 'don-1',
    donante: 'Supermercados La Torre',
    monto: 5000,
    fecha: '2024-03-12',
    proyecto: 'Jornada Oftalmológica',
    tipo: 'Empresarial'
  },
  {
    id: 'don-2',
    donante: 'Familia Maldonado Fuentes',
    monto: 1200,
    fecha: '2024-04-05',
    proyecto: 'Remodelación de la Cueva',
    tipo: 'Individual'
  },
  {
    id: 'don-3',
    donante: 'Fundación Rotaria Xela',
    monto: 8000,
    fecha: '2024-04-20',
    proyecto: 'Jornada Médica Palajunoj',
    tipo: 'Empresarial'
  },
  {
    id: 'don-4',
    donante: 'Sofía Ramos',
    monto: 3500,
    fecha: '2025-03-15',
    proyecto: 'Jornada Médica Palajunoj',
    tipo: 'Individual'
  },
  {
    id: 'don-5',
    donante: 'Sofía Ramos',
    monto: 1500,
    fecha: '2025-05-10',
    proyecto: 'Bingo Benéfico',
    tipo: 'Individual'
  }
];

export const MOCK_BENEFICIOS: Beneficio[] = [
  {
    id: 'ben-1',
    titulo: 'Descuento en Óptica Santa Lucía',
    descripcion: '25% de descuento en aros y exámenes de la vista especializados para socios y familiares directos.',
    convenioCon: 'Óptica Santa Lucía Xela',
    descuento: '25%',
    categoria: 'Salud'
  },
  {
    id: 'ben-2',
    titulo: 'Tarifa Corporativa en Gimnasio Flex',
    descripcion: 'Acceso ilimitado a todas las áreas de musculación y clases grupales con mensualidad reducida.',
    convenioCon: 'Gimnasio Flex',
    descuento: 'Q150/mes (reg. Q250)',
    categoria: 'Recreación'
  },
  {
    id: 'ben-3',
    titulo: 'Descuento en Farmacias de la Comunidad',
    descripcion: '10% de descuento en medicamentos éticos y 5% en material de curación al presentar carnet de socio.',
    convenioCon: 'Farmacias La Comunidad',
    descuento: '10%',
    categoria: 'Salud'
  }
];
