import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    writeBatch,
} from 'firebase/firestore';

// ========================
// Types (matching index.tsx)
// ========================



interface Message {
    role: 'user' | 'model';
    text: string;
}

type Mode = 'MODE_LITERAL' | 'MODE_UNDERSTANDING';

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    mode: Mode;
    date: number;
    userId?: string;
}

interface FeedbackEntry {
    id: string;
    sessionId: string;
    question: string;
    answer: string;
    mode: string;
    feedback: 'like' | 'dislike';
    timestamp: number;
}

interface TokenLogEntry {
    id: string;
    sessionId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    type: string;
    timestamp: number;
    inputTokensSaved?: number;
    outputTokensSaved?: number;
}

interface CacheEntry {
    answer: string;
    question: string;
    mode: string;
    cachedAt: number;
    inputTokens: number;
    outputTokens: number;
    hitCount: number;
}



// ========================
// SESSIONS
// ========================

export const getSessions = async (userId?: string): Promise<ChatSession[]> => {
    try {
        let q;
        if (userId) {
            q = query(collection(db, 'sessions'), where('userId', '==', userId));
        } else {
            q = collection(db, 'sessions');
        }
        const snap = await getDocs(q);
        const sessions = snap.docs.map(d => d.data() as ChatSession);
        // Sort by date descending (newest first)
        sessions.sort((a, b) => b.date - a.date);
        return sessions;
    } catch (e) {
        console.error('Firebase: getSessions error', e);
        return [];
    }
};

export const saveSession = async (session: ChatSession): Promise<void> => {
    try {
        await setDoc(doc(db, 'sessions', session.id), session);
    } catch (e) {
        console.error('Firebase: saveSession error', e);
    }
};

export const deleteSessionFromDb = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'sessions', id));
    } catch (e) {
        console.error('Firebase: deleteSession error', e);
    }
};

// ========================
// FEEDBACK
// ========================

export const getFeedback = async (sessionId?: string): Promise<FeedbackEntry[]> => {
    try {
        let q;
        if (sessionId) {
            q = query(collection(db, 'feedback'), where('sessionId', '==', sessionId));
        } else {
            q = collection(db, 'feedback');
        }
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as FeedbackEntry);
    } catch (e) {
        console.error('Firebase: getFeedback error', e);
        return [];
    }
};

export const saveFeedback = async (entry: FeedbackEntry): Promise<void> => {
    try {
        await setDoc(doc(db, 'feedback', entry.id), entry);
    } catch (e) {
        console.error('Firebase: saveFeedback error', e);
    }
};

export const deleteFeedbackByFilter = async (
    sessionId: string,
    question: string,
    answerPrefix: string
): Promise<void> => {
    try {
        const q = query(
            collection(db, 'feedback'),
            where('sessionId', '==', sessionId),
            where('question', '==', question)
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
            const data = d.data() as FeedbackEntry;
            if (data.answer.substring(0, 50) === answerPrefix) {
                batch.delete(d.ref);
            }
        });
        await batch.commit();
    } catch (e) {
        console.error('Firebase: deleteFeedbackByFilter error', e);
    }
};

// ========================
// TOKEN LOGS
// ========================

export const getTokenLogs = async (): Promise<TokenLogEntry[]> => {
    try {
        const snap = await getDocs(collection(db, 'tokenLogs'));
        return snap.docs.map(d => d.data() as TokenLogEntry);
    } catch (e) {
        console.error('Firebase: getTokenLogs error', e);
        return [];
    }
};

export const addTokenLog = async (entry: TokenLogEntry): Promise<void> => {
    try {
        await setDoc(doc(db, 'tokenLogs', entry.id), entry);
    } catch (e) {
        console.error('Firebase: addTokenLog error', e);
    }
};

// ========================
// ANSWER CACHE
// ========================

export const getCacheEntries = async (): Promise<Record<string, CacheEntry>> => {
    try {
        const snap = await getDocs(collection(db, 'answerCache'));
        const result: Record<string, CacheEntry> = {};
        snap.docs.forEach(d => {
            result[d.id] = d.data() as CacheEntry;
        });
        return result;
    } catch (e) {
        console.error('Firebase: getCacheEntries error', e);
        return {};
    }
};

export const getCacheEntry = async (key: string): Promise<CacheEntry | null> => {
    try {
        const safeKey = encodeURIComponent(key);
        const docRef = doc(db, 'answerCache', safeKey);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return snap.data() as CacheEntry;
    } catch (e) {
        console.error('Firebase: getCacheEntry error', e);
        return null;
    }
};

export const saveCacheEntry = async (key: string, entry: CacheEntry): Promise<void> => {
    try {
        // Firestore doc IDs can't contain '/' so we encode the key
        const safeKey = encodeURIComponent(key);
        await setDoc(doc(db, 'answerCache', safeKey), entry);
    } catch (e) {
        console.error('Firebase: saveCacheEntry error', e);
    }
};

export const updateCacheHitCount = async (key: string, newHitCount: number): Promise<void> => {
    try {
        const safeKey = encodeURIComponent(key);
        const docRef = doc(db, 'answerCache', safeKey);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data() as CacheEntry;
            await setDoc(docRef, { ...data, hitCount: newHitCount });
        }
    } catch (e) {
        console.error('Firebase: updateCacheHitCount error', e);
    }
};

export const clearCache = async (): Promise<void> => {
    try {
        const snap = await getDocs(collection(db, 'answerCache'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } catch (e) {
        console.error('Firebase: clearCache error', e);
    }
};

// ========================
// RESET (for admin dashboard)
// ========================

export const resetTokenLogs = async (): Promise<void> => {
    try {
        const snap = await getDocs(collection(db, 'tokenLogs'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } catch (e) {
        console.error('Firebase: resetTokenLogs error', e);
    }
};

export const resetFeedback = async (): Promise<void> => {
    try {
        const snap = await getDocs(collection(db, 'feedback'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } catch (e) {
        console.error('Firebase: resetFeedback error', e);
    }
};
