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
  uploadCandidatePhoto: async (base64Data: string, _candidateId: string): Promise<string> => {
    // Return base64 directly to store in Firestore, avoiding Storage rules latency and timeouts
    return base64Data;
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
