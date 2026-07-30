export interface AppModule {
  id: string;
  label: string;
  category: 'Principal' | 'Presidencia' | 'Secretaría' | 'Tesorería' | 'Comité de Afiliación' | 'Comité de Mercadeo' | 'Comité de Servicio' | 'Comité de Patrimonio' | 'Comité de Gestión';
  description?: string;
  defaultRoles?: string[];
}

export const ALL_APP_MODULES: AppModule[] = [
  // Principal
  { 
    id: 'resumen', 
    label: 'Resumen General', 
    category: 'Principal',
    description: 'Tablero general de métricas y resumen del club',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'TESORERO', 'PRESIDENTE_AFILIACION']
  },
  { 
    id: 'asignacion_funciones', 
    label: 'Control de Contraseñas y Funciones', 
    category: 'Principal',
    description: 'Gestión de credenciales, asignación de roles, puestos y visibilidad de módulos',
    defaultRoles: ['SUPER_ADMIN'] 
  },
  
  // Presidencia
  { 
    id: 'presidencia', 
    label: 'Gestión de Solicitudes (Presidencia)', 
    category: 'Presidencia',
    description: 'Revisión y aprobación de solicitudes institucionales',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'agendas_reunion', 
    label: 'Agendas de Reunión', 
    category: 'Presidencia',
    description: 'Creación y seguimiento de órdenes del día para asambleas',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'ranking_lionistico', 
    label: 'Ranking Lionístico', 
    category: 'Presidencia',
    description: 'Seguimiento del nivel de compromiso y puntuación de socios',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'convencion_admin', 
    label: 'Configuración Convención', 
    category: 'Presidencia',
    description: 'Gestión de inscripciones y parámetros de la Convención',
    defaultRoles: ['SUPER_ADMIN', 'PRESIDENTE_AFILIACION'] 
  },

  // Secretaría
  { 
    id: 'actas', 
    label: 'Libro de Actas', 
    category: 'Secretaría',
    description: 'Registro oficial y descarga en PDF de actas de asamblea',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'comisiones', 
    label: 'Gestión de Comisiones', 
    category: 'Secretaría',
    description: 'Administración e integrantes de comisiones de trabajo',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'archivo_solicitudes_secretaria', 
    label: 'Biblioteca de Solicitudes', 
    category: 'Secretaría',
    description: 'Repositorio histórico de cartas y expedientes recibidos',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO'] 
  },

  // Comité de Mercadeo
  { 
    id: 'calendario', 
    label: 'Actividades', 
    category: 'Comité de Mercadeo',
    description: 'Calendario y programación de eventos de servicio',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'ASESOR_SERVICIOS', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'beneficios', 
    label: 'Beneficios a Socios', 
    category: 'Comité de Mercadeo',
    description: 'Convenios, promociones y catálogo de beneficios',
    defaultRoles: ['SUPER_ADMIN', 'ASESOR_SERVICIOS', 'PRESIDENTE_AFILIACION'] 
  },

  // Tesorería
  { 
    id: 'cuotas', 
    label: 'Control de Cuotas', 
    category: 'Tesorería',
    description: 'Registro de aportaciones ordinarias, extraordinarias y estado financiero de socios',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'nevera_admin', 
    label: 'Control de Nevera / Bar', 
    category: 'Tesorería',
    description: 'Gestión de inventario de bebidas, consumo de socios y saldos',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO'] 
  },
  { 
    id: 'parqueo', 
    label: 'Gestión de Parqueo', 
    category: 'Tesorería',
    description: 'Control de parqueo interno y atenciones a visitantes',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'donaciones', 
    label: 'Donaciones Recibidas', 
    category: 'Tesorería',
    description: 'Historial de contribuciones financieras y diplomas',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'presupuestos', 
    label: 'Presupuestos', 
    category: 'Tesorería',
    description: 'Planes presupuestarios, rubros y fondos por comisión',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO', 'PRESIDENTE_AFILIACION'] 
  },

  // Comité de Afiliación
  { 
    id: 'socios', 
    label: 'Gestión de Socios', 
    category: 'Comité de Afiliación',
    description: 'Directorio completo y edición de fichas de socios',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'TESORERO', 'ASESOR_SERVICIOS', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'afiliacion', 
    label: 'Propuestas de Socios', 
    category: 'Comité de Afiliación',
    description: 'Postulaciones de nuevos miembros y consultas anónimas',
    defaultRoles: ['SUPER_ADMIN', 'PRESIDENTE_AFILIACION'] 
  },

  // Comité de Servicio
  { 
    id: 'minutas', 
    label: 'Minutas de Comisiones', 
    category: 'Comité de Servicio',
    description: 'Reportes de trabajo y acuerdos tomados en comisiones',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'ASESOR_SERVICIOS', 'PRESIDENTE_AFILIACION'] 
  },
  { 
    id: 'requerimientos_actividades', 
    label: 'Requerimientos de Actividad', 
    category: 'Comité de Servicio',
    description: 'Fichas de insumos, logística y asignaciones para eventos',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'ASESOR_SERVICIOS', 'PRESIDENTE_AFILIACION'] 
  },

  // Comité de Patrimonio
  { 
    id: 'inventario', 
    label: 'Inventario del Club', 
    category: 'Comité de Patrimonio',
    description: 'Registro de bienes muebles, equipamiento e inmuebles',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO'] 
  },
  { 
    id: 'galeria_admin', 
    label: 'Galería & Museo', 
    category: 'Comité de Patrimonio',
    description: 'Archivo fotográfico e historia ilustrada del club',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO'] 
  },
  { 
    id: 'linea_tiempo_admin', 
    label: 'Línea de Tiempo', 
    category: 'Comité de Patrimonio',
    description: 'Hitos históricos y eventos trascendentales',
    defaultRoles: ['SUPER_ADMIN', 'TESORERO'] 
  },

  // Comité de Gestión
  { 
    id: 'agenda_contactos', 
    label: 'Agenda de Contactos', 
    category: 'Comité de Gestión',
    description: 'Directorio institucional de aliados y contactos clave',
    defaultRoles: ['SUPER_ADMIN', 'SECRETARIO', 'PRESIDENTE_AFILIACION'] 
  }
];
