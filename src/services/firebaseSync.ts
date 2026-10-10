import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChatMessage, ClientBill } from '../types';

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const CHAT_COLLECTION = 'chat_messages';
const BILLS_COLLECTION = 'client_bills';
const LOCAL_CHAT_STORAGE_KEY = 'akaar_realtime_chat_cache';
const LOCAL_BILLS_STORAGE_KEY = 'akaar_client_bills_cache';

/**
 * Get device name for multi-device identification
 */
export function getDeviceIdentifier(): string {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android Device';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS Device';
  if (/mac/i.test(ua)) return 'Mac Workstation';
  if (/win/i.test(ua)) return 'Windows PC';
  return 'Web Device';
}

/**
 * Subscribe to real-time chat messages across all connected devices
 */
export function subscribeToChatMessages(
  callback: (messages: ChatMessage[]) => void,
  onError?: (err: any) => void
): () => void {
  // Load initial local cache first for zero-lag UI
  try {
    const cached = localStorage.getItem(LOCAL_CHAT_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      }
    }
  } catch (e) {
    console.warn('Could not read chat cache', e);
  }

  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt) {
            if (typeof data.createdAt === 'string') {
              createdAtStr = data.createdAt;
            } else if (data.createdAt instanceof Timestamp) {
              createdAtStr = data.createdAt.toDate().toISOString();
            }
          }

          msgs.push({
            id: docSnap.id,
            senderName: data.senderName || 'Team Member',
            senderEmail: data.senderEmail || '',
            senderAvatar: data.senderAvatar || '',
            text: data.text || '',
            createdAt: createdAtStr,
            device: data.device || 'Web Device',
            hasBill: !!data.hasBill,
            billData: data.billData,
          });
        });

        // Update local cache
        try {
          localStorage.setItem(LOCAL_CHAT_STORAGE_KEY, JSON.stringify(msgs));
        } catch (err) {
          // ignore quota error
        }

        callback(msgs);
      },
      (error) => {
        console.warn('Real-time Firestore chat stream error, using local state:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach Firestore listener for chat:', err);
    return () => {};
  }
}

/**
 * Send a new chat message to all connected devices in real time
 */
export async function sendChatMessage(msg: {
  senderName: string;
  senderEmail?: string;
  senderAvatar?: string;
  text: string;
  device?: string;
  hasBill?: boolean;
  billData?: any;
}): Promise<void> {
  const payload = {
    ...msg,
    device: msg.device || getDeviceIdentifier(),
    createdAt: new Date().toISOString(),
    timestamp: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, CHAT_COLLECTION), payload);
  } catch (firestoreErr) {
    console.warn('Firestore write failed, saving locally:', firestoreErr);
    // Fallback: save to localStorage so device still gets seamless experience
    try {
      const existingStr = localStorage.getItem(LOCAL_CHAT_STORAGE_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newMsg = {
        id: `local-${Date.now()}`,
        ...payload,
      };
      existing.push(newMsg);
      localStorage.setItem(LOCAL_CHAT_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Subscribe to uploaded client bills & commercial data
 */
export function subscribeToClientBills(
  callback: (bills: ClientBill[]) => void,
  onError?: (err: any) => void
): () => void {
  // Load initial local cache
  try {
    const cached = localStorage.getItem(LOCAL_BILLS_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      }
    }
  } catch (e) {
    console.warn('Could not read bills cache', e);
  }

  try {
    const q = query(
      collection(db, BILLS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bills: ClientBill[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt) {
            if (typeof data.createdAt === 'string') {
              createdAtStr = data.createdAt;
            } else if (data.createdAt instanceof Timestamp) {
              createdAtStr = data.createdAt.toDate().toISOString();
            }
          }

          bills.push({
            id: docSnap.id,
            clientName: data.clientName || 'Unnamed Client',
            clientEmail: data.clientEmail || '',
            service: data.service || 'Audio & Soundtrack Production',
            billAmount: Number(data.billAmount) || 0,
            currency: data.currency || 'INR',
            invoiceNumber: data.invoiceNumber || `INV-${docSnap.id.slice(0, 6).toUpperCase()}`,
            notes: data.notes || '',
            fileName: data.fileName || '',
            fileData: data.fileData || '',
            fileSize: data.fileSize || '',
            uploadedBy: data.uploadedBy || 'Team Member',
            createdAt: createdAtStr,
          });
        });

        // Update local cache
        try {
          localStorage.setItem(LOCAL_BILLS_STORAGE_KEY, JSON.stringify(bills));
        } catch (err) {
          // ignore
        }

        callback(bills);
      },
      (error) => {
        console.warn('Real-time Firestore bills stream error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach Firestore listener for bills:', err);
    return () => {};
  }
}

/**
 * Upload client bill / invoice / data and announce to real-time chat
 */
export async function uploadClientBillRecord(bill: {
  clientName: string;
  clientEmail?: string;
  service: string;
  billAmount: number;
  currency?: string;
  invoiceNumber: string;
  notes?: string;
  fileName?: string;
  fileData?: string;
  fileSize?: string;
  uploadedBy?: string;
}): Promise<string> {
  const payload = {
    ...bill,
    currency: bill.currency || 'INR',
    uploadedBy: bill.uploadedBy || 'Akaar Team',
    createdAt: new Date().toISOString(),
    timestamp: serverTimestamp(),
  };

  let billDocId = `bill-${Date.now()}`;

  try {
    const docRef = await addDoc(collection(db, BILLS_COLLECTION), payload);
    billDocId = docRef.id;
  } catch (err) {
    console.warn('Firestore bill upload failed, caching locally:', err);
    try {
      const existingStr = localStorage.getItem(LOCAL_BILLS_STORAGE_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift({ id: billDocId, ...payload });
      localStorage.setItem(LOCAL_BILLS_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }
  }

  // Also broadcast a real-time message in the chat so team on other devices see it
  try {
    await sendChatMessage({
      senderName: bill.uploadedBy || 'Akaar Team',
      text: `📄 Uploaded Bill for ${bill.clientName} (₹${bill.billAmount.toLocaleString('en-IN')}) — Invoice #${bill.invoiceNumber}`,
      hasBill: true,
      billData: {
        clientName: bill.clientName,
        billAmount: bill.billAmount,
        currency: bill.currency || 'INR',
        invoiceNumber: bill.invoiceNumber,
        service: bill.service,
        fileName: bill.fileName,
        fileUrl: bill.fileData,
        notes: bill.notes,
      },
    });
  } catch (e) {
    console.warn('Could not broadcast bill announcement to chat', e);
  }

  return billDocId;
}
