import auth from "@react-native-firebase/auth";
import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

// Initialize Firestore with v22 API
const db = firestore();

export { auth, db };

// Export modular functions for v22 compatibility
export const collection = (collectionPath: string) =>
  db.collection(collectionPath);
export const doc = (collectionPath: string, docId: string) =>
  db.collection(collectionPath).doc(docId);
export const serverTimestamp = () => firestore.FieldValue.serverTimestamp();

// Helper functions for common operations
export const getDoc = async (collectionPath: string, docId: string) => {
  const docRef = doc(collectionPath, docId);
  return await docRef.get();
};

export const setDoc = async (
  collectionPath: string,
  docId: string,
  data: any
) => {
  const docRef = doc(collectionPath, docId);
  return await docRef.set(data);
};

export const updateDoc = async (
  collectionPath: string,
  docId: string,
  data: any
) => {
  const docRef = doc(collectionPath, docId);
  return await docRef.update(data);
};

export const deleteDoc = async (collectionPath: string, docId: string) => {
  const docRef = doc(collectionPath, docId);
  return await docRef.delete();
};

// Helper functions for listeners
export const onDocSnapshot = (
  collectionPath: string,
  docId: string,
  callback: (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => void
) => {
  const docRef = doc(collectionPath, docId);
  return docRef.onSnapshot(callback);
};

export const onCollectionSnapshot = (
  collectionPath: string,
  callback: (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => void
) => {
  const collectionRef = collection(collectionPath);
  return collectionRef.onSnapshot(callback);
};

export const onQuerySnapshot = (
  collectionPath: string,
  field: string,
  operator: FirebaseFirestoreTypes.WhereFilterOp,
  value: any,
  callback: (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => void
) => {
  const collectionRef = collection(collectionPath);
  return collectionRef.where(field, operator, value).onSnapshot(callback);
};

// Query functions for fetching data
export const getDocs = async (collectionPath: string) => {
  const collectionRef = collection(collectionPath);
  return await collectionRef.get();
};

export const getDocsWhere = async (
  collectionPath: string,
  field: string,
  operator: FirebaseFirestoreTypes.WhereFilterOp,
  value: any
) => {
  const collectionRef = collection(collectionPath);
  return await collectionRef.where(field, operator, value).get();
};
