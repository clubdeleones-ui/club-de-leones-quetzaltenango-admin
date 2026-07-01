import { db, storage } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  limit,
  writeBatch
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { VehiculoParqueo, Socio, PropuestaSocio, Solicitud, Actividad, RubroPresupuesto, FondoPresupuesto, AsignacionComision, Comision, MinutaComision, GaleriaItem, ContactoAgenda, Acta, HitoHistorico, SolicitudVoluntario, ReunionAgenda, TareaComision, Asistencia, BienInventario, CategoriaInventario, ConvencionConfig, ConvencionRegistro } from "../types";

export const firebaseService = {
  // Upload candidate photo to Firebase Storage (Supports Base64 data_url format)
  uploadCandidatePhoto: async (base64Data: string, candidateId: string): Promise<string> => {
    try {
      // Si la imagen ya es una URL o no es base64, se devuelve tal cual
      if (!base64Data.startsWith('data:image')) {
        return base64Data;
      }
      
      const uniqueName = `${candidateId}_${Date.now()}`;
      const storageRef = ref(storage, `candidatos/${uniqueName}`);
      
      await uploadString(storageRef, base64Data, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error al subir foto a Firebase Storage:", error);
      // Fallback a base64 si hay error (ej. reglas de Storage no configuradas)
      return base64Data;
    }
  },

  // Save a new proposal to Firestore
  saveProposal: async (proposal: PropuestaSocio): Promise<void> => {
    try {
      const docRef = doc(db, "propuestas", proposal.id);
      const cleanData = JSON.parse(JSON.stringify(proposal));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving proposal in Firestore:", error);
      throw error;
    }
  },

  // Fetch proposals from Firestore
  getProposals: async (): Promise<PropuestaSocio[]> => {
    try {
      const colRef = collection(db, "propuestas");
      const snapshot = await getDocs(colRef);
      const list: PropuestaSocio[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as PropuestaSocio);
      });
      return list;
    } catch (error) {
      console.error("Error fetching proposals from Firestore:", error);
      throw error;
    }
  },

  // Fetch a single proposal by ID
  getProposalById: async (proposalId: string): Promise<PropuestaSocio | null> => {
    try {
      const docRef = doc(db, "propuestas", proposalId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as PropuestaSocio;
      }
      return null;
    } catch (error) {
      console.error("Error fetching proposal by ID from Firestore:", error);
      throw error;
    }
  },

  // Update proposal status
  updateProposalStatus: async (proposalId: string, estado: "Pendiente" | "Aprobado" | "Rechazado"): Promise<void> => {
    try {
      const docRef = doc(db, "propuestas", proposalId);
      await updateDoc(docRef, { estado });
    } catch (error) {
      console.error("Error updating proposal status in Firestore:", error);
      throw error;
    }
  },

  // Update full proposal data
  updateProposal: async (proposalId: string, updatedData: Partial<PropuestaSocio>): Promise<void> => {
    try {
      const docRef = doc(db, "propuestas", proposalId);
      const cleanData = JSON.parse(JSON.stringify(updatedData));
      await updateDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error updating proposal in Firestore:", error);
      throw error;
    }
  },

  // Delete proposal
  deleteProposal: async (proposalId: string): Promise<void> => {
    try {
      const docRef = doc(db, "propuestas", proposalId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting proposal from Firestore:", error);
      throw error;
    }
  },

  // Fetch a single active member (socio) from Firestore by ID or Email
  getSocioByIdOrEmail: async (id?: string, correo?: string): Promise<Socio | null> => {
    try {
      if (id) {
        const docRef = doc(db, "socios", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Socio;
        }
      }
      
      if (correo) {
        const q = query(
          collection(db, "socios"), 
          where("correo", "==", correo),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return querySnapshot.docs[0].data() as Socio;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching socio from Firestore:", error);
      throw error;
    }
  },

  // Fetch active members (socios) from Firestore
  getSocios: async (): Promise<Socio[]> => {
    try {
      const colRef = collection(db, "socios");
      const snapshot = await getDocs(colRef);
      const list: Socio[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Socio);
      });
      return list;
    } catch (error) {
      console.error("Error fetching socios from Firestore:", error);
      throw error;
    }
  },

  // Save or update an active member in Firestore
  saveSocio: async (socio: Socio): Promise<void> => {
    try {
      const docRef = doc(db, "socios", socio.id);
      const cleanData = JSON.parse(JSON.stringify(socio));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving socio in Firestore:", error);
      throw error;
    }
  },

  // Synchronize initial mock members to Firestore by ID if they do not exist
  syncInitialSocios: async (initialSocios: Socio[]): Promise<void> => {
    try {
      const colRef = collection(db, "socios");
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        let syncedCount = 0;
        for (const socio of initialSocios) {
          await setDoc(doc(db, "socios", socio.id), socio);
          syncedCount++;
        }
        if (syncedCount > 0) {
          console.log(`Sincronizados ${syncedCount} socios iniciales en Firestore.`);
        }
      }
    } catch (error) {
      console.error("Error syncing initial socios to Firestore:", error);
    }
  },

  // Delete an active member from Firestore
  deleteSocio: async (socioId: string): Promise<void> => {
    try {
      const docRef = doc(db, "socios", socioId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting socio from Firestore:", error);
      throw error;
    }
  },

  // Save a new request (solicitud)
  saveSolicitud: async (solicitud: Solicitud): Promise<void> => {
    try {
      const docRef = doc(db, "solicitudes", solicitud.id);
      const cleanData = JSON.parse(JSON.stringify(solicitud));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving solicitud in Firestore:", error);
      throw error;
    }
  },

  // Fetch requests (solicitudes)
  getSolicitudes: async (): Promise<Solicitud[]> => {
    try {
      const colRef = collection(db, "solicitudes");
      const snapshot = await getDocs(colRef);
      const list: Solicitud[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Solicitud);
      });
      return list;
    } catch (error) {
      console.error("Error fetching solicitudes from Firestore:", error);
      throw error;
    }
  },

  // Delete a request (solicitud)
  deleteSolicitud: async (solicitudId: string): Promise<void> => {
    try {
      const docRef = doc(db, "solicitudes", solicitudId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting solicitud from Firestore:", error);
      throw error;
    }
  },

  // Fetch activities (actividades) from Firestore
  getActividades: async (): Promise<Actividad[]> => {
    try {
      const colRef = collection(db, "actividades");
      const snapshot = await getDocs(colRef);
      const list: Actividad[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Actividad);
      });
      return list;
    } catch (error) {
      console.error("Error fetching actividades from Firestore:", error);
      throw error;
    }
  },

  // Save or update an activity in Firestore
  saveActividad: async (actividad: Actividad): Promise<void> => {
    try {
      const docRef = doc(db, "actividades", actividad.id);
      const cleanData = JSON.parse(JSON.stringify(actividad));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving actividad in Firestore:", error);
      throw error;
    }
  },

  // Delete an activity from Firestore
  deleteActividad: async (actividadId: string): Promise<void> => {
    try {
      const docRef = doc(db, "actividades", actividadId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting actividad from Firestore:", error);
      throw error;
    }
  },

  // Sync initial activities to Firestore
  syncInitialActividades: async (initialActividades: Actividad[]): Promise<void> => {
    try {
      const colRef = collection(db, "actividades");
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        let syncedCount = 0;
        for (const act of initialActividades) {
          await setDoc(doc(db, "actividades", act.id), act);
          syncedCount++;
        }
        if (syncedCount > 0) {
          console.log(`Sincronizadas ${syncedCount} actividades iniciales en Firestore.`);
        }
      }
    } catch (error) {
      console.error("Error syncing initial actividades to Firestore:", error);
    }
  },

  // PARQUEO (ESTACIONAMIENTO) METHODS
  
  // Fetch all vehicles
  getVehiculosParqueo: async (): Promise<VehiculoParqueo[]> => {
    try {
      const colRef = collection(db, "parqueo");
      const snapshot = await getDocs(colRef);
      const list: VehiculoParqueo[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as VehiculoParqueo);
      });
      // Sort descending by horaEntrada
      return list.sort((a, b) => new Date(b.horaEntrada).getTime() - new Date(a.horaEntrada).getTime());
    } catch (error) {
      console.error("Error fetching vehiculos from Firestore:", error);
      throw error;
    }
  },

  // Save or update a vehicle ticket
  saveVehiculoParqueo: async (vehiculo: VehiculoParqueo): Promise<void> => {
    try {
      const docRef = doc(db, "parqueo", vehiculo.id);
      const cleanData = JSON.parse(JSON.stringify(vehiculo));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving vehiculo in Firestore:", error);
      throw error;
    }
  },

  // Delete a vehicle ticket (permanently from history)
  deleteVehiculoParqueo: async (vehiculoId: string): Promise<void> => {
    try {
      const docRef = doc(db, "parqueo", vehiculoId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting vehiculo from Firestore:", error);
      throw error;
    }
  },

  // ================= PRESUPUESTOS =================

  saveRubroPresupuesto: async (rubro: RubroPresupuesto): Promise<void> => {
    try {
      const docRef = doc(db, "presupuestos_rubros", rubro.id);
      await setDoc(docRef, rubro);
    } catch (error) {
      console.error("Error saving rubro:", error);
      throw error;
    }
  },

  deleteRubroPresupuesto: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "presupuestos_rubros", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting rubro:", error);
      throw error;
    }
  },

  saveFondoPresupuesto: async (fondo: FondoPresupuesto): Promise<void> => {
    try {
      const docRef = doc(db, "presupuestos_fondos", fondo.id);
      await setDoc(docRef, fondo);
    } catch (error) {
      console.error("Error saving fondo:", error);
      throw error;
    }
  },

  deleteFondoPresupuesto: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "presupuestos_fondos", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting fondo:", error);
      throw error;
    }
  },

  saveAsignacionComision: async (asignacion: AsignacionComision): Promise<void> => {
    try {
      const docRef = doc(db, "presupuestos_asignaciones", asignacion.id);
      await setDoc(docRef, asignacion);
    } catch (error) {
      console.error("Error saving asignacion:", error);
      throw error;
    }
  },

  deleteAsignacionComision: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "presupuestos_asignaciones", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting asignacion:", error);
      throw error;
    }
  },

  // COMISIONES
  getComisiones: async (): Promise<Comision[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "comisiones"));
      const comisiones: Comision[] = [];
      querySnapshot.forEach((doc) => {
        comisiones.push({ id: doc.id, ...doc.data() } as Comision);
      });
      return comisiones;
    } catch (error) {
      console.error("Error getting comisiones:", error);
      return [];
    }
  },

  saveComision: async (comision: Comision): Promise<void> => {
    try {
      const { id, ...data } = comision;
      if (id) {
        const docRef = doc(db, "comisiones", id);
        await setDoc(docRef, data, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "comisiones"));
        await setDoc(newDocRef, data);
      }
    } catch (error) {
      console.error("Error saving comision:", error);
      throw error;
    }
  },

  deleteComision: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "comisiones", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting comision:", error);
      throw error;
    }
  },

  getMinutas: async (): Promise<MinutaComision[]> => {
    try {
      const colRef = collection(db, "minutas");
      const snapshot = await getDocs(colRef);
      const list: MinutaComision[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as MinutaComision);
      });
      return list;
    } catch (error) {
      console.error("Error fetching minutas:", error);
      throw error;
    }
  },

  saveMinuta: async (minuta: MinutaComision): Promise<void> => {
    try {
      const { id, ...data } = minuta;
      if (id) {
        const docRef = doc(db, "minutas", id);
        await setDoc(docRef, data, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "minutas"));
        await setDoc(newDocRef, data);
      }
    } catch (error) {
      console.error("Error saving minuta:", error);
      throw error;
    }
  },

  deleteMinuta: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "minutas", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting minuta:", error);
      throw error;
    }
  },

  // ================= AGENDA DE CONTACTOS =================
  getAgendaContactos: async (): Promise<ContactoAgenda[]> => {
    try {
      const colRef = collection(db, "agenda");
      const snapshot = await getDocs(colRef);
      const list: ContactoAgenda[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ContactoAgenda);
      });
      // Sort alphabetically by nombre
      return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
      console.error("Error fetching agenda:", error);
      throw error;
    }
  },

  saveAgendaContacto: async (contacto: ContactoAgenda): Promise<void> => {
    try {
      const { id, ...data } = contacto;
      if (id) {
        const docRef = doc(db, "agenda", id);
        await setDoc(docRef, data, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "agenda"));
        await setDoc(newDocRef, data);
      }
    } catch (error) {
      console.error("Error saving contacto:", error);
      throw error;
    }
  },

  deleteAgendaContacto: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "agenda", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting contacto:", error);
      throw error;
    }
  },

  // ================= GALERIA =================
  uploadGaleriaImage: async (base64Data: string, filePrefix: string): Promise<string> => {
    try {
      if (!base64Data.startsWith('data:image')) {
        return base64Data;
      }
      const uniqueName = `${filePrefix}_${Date.now()}`;
      const storageRef = ref(storage, `galeria/${uniqueName}`);
      await uploadString(storageRef, base64Data, 'data_url');
      return await getDownloadURL(storageRef);
    } catch (error: any) {
      console.error("Error al subir foto de galeria a Firebase Storage:", error);
      if (error.status === 404 || error.code === 'storage/unknown') {
        throw new Error("No se pudo subir la imagen a Firebase Storage. Por favor, asegúrate de activar y configurar Firebase Storage en tu consola de Firebase (proyecto 'parqueo-cueva').");
      }
      throw new Error(`Error de subida de imagen: ${error.message || error}`);
    }
  },

  getGaleriaItems: async (): Promise<GaleriaItem[]> => {
    try {
      const colRef = collection(db, "galeria");
      const snapshot = await getDocs(colRef);
      const list: GaleriaItem[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as GaleriaItem);
      });
      // Sort by descending date
      return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    } catch (error) {
      console.error("Error fetching galeria:", error);
      throw error;
    }
  },

  saveGaleriaItem: async (item: GaleriaItem): Promise<void> => {
    try {
      const { id, ...data } = item;
      if (id) {
        const docRef = doc(db, "galeria", id);
        await setDoc(docRef, data, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "galeria"));
        await setDoc(newDocRef, data);
      }
    } catch (error) {
      console.error("Error saving galeria item:", error);
      throw error;
    }
  },

  deleteGaleriaItem: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "galeria", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting galeria item:", error);
      throw error;
    }
  },

  syncInitialGaleria: async (initialItems: GaleriaItem[]): Promise<void> => {
    try {
      const colRef = collection(db, "galeria");
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        let syncedCount = 0;
        for (const item of initialItems) {
          await setDoc(doc(db, "galeria", item.id), item);
          syncedCount++;
        }
        if (syncedCount > 0) {
          console.log(`Sincronizadas ${syncedCount} fotos de galería iniciales en Firestore.`);
        }
      }
    } catch (error) {
      console.error("Error syncing initial galeria:", error);
    }
  },

  // ================= LIBRO DE ACTAS =================
  getActas: async (): Promise<Acta[]> => {
    try {
      const colRef = collection(db, "actas");
      const snapshot = await getDocs(colRef);
      const list: Acta[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Acta);
      });
      // Ordenar por fecha descendente
      return list.sort((a, b) => b.fecha.localeCompare(a.fecha));
    } catch (error) {
      console.error("Error fetching actas from Firestore:", error);
      throw error;
    }
  },

  saveActa: async (acta: Acta): Promise<void> => {
    try {
      const { id, ...data } = acta;
      if (id) {
        const docRef = doc(db, "actas", id);
        const cleanData = JSON.parse(JSON.stringify(data));
        await setDoc(docRef, cleanData, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "actas"));
        const cleanData = JSON.parse(JSON.stringify({ ...data, id: newDocRef.id }));
        await setDoc(newDocRef, cleanData);
      }
    } catch (error) {
      console.error("Error saving acta in Firestore:", error);
      throw error;
    }
  },

  deleteActa: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "actas", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting acta from Firestore:", error);
      throw error;
    }
  },

  syncInitialActas: async (initialActas: Acta[]): Promise<void> => {
    try {
      const colRef = collection(db, "actas");
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        let syncedCount = 0;
        for (const acta of initialActas) {
          await setDoc(doc(db, "actas", acta.id), acta);
          syncedCount++;
        }
        if (syncedCount > 0) {
          console.log(`Sincronizadas ${syncedCount} actas iniciales en Firestore.`);
        }
      }
    } catch (error) {
      console.error("Error syncing initial actas:", error);
    }
  },

  // ================= LINEA DE TIEMPO =================
  getHitosHistoricos: async (): Promise<HitoHistorico[]> => {
    try {
      const colRef = collection(db, "linea_tiempo");
      const snapshot = await getDocs(colRef);
      const list: HitoHistorico[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as HitoHistorico);
      });
      // Ordenar por fecha o ID; como las fechas pueden ser años antiguos, ordenamos alfanuméricamente o dejaremos el frontend que ordene
      return list;
    } catch (error) {
      console.error("Error fetching hitos from Firestore:", error);
      throw error;
    }
  },

  saveHitoHistorico: async (hito: HitoHistorico): Promise<void> => {
    try {
      const { id, ...data } = hito;
      if (id) {
        const docRef = doc(db, "linea_tiempo", id);
        const cleanData = JSON.parse(JSON.stringify(data));
        await setDoc(docRef, cleanData, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "linea_tiempo"));
        const cleanData = JSON.parse(JSON.stringify({ ...data, id: newDocRef.id }));
        await setDoc(newDocRef, cleanData);
      }
    } catch (error) {
      console.error("Error saving hito in Firestore:", error);
      throw error;
    }
  },

  deleteHitoHistorico: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "linea_tiempo", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting hito from Firestore:", error);
      throw error;
    }
  },

  // ================= VOLUNTARIOS =================
  saveSolicitudVoluntario: async (solicitud: SolicitudVoluntario): Promise<void> => {
    try {
      const docRef = doc(db, "solicitudes_voluntarios", solicitud.id);
      const cleanData = JSON.parse(JSON.stringify(solicitud));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving volunteer request in Firestore:", error);
      throw error;
    }
  },

  getSolicitudesVoluntarios: async (): Promise<SolicitudVoluntario[]> => {
    try {
      const colRef = collection(db, "solicitudes_voluntarios");
      const snapshot = await getDocs(colRef);
      const list: SolicitudVoluntario[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as SolicitudVoluntario);
      });
      return list.sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());
    } catch (error) {
      console.error("Error fetching volunteer requests from Firestore:", error);
      throw error;
    }
  },

  deleteSolicitudVoluntario: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "solicitudes_voluntarios", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting volunteer request from Firestore:", error);
      throw error;
    }
  },

  // AGENDAS
  getAgendas: async (): Promise<ReunionAgenda[]> => {
    try {
      const colRef = collection(db, "agendas");
      const snapshot = await getDocs(colRef);
      const list: ReunionAgenda[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ReunionAgenda);
      });
      return list.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
    } catch (error) {
      console.error("Error fetching agendas:", error);
      throw error;
    }
  },

  saveAgenda: async (agenda: ReunionAgenda): Promise<void> => {
    try {
      const { id, ...data } = agenda;
      if (id) {
        const docRef = doc(db, "agendas", id);
        await setDoc(docRef, data, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "agendas"));
        await setDoc(newDocRef, { ...data, id: newDocRef.id }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving agenda:", error);
      throw error;
    }
  },

  deleteAgenda: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "agendas", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting agenda:", error);
      throw error;
    }
  },

  // TAREAS COMISIONES
  getTareasComisiones: async (): Promise<TareaComision[]> => {
    try {
      const colRef = collection(db, "tareas_comisiones");
      const snapshot = await getDocs(colRef);
      const list: TareaComision[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as TareaComision);
      });
      return list;
    } catch (error) {
      console.error("Error fetching tareas comisiones:", error);
      throw error;
    }
  },

  saveTareaComision: async (tarea: TareaComision): Promise<void> => {
    try {
      const { id, ...data } = tarea;
      if (id) {
        const docRef = doc(db, "tareas_comisiones", id);
        await setDoc(docRef, data, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "tareas_comisiones"));
        await setDoc(newDocRef, { ...data, id: newDocRef.id }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving tarea comision:", error);
      throw error;
    }
  },

  deleteTareaComision: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "tareas_comisiones", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting tarea comision:", error);
      throw error;
    }
  },

  getAsistencias: async (): Promise<Asistencia[]> => {
    try {
      const colRef = collection(db, "asistencias");
      const list: Asistencia[] = [];
      const querySnapshot = await getDocs(colRef);
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Asistencia);
      });
      return list;
    } catch (error) {
      console.error("Error fetching asistencias:", error);
      return [];
    }
  },

  saveAsistenciasBatch: async (asistencias: Asistencia[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      asistencias.forEach(a => {
        const { id, ...data } = a;
        const docRef = id ? doc(db, "asistencias", id) : doc(collection(db, "asistencias"));
        batch.set(docRef, data, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error saving asistencias batch:", error);
      throw error;
    }
  },

  getBienesInventario: async (): Promise<BienInventario[]> => {
    try {
      const colRef = collection(db, "inventario");
      const snapshot = await getDocs(colRef);
      const list: BienInventario[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as BienInventario);
      });
      return list;
    } catch (error) {
      console.error("Error fetching inventario from Firestore:", error);
      return [];
    }
  },

  saveBienInventario: async (bien: BienInventario): Promise<void> => {
    try {
      const docRef = doc(db, "inventario", bien.id);
      const cleanData = JSON.parse(JSON.stringify(bien));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving bien in Firestore:", error);
      throw error;
    }
  },

  deleteBienInventario: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, "inventario", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting bien from Firestore:", error);
      throw error;
    }
  },

  getCategoriasInventario: async (): Promise<CategoriaInventario[]> => {
    try {
      const colRef = collection(db, "categorias_inventario");
      const snapshot = await getDocs(colRef);
      const list: CategoriaInventario[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as CategoriaInventario);
      });
      return list;
    } catch (error) {
      console.error("Error fetching categorias from Firestore:", error);
      return [];
    }
  },

  saveCategoriaInventario: async (cat: CategoriaInventario): Promise<void> => {
    try {
      const docRef = doc(db, "categorias_inventario", cat.id);
      const cleanData = JSON.parse(JSON.stringify(cat));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving category in Firestore:", error);
      throw error;
    }
  },

  // --- CONVENCION METHODS ---
  getConvencionConfig: async (): Promise<ConvencionConfig> => {
    try {
      const docRef = doc(db, "convencion_config", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as ConvencionConfig;
      }
      return {
        titulo: "Distrito D3 Guatemala",
        lema: "Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación",
        fechaEvento: "2026-03-19",
        horaEvento: "08:00:00",
        fotoSede: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80",
        inscripcionesAbiertas: false
      };
    } catch (error) {
      console.error("Error fetching convencion config from Firestore:", error);
      return {
        titulo: "Distrito D3 Guatemala",
        lema: "Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación",
        fechaEvento: "2026-03-19",
        horaEvento: "08:00:00",
        fotoSede: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80",
        inscripcionesAbiertas: false
      };
    }
  },

  saveConvencionConfig: async (config: ConvencionConfig): Promise<void> => {
    try {
      const docRef = doc(db, "convencion_config", "config");
      const cleanData = JSON.parse(JSON.stringify(config));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving convencion config in Firestore:", error);
      throw error;
    }
  },

  saveConvencionRegistro: async (registro: ConvencionRegistro): Promise<void> => {
    try {
      const docRef = doc(db, "convencion_registros", registro.id);
      const cleanData = JSON.parse(JSON.stringify(registro));
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error("Error saving convencion registration in Firestore:", error);
      throw error;
    }
  },

  getConvencionRegistros: async (): Promise<ConvencionRegistro[]> => {
    try {
      const colRef = collection(db, "convencion_registros");
      const snapshot = await getDocs(colRef);
      const list: ConvencionRegistro[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as ConvencionRegistro);
      });
      return list.sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());
    } catch (error) {
      console.error("Error fetching convencion registrations from Firestore:", error);
      return [];
    }
  },

  uploadConvencionImage: async (base64Data: string): Promise<string> => {
    try {
      if (!base64Data.startsWith('data:image')) {
        return base64Data;
      }
      const uniqueName = `sede_convencion_${Date.now()}`;
      const storageRef = ref(storage, `galeria/${uniqueName}`);
      await uploadString(storageRef, base64Data, 'data_url');
      return await getDownloadURL(storageRef);
    } catch (error: any) {
      console.error("Error al subir foto de convención a Firebase Storage:", error);
      throw new Error(`Error de subida de imagen: ${error.message || error}`);
    }
  },
};
