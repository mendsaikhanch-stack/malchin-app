import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncApi } from './api';

// Storage keys
const QUEUE_KEY = '@malchin_sync_queue';
const DEVICE_ID_KEY = '@malchin_device_id';
const LAST_SYNC_KEY = '@malchin_last_sync';

// Types
type QueuedChange = {
  id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: number;
  data: any;
  created_at: string;
};

// Generate a random hex string as a simple unique ID
function generateId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return (
    id.slice(0, 8) + '-' +
    id.slice(8, 12) + '-' +
    id.slice(12, 16) + '-' +
    id.slice(16, 20) + '-' +
    id.slice(20)
  );
}

/**
 * Get or generate a unique device ID (persisted in AsyncStorage).
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return generateId();
  }
}

/**
 * Add a change to the offline write queue.
 * Auto-generates id and created_at timestamp.
 */
export async function queueChange(
  change: Omit<QueuedChange, 'id' | 'created_at'>
): Promise<QueuedChange> {
  const entry: QueuedChange = {
    ...change,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  try {
    const queue = await getQueue();
    queue.push(entry);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // If reading existing queue fails, start fresh with this entry
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([entry]));
  }

  return entry;
}

/**
 * Get all queued changes.
 */
export async function getQueue(): Promise<QueuedChange[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedChange[];
  } catch {
    return [];
  }
}

/**
 * Get number of pending changes in the queue.
 */
export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Flush all queued changes to the server via syncApi.push().
 * On success, clears the queue and updates last sync time.
 */
export async function flushQueue(): Promise<{
  synced: number;
  errors: string[];
  id_mappings: any[];
}> {
  const queue = await getQueue();
  if (queue.length === 0) {
    return { synced: 0, errors: [], id_mappings: [] };
  }

  const deviceId = await getDeviceId();

  try {
    const response = await syncApi.push({
      device_id: deviceId,
      changes: queue.map((c) => ({
        table_name: c.table_name,
        action: c.action,
        record_id: c.record_id,
        data: typeof c.data === 'string' ? c.data : JSON.stringify(c.data),
        created_at: c.created_at,
      })),
    });

    // Clear the queue on success
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    return {
      synced: response.synced ?? queue.length,
      errors: response.errors ?? [],
      id_mappings: response.id_mappings ?? [],
    };
  } catch (e: any) {
    return {
      synced: 0,
      errors: [e.message || 'Sync push failed'],
      id_mappings: [],
    };
  }
}

/**
 * Pull changes from server since the last sync.
 * Returns the changes array from the server response.
 */
export async function pullChanges(): Promise<any[]> {
  const deviceId = await getDeviceId();
  const lastSync = await getLastSyncTime();
  const since = lastSync || '1970-01-01T00:00:00.000Z';

  try {
    const response = await syncApi.pull(since, deviceId);
    // Update last sync time after successful pull
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return response.changes ?? [];
  } catch {
    return [];
  }
}

/**
 * Clear the entire queue (manual reset).
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  } catch {
    // Silent fail
  }
}

/**
 * Get the last sync timestamp (ISO string or null).
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Write endpoint wrapper: API call хийж, fail үед queue-т push хийнэ.
 * Callsite-д try/catch давтах хэрэггүй болгоно.
 *
 * Buцаадаг:
 *   { synced: true, data } — real API амжилттай, cache-д шууд available
 *   { synced: false, queued: true } — сүлжээгүй/backend унасан, queue-т орсон.
 *                                      UI-д "дараа илгээгдэнэ" message харуулна
 */
export async function queueOnFailure<T>(
  primary: () => Promise<T>,
  fallback: Omit<QueuedChange, 'id' | 'created_at'>
): Promise<
  | { synced: true; data: T; queued: false }
  | { synced: false; queued: true; entry: QueuedChange }
> {
  try {
    const data = await primary();
    return { synced: true, data, queued: false };
  } catch {
    const entry = await queueChange(fallback);
    return { synced: false, queued: true, entry };
  }
}

/**
 * Auto-sync: call periodically with current connectivity status.
 * If connected and queue has items, flushes the queue first, then pulls changes.
 * Returns sync result or null if offline / nothing to do.
 */
export async function autoSync(
  isConnected: boolean
): Promise<{
  pushed: { synced: number; errors: string[]; id_mappings: any[] } | null;
  pulled: any[];
} | null> {
  if (!isConnected) return null;

  let pushResult: { synced: number; errors: string[]; id_mappings: any[] } | null = null;

  // Flush pending changes first
  const count = await getQueueCount();
  if (count > 0) {
    pushResult = await flushQueue();
  }

  // Then pull new changes from server
  const pulled = await pullChanges();

  // If nothing happened at all, return null
  if (!pushResult && pulled.length === 0) return null;

  return { pushed: pushResult, pulled };
}
