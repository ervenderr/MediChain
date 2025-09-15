import { offlineStorage } from './offlineStorage';
import { getApiUrl, API_CONFIG } from './constants';

// Type declarations for Background Sync API
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register: (tag: string) => Promise<void>;
    };
  }
}

export class SyncService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Array<(status: string) => void> = [];

  constructor() {
    // Initialize online status
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Add sync status listener
  addListener(callback: (status: string) => void) {
    this.listeners.push(callback);
  }

  // Remove sync status listener
  removeListener(callback: (status: string) => void) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  // Notify listeners of sync status
  private notifyListeners(status: string) {
    this.listeners.forEach(callback => callback(status));
  }

  // Trigger sync when online
  async triggerSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    this.notifyListeners('syncing');

    try {
      await this.syncPendingChanges();
      await this.syncFromServer();
      this.notifyListeners('completed');
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners('error');
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync pending changes to server
  private async syncPendingChanges(): Promise<void> {
    const pendingRecords = await offlineStorage.getPendingRecords();
    
    for (const pending of pendingRecords) {
      try {
        switch (pending.type) {
          case 'CREATE':
            await this.syncCreateRecord(pending);
            break;
          case 'UPDATE':
            await this.syncUpdateRecord(pending);
            break;
          case 'DELETE':
            await this.syncDeleteRecord(pending);
            break;
        }
        
        // Remove from pending after successful sync
        await offlineStorage.removePendingRecord(pending.id);
      } catch (error) {
        console.error('Failed to sync pending record:', pending.id, error);
        // Keep in pending for retry later
      }
    }
  }

  // Sync CREATE operations
  private async syncCreateRecord(pending: any): Promise<void> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pending.token}`
      },
      body: JSON.stringify(pending.data)
    });

    if (!response.ok) {
      throw new Error(`Failed to create record: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local storage with server-generated ID
    await offlineStorage.addHealthRecord(result);
  }

  // Sync UPDATE operations
  private async syncUpdateRecord(pending: any): Promise<void> {
    const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS)}/${pending.recordID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pending.token}`
      },
      body: JSON.stringify(pending.data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update record: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local storage
    await offlineStorage.updateHealthRecord(result);
  }

  // Sync DELETE operations
  private async syncDeleteRecord(pending: any): Promise<void> {
    const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS)}/${pending.recordID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${pending.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete record: ${response.statusText}`);
    }

    // Remove from local storage
    await offlineStorage.deleteHealthRecord(pending.recordID);
  }

  // Sync data from server
  private async syncFromServer(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Sync health records
      await this.syncHealthRecordsFromServer(token);
      
      // Sync patient data
      await this.syncPatientDataFromServer(token);
      
      // Sync emergency info
      await this.syncEmergencyInfoFromServer(token);
      
      // Sync QR codes
      await this.syncQRCodesFromServer(token);
    } catch (error) {
      console.error('Failed to sync from server:', error);
      throw error;
    }
  }

  // Sync health records from server
  private async syncHealthRecordsFromServer(token: string): Promise<void> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const records = await response.json();
      await offlineStorage.saveHealthRecords(records);
      
      // Cache files metadata
      const allFiles = records.flatMap((record: any) => 
        record.files?.map((file: any) => ({ ...file, recordID: record.recordID })) || []
      );
      if (allFiles.length > 0) {
        await offlineStorage.saveFileMetadata(allFiles);
      }
    }
  }

  // Sync patient data from server
  private async syncPatientDataFromServer(token: string): Promise<void> {
    const response = await fetch(getApiUrl('/api/patient/profile'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const patientData = await response.json();
      await offlineStorage.savePatientData(patientData);
    }
  }

  // Sync emergency info from server
  private async syncEmergencyInfoFromServer(token: string): Promise<void> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.EMERGENCY_INFO), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const emergencyInfo = await response.json();
      await offlineStorage.saveEmergencyInfo(emergencyInfo);
    }
  }

  // Sync QR codes from server
  private async syncQRCodesFromServer(token: string): Promise<void> {
    // This would require a QR codes API endpoint
    // For now, we'll skip this or implement based on existing QR functionality
    console.log('QR codes sync - implement when QR API is available');
  }

  // Handle offline record creation
  async createRecordOffline(record: any): Promise<string> {
    // Generate temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempRecord = { ...record, recordID: tempId, createdAt: new Date().toISOString() };
    
    // Add to local storage immediately
    await offlineStorage.addHealthRecord(tempRecord);
    
    // Add to pending sync
    const token = localStorage.getItem('token');
    if (token) {
      await offlineStorage.addPendingRecord(record, token);
    }

    // Trigger background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      registration.sync?.register('health-records-sync');
    }

    return tempId;
  }

  // Handle offline record updates
  async updateRecordOffline(recordID: string, record: any): Promise<void> {
    // Update local storage immediately
    await offlineStorage.updateHealthRecord({ ...record, recordID });
    
    // Add to pending sync
    const token = localStorage.getItem('token');
    if (token) {
      await offlineStorage.addPendingUpdate(recordID, record, token);
    }

    // Trigger background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      registration.sync?.register('health-records-sync');
    }
  }

  // Handle offline record deletion
  async deleteRecordOffline(recordID: string): Promise<void> {
    // Remove from local storage immediately
    await offlineStorage.deleteHealthRecord(recordID);
    
    // Add to pending sync (only if it's not a temp record)
    if (!recordID.startsWith('temp_')) {
      const token = localStorage.getItem('token');
      if (token) {
        await offlineStorage.addPendingDelete(recordID, token);
      }
    }

    // Trigger background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      registration.sync?.register('health-records-sync');
    }
  }

  // Get offline records
  async getOfflineRecords(): Promise<any[]> {
    return await offlineStorage.getHealthRecords();
  }

  // Get sync status
  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Get pending changes count
  async getPendingChangesCount(): Promise<number> {
    const pending = await offlineStorage.getPendingRecords();
    return pending.length;
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.triggerSync();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }
}

// Singleton instance
export const syncService = new SyncService();