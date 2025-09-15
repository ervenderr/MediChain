// IndexedDB wrapper for offline data storage
export class OfflineStorage {
  private dbName = 'MediChainDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Health Records store
        if (!db.objectStoreNames.contains('healthRecords')) {
          const healthStore = db.createObjectStore('healthRecords', { keyPath: 'recordID' });
          healthStore.createIndex('category', 'category', { unique: false });
          healthStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Pending Records store (for offline creation)
        if (!db.objectStoreNames.contains('pendingRecords')) {
          const pendingStore = db.createObjectStore('pendingRecords', { keyPath: 'id', autoIncrement: true });
          pendingStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Files store
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'fileID' });
          filesStore.createIndex('recordID', 'recordID', { unique: false });
        }
        
        // Patient data store
        if (!db.objectStoreNames.contains('patient')) {
          db.createObjectStore('patient', { keyPath: 'id' });
        }
        
        // Emergency info store
        if (!db.objectStoreNames.contains('emergencyInfo')) {
          db.createObjectStore('emergencyInfo', { keyPath: 'id' });
        }

        // QR codes store
        if (!db.objectStoreNames.contains('qrCodes')) {
          const qrStore = db.createObjectStore('qrCodes', { keyPath: 'id' });
          qrStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // Health Records operations
  async saveHealthRecords(records: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['healthRecords'], 'readwrite');
    const store = transaction.objectStore('healthRecords');
    
    // Clear existing records and add new ones
    await store.clear();
    
    for (const record of records) {
      await store.add({
        ...record,
        lastSyncedAt: Date.now()
      });
    }
  }

  async getHealthRecords(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['healthRecords'], 'readonly');
      const store = transaction.objectStore('healthRecords');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addHealthRecord(record: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['healthRecords'], 'readwrite');
    const store = transaction.objectStore('healthRecords');
    
    await store.add({
      ...record,
      lastSyncedAt: Date.now()
    });
  }

  async updateHealthRecord(record: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['healthRecords'], 'readwrite');
    const store = transaction.objectStore('healthRecords');
    
    await store.put({
      ...record,
      lastSyncedAt: Date.now()
    });
  }

  async deleteHealthRecord(recordID: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['healthRecords'], 'readwrite');
    const store = transaction.objectStore('healthRecords');
    
    await store.delete(recordID);
  }

  // Pending Records operations (for offline creation)
  async addPendingRecord(record: any, token: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
    const store = transaction.objectStore('pendingRecords');
    
    await store.add({
      data: record,
      token: token,
      createdAt: Date.now(),
      type: 'CREATE'
    });
  }

  async addPendingUpdate(recordID: string, record: any, token: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
    const store = transaction.objectStore('pendingRecords');
    
    await store.add({
      recordID: recordID,
      data: record,
      token: token,
      createdAt: Date.now(),
      type: 'UPDATE'
    });
  }

  async addPendingDelete(recordID: string, token: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
    const store = transaction.objectStore('pendingRecords');
    
    await store.add({
      recordID: recordID,
      token: token,
      createdAt: Date.now(),
      type: 'DELETE'
    });
  }

  async getPendingRecords(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRecords'], 'readonly');
      const store = transaction.objectStore('pendingRecords');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingRecord(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
    const store = transaction.objectStore('pendingRecords');
    
    await store.delete(id);
  }

  async clearPendingRecords(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingRecords'], 'readwrite');
    const store = transaction.objectStore('pendingRecords');
    
    await store.clear();
  }

  // Patient data operations
  async savePatientData(data: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['patient'], 'readwrite');
    const store = transaction.objectStore('patient');
    
    await store.put({
      id: 'current',
      ...data,
      lastSyncedAt: Date.now()
    });
  }

  async getPatientData(): Promise<any | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patient'], 'readonly');
      const store = transaction.objectStore('patient');
      const request = store.get('current');
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Emergency info operations
  async saveEmergencyInfo(data: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['emergencyInfo'], 'readwrite');
    const store = transaction.objectStore('emergencyInfo');
    
    await store.put({
      id: 'current',
      ...data,
      lastSyncedAt: Date.now()
    });
  }

  async getEmergencyInfo(): Promise<any | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['emergencyInfo'], 'readonly');
      const store = transaction.objectStore('emergencyInfo');
      const request = store.get('current');
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // QR codes operations
  async saveQRCodes(qrCodes: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['qrCodes'], 'readwrite');
    const store = transaction.objectStore('qrCodes');
    
    // Clear existing and add new
    await store.clear();
    
    for (const qr of qrCodes) {
      await store.add({
        ...qr,
        lastSyncedAt: Date.now()
      });
    }
  }

  async getQRCodes(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['qrCodes'], 'readonly');
      const store = transaction.objectStore('qrCodes');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // File operations (store file metadata, actual files handled by service worker cache)
  async saveFileMetadata(files: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    
    for (const file of files) {
      await store.put({
        ...file,
        lastSyncedAt: Date.now()
      });
    }
  }

  async getFileMetadata(recordID?: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      
      if (recordID) {
        const index = store.index('recordID');
        const request = index.getAll(recordID);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = ['healthRecords', 'pendingRecords', 'files', 'patient', 'emergencyInfo', 'qrCodes'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
  }

  // Get storage usage info
  async getStorageInfo(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    
    return { used: 0, quota: 0 };
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();