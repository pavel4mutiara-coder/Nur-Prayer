
import { UserPreferences } from '../types';

const DB_NAME = 'NurPrayerDB';
const DB_VERSION = 1;
const STORES = {
  SETTINGS: 'settings',
  JOURNAL: 'journal'
};

export class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORES.JOURNAL)) {
          db.createObjectStore(STORES.JOURNAL, { keyPath: 'dateId' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    return this.set(STORES.SETTINGS, 'prefs', prefs);
  }

  async getPreferences(): Promise<UserPreferences | null> {
    return this.get(STORES.SETTINGS, 'prefs');
  }

  async saveJournalEntry(dateId: string, prayers: Record<string, boolean>): Promise<void> {
    return this.set(STORES.JOURNAL, dateId, { dateId, prayers });
  }

  async getJournalEntry(dateId: string): Promise<Record<string, boolean> | null> {
    const entry = await this.get(STORES.JOURNAL, dateId);
    return entry ? entry.prayers : null;
  }

  // ক্যালেন্ডার ভিউর জন্য মাসের সব এন্ট্রি পাওয়ার নতুন মেথড
  async getAllJournalEntries(): Promise<Record<string, Record<string, boolean>>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORES.JOURNAL, 'readonly');
      const store = transaction.objectStore(STORES.JOURNAL);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results: Record<string, Record<string, boolean>> = {};
        request.result.forEach((item: any) => {
          results[item.dateId] = item.prayers;
        });
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async set(storeName: string, key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, store.keyPath ? undefined : key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async get(storeName: string, key: string): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new LocalDB();
