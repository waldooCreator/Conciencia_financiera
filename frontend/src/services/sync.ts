import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const OFFLINE_QUEUE_KEY = '@offline_transaction_queue';
const NETWORK_STATE_KEY = '@network_state';

export interface OfflineTransaction {
  id: string;
  payload: any;
  timestamp: number;
  retries: number;
}

export const syncService = {
  /**
   * Save a transaction to the offline queue when there's no connection.
   */
  async queueTransaction(payload: any): Promise<void> {
    const queue = await this.getQueue();
    const offlineTx: OfflineTransaction = {
      id: Date.now().toString(),
      payload,
      timestamp: Date.now(),
      retries: 0,
    };
    
    queue.push(offlineTx);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  /**
   * Get the current offline queue.
   */
  async getQueue(): Promise<OfflineTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Check if device is online.
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  },

  /**
   * Sync all pending offline transactions with the backend.
   * Returns the number of successfully synced transactions.
   */
  async syncPendingTransactions(): Promise<{ synced: number; failed: number }> {
    const online = await this.isOnline();
    if (!online) {
      return { synced: 0, failed: 0 };
    }

    const queue = await this.getQueue();
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remainingQueue: OfflineTransaction[] = [];

    for (const item of queue) {
      try {
        await api.post('/transactions/', item.payload);
        synced++;
      } catch (error: any) {
        // If it's a 4xx error (client error), don't retry
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          failed++;
        } else {
          // Network error or server error, keep in queue
          item.retries += 1;
          remainingQueue.push(item);
        }
      }
    }

    // Update the queue with remaining items
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));

    return { synced, failed };
  },

  /**
   * Clear the offline queue.
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  /**
   * Get the count of pending offline transactions.
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },
};
