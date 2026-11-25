import {
  doc, setDoc, updateDoc, onSnapshot, collection, addDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, writeBatch, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const createProfile = (uid, data) =>
  setDoc(doc(db, 'usuarios', uid), {
    ...data, phone: '', address: '', favorites: [], role: 'cliente', createdAt: serverTimestamp(),
  });

export const updateProfile = (uid, data) => updateDoc(doc(db, 'usuarios', uid), data);

export const subscribeProfile = (uid, cb) =>
  onSnapshot(doc(db, 'usuarios', uid), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null));

export const toggleFavorite = (uid, productId, on) =>
  updateDoc(doc(db, 'usuarios', uid), { favorites: on ? arrayUnion(productId) : arrayRemove(productId) });

export const subscribeProducts = (cb) =>
  onSnapshot(query(collection(db, 'produtos'), orderBy('name')), (s) =>
    cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));

export const subscribeProduct = (id, cb) =>
  onSnapshot(doc(db, 'produtos', id), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null));

export const saveProduct = (p) => {
  const { id, ...data } = p;
  return id
    ? updateDoc(doc(db, 'produtos', id), data)
    : addDoc(collection(db, 'produtos'), { ...data, createdAt: serverTimestamp() });
};

export const removeProduct = (id) => deleteDoc(doc(db, 'produtos', id));

export async function seedProducts(list) {
  const batch = writeBatch(db);
  list.forEach((p) => batch.set(doc(collection(db, 'produtos')), { ...p, active: true, createdAt: serverTimestamp() }));
  await batch.commit();
}

const mapOrders = (s) =>
  s.docs.map((d) => ({ id: d.id, ...d.data(), date: d.data().createdAt?.toDate() || new Date() }));

export const createOrder = (order) =>
  addDoc(collection(db, 'pedidos'), { ...order, status: 'novo', createdAt: serverTimestamp() });

export const subscribeMyOrders = (uid, cb) =>
  onSnapshot(query(collection(db, 'pedidos'), where('uid', '==', uid)), (s) =>
    cb(mapOrders(s).sort((a, b) => b.date - a.date)));

export const subscribeAllOrders = (cb) =>
  onSnapshot(query(collection(db, 'pedidos'), orderBy('createdAt', 'desc')), (s) => cb(mapOrders(s)));

export const setOrderStatus = (id, status) => updateDoc(doc(db, 'pedidos', id), { status });
