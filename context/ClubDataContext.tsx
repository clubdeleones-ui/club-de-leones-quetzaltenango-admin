import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Socio, 
  PropuestaSocio, 
  Solicitud, 
  Actividad, 
  SolicitudVoluntario, 
  Acta, 
  Comision, 
  MinutaComision, 
  ContactoAgenda, 
  GaleriaItem, 
  HitoHistorico,
  RubroPresupuesto,
  FondoPresupuesto,
  AsignacionComision,
  ReunionAgenda,
  TareaComision,
  Asistencia
} from '../types';
import { 
  MOCK_SOCIOS, 
  MOCK_PROPUESTAS, 
  MOCK_ACTIVIDADES, 
  MOCK_ACTAS, 
  MOCK_GALERIA 
} from '../constants';
import { firebaseService } from '../services/firebaseService';

export const DEFAULT_ROLES_CONFIG = [
  { id: 'SUPER_ADMIN', label: 'Super Administrador', allowedTabs: ['resumen', 'socios', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios', 'parqueo', 'presupuestos', 'comisiones', 'minutas', 'afiliacion', 'inventario', 'galeria_admin', 'linea_tiempo_admin', 'agenda_contactos', 'presidencia', 'agendas_reunion', 'ranking_lionistico', 'asignacion_funciones'] },
  { id: 'SECRETARIO', label: 'Secretario', allowedTabs: ['resumen', 'socios', 'calendario', 'actas', 'comisiones', 'minutas', 'agenda_contactos', 'presidencia', 'agendas_reunion', 'ranking_lionistico'] },
  { id: 'TESORERO', label: 'Tesorero', allowedTabs: ['resumen', 'socios', 'cuotas', 'donaciones', 'parqueo', 'presupuestos', 'inventario', 'galeria_admin', 'linea_tiempo_admin'] },
  { id: 'ASESOR_SERVICIOS', label: 'Asesor de Servicios', allowedTabs: ['socios', 'calendario', 'beneficios', 'minutas'] },
  { id: 'PRESIDENTE_AFILIACION', label: 'Presidente de Afiliación', allowedTabs: ['resumen', 'socios', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios', 'parqueo', 'presupuestos', 'comisiones', 'minutas', 'afiliacion', 'agenda_contactos', 'presidencia', 'agendas_reunion', 'ranking_lionistico'] },
  { id: 'SOCIO', label: 'Socio Regular', allowedTabs: [] },
  { id: 'DONANTE', label: 'Donante', allowedTabs: [] }
];

export const DEFAULT_PUESTOS = [
  { id: 'presidente', nombre: 'Presidente', rolAsociado: 'SUPER_ADMIN' },
  { id: 'primer-vicepresidente', nombre: 'Primer Vicepresidente', rolAsociado: 'SUPER_ADMIN' },
  { id: 'segundo-vicepresidente', nombre: 'Segundo Vicepresidente', rolAsociado: 'SUPER_ADMIN' },
  { id: 'secretario', nombre: 'Secretario', rolAsociado: 'SECRETARIO' },
  { id: 'tesorero', nombre: 'Tesorero', rolAsociado: 'TESORERO' },
  { id: 'asesor-de-servicio', nombre: 'Asesor de Servicio', rolAsociado: 'ASESOR_SERVICIOS' },
  { id: 'asesor-de-mercadotecnia', nombre: 'Asesor de Mercadotecnia', rolAsociado: 'ASESOR_SERVICIOS' },
  { id: 'presidente-de-afiliacion', nombre: 'Presidente de Afiliación', rolAsociado: 'PRESIDENTE_AFILIACION' },
  { id: 'vocal-1', nombre: 'Vocal 1', rolAsociado: 'SOCIO' },
  { id: 'vocal-2', nombre: 'Vocal 2', rolAsociado: 'SOCIO' },
  { id: 'socio-regular', nombre: 'Socio Regular', rolAsociado: 'SOCIO' },
  { id: 'club-leo', nombre: 'Club Leo', rolAsociado: 'SOCIO' },
  { id: 'donante', nombre: 'Donante', rolAsociado: 'DONANTE' },
  { id: 'administrador-principal', nombre: 'Administrador Principal', rolAsociado: 'SUPER_ADMIN' }
];

// Unified Cache Keys
const KEYS = {
  SOCIOS: 'club_leones_socios',
  PROPUESTAS: 'club_leones_propuestas',
  SOLICITUDES: 'club_leones_solicitudes',
  ACTIVIDADES: 'club_leones_actividades',
  VOLUNTARIOS: 'club_leones_voluntarios',
  ACTAS: 'club_leones_actas',
  COMISIONES: 'club_leones_comisiones',
  MINUTAS: 'club_leones_minutas',
  AGENDA: 'club_leones_agenda',
  GALERIA: 'club_leones_galeria',
  HITOS: 'club_leones_linea_tiempo',
  RUBROS: 'club_leones_presupuestos_rubros',
  FONDOS: 'club_leones_presupuestos_fondos',
  ASIGNACIONES: 'club_leones_presupuestos_asignaciones',
  REUNION_AGENDAS: 'club_leones_reunion_agendas',
  TAREAS_COMISIONES: 'club_leones_tareas_comisiones',
  ASISTENCIAS: 'club_leones_asistencias',
};

// Local storage helper
function getLocalData<T>(key: string, fallback: T): T {
  try {
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : fallback;
  } catch (e) {
    console.error(`Error loading local cache for ${key}:`, e);
    return fallback;
  }
}

interface ClubDataContextType {
  socios: Socio[];
  propuestas: PropuestaSocio[];
  solicitudes: Solicitud[];
  actividades: Actividad[];
  voluntarios: SolicitudVoluntario[];
  actas: Acta[];
  comisiones: Comision[];
  minutas: MinutaComision[];
  agenda: ContactoAgenda[];
  galeria: GaleriaItem[];
  hitos: HitoHistorico[];
  rubros: RubroPresupuesto[];
  fondos: FondoPresupuesto[];
  asignaciones: AsignacionComision[];
  agendas: ReunionAgenda[];
  tareasComisiones: TareaComision[];
  asistencias: Asistencia[];
  
  rolesConfig: any[];
  puestosList: any[];
  saveRoleConfig: (roleId: string, label: string, allowedTabs: string[]) => Promise<void>;
  deleteRoleConfig: (roleId: string) => Promise<void>;
  savePuesto: (puestoId: string, nombre: string, rolAsociado: string) => Promise<void>;
  deletePuesto: (puestoId: string) => Promise<void>;

  loading: {
    socios: boolean;
    propuestas: boolean;
    solicitudes: boolean;
    actividades: boolean;
    voluntarios: boolean;
    actas: boolean;
    comisiones: boolean;
    minutas: boolean;
    agenda: boolean;
    galeria: boolean;
    hitos: boolean;
    rubros: boolean;
    fondos: boolean;
    asignaciones: boolean;
    agendas: boolean;
    tareasComisiones: boolean;
    asistencias: boolean;
  };
}

const ClubDataContext = createContext<ClubDataContextType | undefined>(undefined);

export const ClubDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize state from LocalStorage or constant fallbacks (for offline/instant load)
  const [socios, setSocios] = useState<Socio[]>(() => getLocalData(KEYS.SOCIOS, MOCK_SOCIOS));
  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(() => getLocalData(KEYS.PROPUESTAS, MOCK_PROPUESTAS));
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() => getLocalData(KEYS.SOLICITUDES, []));
  const [actividades, setActividades] = useState<Actividad[]>(() => getLocalData(KEYS.ACTIVIDADES, MOCK_ACTIVIDADES));
  const [voluntarios, setVoluntarios] = useState<SolicitudVoluntario[]>(() => getLocalData(KEYS.VOLUNTARIOS, []));
  const [actas, setActas] = useState<Acta[]>(() => getLocalData(KEYS.ACTAS, MOCK_ACTAS));
  const [comisiones, setComisiones] = useState<Comision[]>(() => getLocalData(KEYS.COMISIONES, []));
  const [minutas, setMinutas] = useState<MinutaComision[]>(() => getLocalData(KEYS.MINUTAS, []));
  const [agenda, setAgenda] = useState<ContactoAgenda[]>(() => getLocalData(KEYS.AGENDA, []));
  const [galeria, setGaleria] = useState<GaleriaItem[]>(() => getLocalData(KEYS.GALERIA, MOCK_GALERIA));
  const [hitos, setHitos] = useState<HitoHistorico[]>(() => getLocalData(KEYS.HITOS, []));
  const [rubros, setRubros] = useState<RubroPresupuesto[]>(() => getLocalData(KEYS.RUBROS, []));
  const [fondos, setFondos] = useState<FondoPresupuesto[]>(() => getLocalData(KEYS.FONDOS, []));
  const [asignaciones, setAsignaciones] = useState<AsignacionComision[]>(() => getLocalData(KEYS.ASIGNACIONES, []));
  const [agendas, setAgendas] = useState<ReunionAgenda[]>(() => getLocalData(KEYS.REUNION_AGENDAS, []));
  const [tareasComisiones, setTareasComisiones] = useState<TareaComision[]>(() => getLocalData(KEYS.TAREAS_COMISIONES, []));
  const [asistencias, setAsistencias] = useState<Asistencia[]>(() => getLocalData(KEYS.ASISTENCIAS, []));
  const [rolesConfig, setRolesConfig] = useState<any[]>(() => getLocalData('club_leones_roles_config', DEFAULT_ROLES_CONFIG));
  const [puestosList, setPuestosList] = useState<any[]>(() => getLocalData('club_leones_puestos_list', DEFAULT_PUESTOS));

  const [loading, setLoading] = useState({
    socios: true,
    propuestas: true,
    solicitudes: true,
    actividades: true,
    voluntarios: true,
    actas: true,
    comisiones: true,
    minutas: true,
    agenda: true,
    galeria: true,
    hitos: true,
    rubros: true,
    fondos: true,
    asignaciones: true,
    agendas: true,
    tareasComisiones: true,
    asistencias: true,
  });

  // 2. Sync mock data to Firestore once if collection is empty
  useEffect(() => {
    // Clean up old fragmented keys to free up space
    const oldKeys = ['club_leones_socios_v3', 'club_leones_socios_v4'];
    oldKeys.forEach(k => localStorage.removeItem(k));

    const performInitialSync = async () => {
      try {
        await firebaseService.syncInitialSocios(MOCK_SOCIOS);
        await firebaseService.syncInitialActividades(MOCK_ACTIVIDADES);
        await firebaseService.syncInitialGaleria(MOCK_GALERIA);
        await firebaseService.syncInitialActas(MOCK_ACTAS);
      } catch (err) {
        console.error("Error performing initial mock data sync:", err);
      }
    };
    performInitialSync();
  }, []);

  // 3. Set up root-level onSnapshot subscriptions
  useEffect(() => {
    // 3a. Socios
    const unsubSocios = onSnapshot(collection(db, 'socios'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Socio);
      setSocios(list);
      localStorage.setItem(KEYS.SOCIOS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, socios: false }));
    }, (err) => {
      console.error("Error subscribing to socios:", err);
      setLoading(prev => ({ ...prev, socios: false }));
    });

    // 3b. Propuestas
    const unsubPropuestas = onSnapshot(collection(db, 'propuestas'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PropuestaSocio);
      setPropuestas(list);
      localStorage.setItem(KEYS.PROPUESTAS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, propuestas: false }));
    }, (err) => {
      console.error("Error subscribing to propuestas:", err);
      setLoading(prev => ({ ...prev, propuestas: false }));
    });

    // 3c. Solicitudes
    const unsubSolicitudes = onSnapshot(collection(db, 'solicitudes'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Solicitud);
      setSolicitudes(list);
      localStorage.setItem(KEYS.SOLICITUDES, JSON.stringify(list));
      setLoading(prev => ({ ...prev, solicitudes: false }));
    }, (err) => {
      console.error("Error subscribing to solicitudes:", err);
      setLoading(prev => ({ ...prev, solicitudes: false }));
    });

    // 3d. Actividades (ordered by date ascending)
    const unsubActividades = onSnapshot(collection(db, 'actividades'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Actividad)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      setActividades(list);
      localStorage.setItem(KEYS.ACTIVIDADES, JSON.stringify(list));
      setLoading(prev => ({ ...prev, actividades: false }));
    }, (err) => {
      console.error("Error subscribing to actividades:", err);
      setLoading(prev => ({ ...prev, actividades: false }));
    });

    // 3e. Solicitudes de Voluntarios (ordered by date descending)
    const unsubVoluntarios = onSnapshot(collection(db, 'solicitudes_voluntarios'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SolicitudVoluntario)
        .sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());
      setVoluntarios(list);
      localStorage.setItem(KEYS.VOLUNTARIOS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, voluntarios: false }));
    }, (err) => {
      console.error("Error subscribing to voluntarios:", err);
      setLoading(prev => ({ ...prev, voluntarios: false }));
    });

    // 3f. Actas (ordered by date descending)
    const unsubActas = onSnapshot(collection(db, 'actas'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Acta)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
      setActas(list);
      localStorage.setItem(KEYS.ACTAS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, actas: false }));
    }, (err) => {
      console.error("Error subscribing to actas:", err);
      setLoading(prev => ({ ...prev, actas: false }));
    });

    // 3g. Comisiones
    const qComisiones = query(collection(db, 'comisiones'));
    const unsubComisiones = onSnapshot(qComisiones, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Comision);
      setComisiones(list);
      localStorage.setItem(KEYS.COMISIONES, JSON.stringify(list));
      setLoading(prev => ({ ...prev, comisiones: false }));
    }, (err) => {
      console.error("Error subscribing to comisiones:", err);
      setLoading(prev => ({ ...prev, comisiones: false }));
    });

    // 3h. Minutas
    const qMinutas = query(collection(db, 'minutas'));
    const unsubMinutas = onSnapshot(qMinutas, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MinutaComision);
      setMinutas(list);
      localStorage.setItem(KEYS.MINUTAS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, minutas: false }));
    }, (err) => {
      console.error("Error subscribing to minutas:", err);
      setLoading(prev => ({ ...prev, minutas: false }));
    });

    // 3i. Agenda de Contactos
    const unsubAgenda = onSnapshot(collection(db, 'agenda'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ContactoAgenda)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setAgenda(list);
      localStorage.setItem(KEYS.AGENDA, JSON.stringify(list));
      setLoading(prev => ({ ...prev, agenda: false }));
    }, (err) => {
      console.error("Error subscribing to agenda:", err);
      setLoading(prev => ({ ...prev, agenda: false }));
    });

    // 3j. Galeria Items
    const unsubGaleria = onSnapshot(collection(db, 'galeria'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GaleriaItem)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setGaleria(list);
      localStorage.setItem(KEYS.GALERIA, JSON.stringify(list));
      setLoading(prev => ({ ...prev, galeria: false }));
    }, (err) => {
      console.error("Error subscribing to galeria:", err);
      setLoading(prev => ({ ...prev, galeria: false }));
    });

    // 3k. Línea de Tiempo / Hitos
    const unsubHitos = onSnapshot(collection(db, 'linea_tiempo'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as HitoHistorico);
      setHitos(list);
      localStorage.setItem(KEYS.HITOS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, hitos: false }));
    }, (err) => {
      console.error("Error subscribing to linea_tiempo:", err);
      setLoading(prev => ({ ...prev, hitos: false }));
    });

    // 3l. Presupuestos Rubros
    const unsubRubros = onSnapshot(collection(db, 'presupuestos_rubros'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RubroPresupuesto);
      setRubros(list);
      localStorage.setItem(KEYS.RUBROS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, rubros: false }));
    }, (err) => {
      console.error("Error subscribing to presupuestos_rubros:", err);
      setLoading(prev => ({ ...prev, rubros: false }));
    });

    // 3m. Presupuestos Fondos
    const unsubFondos = onSnapshot(collection(db, 'presupuestos_fondos'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FondoPresupuesto);
      setFondos(list);
      localStorage.setItem(KEYS.FONDOS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, fondos: false }));
    }, (err) => {
      console.error("Error subscribing to presupuestos_fondos:", err);
      setLoading(prev => ({ ...prev, fondos: false }));
    });

    // 3n. Presupuestos Asignaciones
    const unsubAsignaciones = onSnapshot(collection(db, 'presupuestos_asignaciones'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AsignacionComision);
      setAsignaciones(list);
      localStorage.setItem(KEYS.ASIGNACIONES, JSON.stringify(list));
      setLoading(prev => ({ ...prev, asignaciones: false }));
    }, (err) => {
      console.error("Error subscribing to presupuestos_asignaciones:", err);
      setLoading(prev => ({ ...prev, asignaciones: false }));
    });

    // 3o. Reunion Agendas
    const unsubAgendas = onSnapshot(collection(db, 'agendas'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ReunionAgenda);
      setAgendas(list);
      localStorage.setItem(KEYS.REUNION_AGENDAS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, agendas: false }));
    }, (err) => {
      console.error("Error subscribing to agendas:", err);
      setLoading(prev => ({ ...prev, agendas: false }));
    });

    // 3p. Tareas Comisiones
    const unsubTareasComisiones = onSnapshot(collection(db, 'tareas_comisiones'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TareaComision);
      setTareasComisiones(list);
      localStorage.setItem(KEYS.TAREAS_COMISIONES, JSON.stringify(list));
      setLoading(prev => ({ ...prev, tareasComisiones: false }));
    }, (err) => {
      console.error("Error subscribing to tareas_comisiones:", err);
      setLoading(prev => ({ ...prev, tareasComisiones: false }));
    });

    // 3q. Asistencias
    const unsubAsistencias = onSnapshot(collection(db, 'asistencias'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Asistencia);
      setAsistencias(list);
      localStorage.setItem(KEYS.ASISTENCIAS, JSON.stringify(list));
      setLoading(prev => ({ ...prev, asistencias: false }));
    }, (err) => {
      console.error("Error subscribing to asistencias:", err);
      setLoading(prev => ({ ...prev, asistencias: false }));
    });

    const unsubRoles = onSnapshot(collection(db, 'config_roles'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        DEFAULT_ROLES_CONFIG.forEach(async (role) => {
          await setDoc(doc(db, 'config_roles', role.id), { label: role.label, allowedTabs: role.allowedTabs });
        });
      } else {
        setRolesConfig(list);
        localStorage.setItem('club_leones_roles_config', JSON.stringify(list));
      }
    }, (err) => {
      console.error("Error subscribing to config_roles:", err);
    });

    const unsubPuestos = onSnapshot(collection(db, 'config_puestos'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        DEFAULT_PUESTOS.forEach(async (puesto) => {
          await setDoc(doc(db, 'config_puestos', puesto.id), { nombre: puesto.nombre, rolAsociado: puesto.rolAsociado });
        });
      } else {
        setPuestosList(list);
        localStorage.setItem('club_leones_puestos_list', JSON.stringify(list));
      }
    }, (err) => {
      console.error("Error subscribing to config_puestos:", err);
    });

    return () => {
      unsubSocios();
      unsubPropuestas();
      unsubSolicitudes();
      unsubActividades();
      unsubVoluntarios();
      unsubActas();
      unsubComisiones();
      unsubMinutas();
      unsubAgenda();
      unsubGaleria();
      unsubHitos();
      unsubRubros();
      unsubFondos();
      unsubAsignaciones();
      unsubAgendas();
      unsubTareasComisiones();
      unsubAsistencias();
      unsubRoles();
      unsubPuestos();
    };
  }, []);

  const saveRoleConfig = async (roleId: string, label: string, allowedTabs: string[]) => {
    const docRef = doc(db, 'config_roles', roleId);
    await setDoc(docRef, { label, allowedTabs });
  };

  const deleteRoleConfig = async (roleId: string) => {
    const docRef = doc(db, 'config_roles', roleId);
    await deleteDoc(docRef);
  };

  const savePuesto = async (puestoId: string, nombre: string, rolAsociado: string) => {
    const docRef = doc(db, 'config_puestos', puestoId);
    await setDoc(docRef, { nombre, rolAsociado });
  };

  const deletePuesto = async (puestoId: string) => {
    const docRef = doc(db, 'config_puestos', puestoId);
    await deleteDoc(docRef);
  };

  return (
    <ClubDataContext.Provider value={{
      socios,
      propuestas,
      solicitudes,
      actividades,
      voluntarios,
      actas,
      comisiones,
      minutas,
      agenda,
      galeria,
      hitos,
      rubros,
      fondos,
      asignaciones,
      agendas,
      tareasComisiones,
      asistencias,
      rolesConfig,
      puestosList,
      saveRoleConfig,
      deleteRoleConfig,
      savePuesto,
      deletePuesto,
      loading
    }}>
      {children}
    </ClubDataContext.Provider>
  );
};

export const useClubData = () => {
  const context = useContext(ClubDataContext);
  if (context === undefined) {
    throw new Error('useClubData must be used within a ClubDataProvider');
  }
  return context;
};
