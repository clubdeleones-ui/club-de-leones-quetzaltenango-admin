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
  limit
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { VehiculoParqueo, Socio, PropuestaSocio, Solicitud, Actividad, RubroPresupuesto, FondoPresupuesto, AsignacionComision, Comision, MinutaComision } from "../types";

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
      const existingIds = new Set(snapshot.docs.map(doc => doc.id));
      
      let syncedCount = 0;
      for (const socio of initialSocios) {
        if (!existingIds.has(socio.id)) {
          await setDoc(doc(db, "socios", socio.id), socio);
          syncedCount++;
        }
      }
      if (syncedCount > 0) {
        console.log(`Sincronizados ${syncedCount} socios preestablecidos faltantes en Firestore.`);
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
      const existingIds = new Set(snapshot.docs.map(doc => doc.id));
      
      let syncedCount = 0;
      for (const act of initialActividades) {
        if (!existingIds.has(act.id)) {
          await setDoc(doc(db, "actividades", act.id), act);
          syncedCount++;
        }
      }
      if (syncedCount > 0) {
        console.log(`Sincronizadas ${syncedCount} actividades preestablecidas en Firestore.`);
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
};
