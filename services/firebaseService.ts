import { db, storage } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Socio, PropuestaSocio } from "../types";

export const firebaseService = {
  // Upload candidate photo to Firebase Storage (Supports Base64 data_url format)
  uploadCandidatePhoto: async (base64Data: string, candidateId: string): Promise<string> => {
    if (!base64Data || !base64Data.startsWith("data:")) {
      return base64Data; // Return as is if it's already a web URL
    }
    try {
      const storageRef = ref(storage, `candidatos/${candidateId}.jpg`);
      await uploadString(storageRef, base64Data, "data_url");
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading photo to Storage:", error);
      throw error;
    }
  },

  // Save a new proposal to Firestore
  saveProposal: async (proposal: PropuestaSocio): Promise<void> => {
    try {
      const docRef = doc(db, "propuestas", proposal.id);
      await setDoc(docRef, proposal);
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
      await updateDoc(docRef, updatedData);
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
      await setDoc(docRef, socio);
    } catch (error) {
      console.error("Error saving socio in Firestore:", error);
      throw error;
    }
  },

  // Synchronize initial mock members to Firestore
  syncInitialSocios: async (initialSocios: Socio[]): Promise<void> => {
    try {
      const colRef = collection(db, "socios");
      const snapshot = await getDocs(colRef);
      // Only sync if Firestore collection is empty
      if (snapshot.empty) {
        console.log("Firestore 'socios' collection is empty. Syncing MOCK_SOCIOS...");
        for (const socio of initialSocios) {
          await setDoc(doc(db, "socios", socio.id), socio);
        }
        console.log("MOCK_SOCIOS synced to Firestore successfully.");
      }
    } catch (error) {
      console.error("Error syncing initial socios to Firestore:", error);
    }
  }
};
