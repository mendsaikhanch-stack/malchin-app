// AsyncStorage direct import нь pure (node) project-д ts-jest esModuleInterop
// асуудалтай — зөвхөн syncQueue-ийн export API-аар state-г удирдана.
// __INTERNAL_MOCK_STORAGE__ нь official async-storage-mock-ийн reset affordance.
import * as syncQueue from '../sync-queue';
import { syncApi } from '../api';

jest.mock('../api', () => ({
  syncApi: {
    push: jest.fn(),
    pull: jest.fn(),
    getStatus: jest.fn(),
    resolve: jest.fn(),
  },
}));

// Raw mock storage-руу шууд хандах — test-ээр reset хийх цорын ганц арга
const rawMockStorage = require(
  '@react-native-async-storage/async-storage'
).__INTERNAL_MOCK_STORAGE__ as Record<string, string>;

const LAST_SYNC_KEY = '@malchin_last_sync';

beforeEach(() => {
  // Key тус бүрийг нэрэн дээр цэвэрлэнэ
  for (const k of Object.keys(rawMockStorage)) {
    delete rawMockStorage[k];
  }
  jest.clearAllMocks();
});

describe('sync-queue / getDeviceId', () => {
  it('анхны дуудалт нь шинэ UUID үүсгэж AsyncStorage-д хадгална', async () => {
    const id = await syncQueue.getDeviceId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    // Raw storage-руу шууд шалгана
    expect(rawMockStorage['@malchin_device_id']).toBe(id);
  });

  it('дараагийн дуудалт адилхан id буцаана (idempotent)', async () => {
    const first = await syncQueue.getDeviceId();
    const second = await syncQueue.getDeviceId();
    expect(second).toBe(first);
  });
});

describe('sync-queue / queueChange + getQueue', () => {
  it('анхны queueChange нь auto id + created_at үүсгэнэ', async () => {
    const entry = await syncQueue.queueChange({
      table_name: 'animals',
      action: 'INSERT',
      record_id: 0,
      data: { species: 'horse', count: 2 },
    });
    expect(entry.id).toMatch(/^[0-9a-f-]+$/);
    expect(entry.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(entry.table_name).toBe('animals');
  });

  it('дараалсан queueChange нь queue-д нэмэгдэнэ', async () => {
    await syncQueue.queueChange({
      table_name: 'animals',
      action: 'INSERT',
      record_id: 0,
      data: {},
    });
    await syncQueue.queueChange({
      table_name: 'listings',
      action: 'UPDATE',
      record_id: 5,
      data: {},
    });
    const q = await syncQueue.getQueue();
    expect(q.length).toBe(2);
    expect(q[0].table_name).toBe('animals');
    expect(q[1].table_name).toBe('listings');
  });

  it('getQueueCount нь одоогийн queue-ийн тоог буцаана', async () => {
    expect(await syncQueue.getQueueCount()).toBe(0);
    await syncQueue.queueChange({
      table_name: 'x',
      action: 'DELETE',
      record_id: 1,
      data: null,
    });
    expect(await syncQueue.getQueueCount()).toBe(1);
  });

  it('corrupt JSON байсан ч fresh start хийнэ', async () => {
    rawMockStorage['@malchin_sync_queue'] = '{invalid json';
    const entry = await syncQueue.queueChange({
      table_name: 'x',
      action: 'INSERT',
      record_id: 0,
      data: {},
    });
    const q = await syncQueue.getQueue();
    // Fresh overwrite — нэг entry л байх
    expect(q.length).toBe(1);
    expect(q[0].id).toBe(entry.id);
  });
});

describe('sync-queue / flushQueue', () => {
  it('empty queue дээр syncApi дуудахгүй', async () => {
    const result = await syncQueue.flushQueue();
    expect(result.synced).toBe(0);
    expect(syncApi.push).not.toHaveBeenCalled();
  });

  it('success үед queue цэвэрлэгдэнэ + last_sync хадгалагдана', async () => {
    (syncApi.push as jest.Mock).mockResolvedValue({
      synced: 2,
      errors: [],
      id_mappings: [{ client: 1, server: 42 }],
    });
    await syncQueue.queueChange({
      table_name: 'animals',
      action: 'INSERT',
      record_id: 0,
      data: { x: 1 },
    });
    await syncQueue.queueChange({
      table_name: 'animals',
      action: 'UPDATE',
      record_id: 1,
      data: { x: 2 },
    });

    const result = await syncQueue.flushQueue();
    expect(result.synced).toBe(2);
    expect(result.errors).toEqual([]);
    expect(result.id_mappings.length).toBe(1);

    // Queue цэвэрлэгдсэн
    expect(await syncQueue.getQueueCount()).toBe(0);
    // last_sync хадгалагдсан
    expect(rawMockStorage[LAST_SYNC_KEY]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('syncApi.push алдаа үед queue хэвээр + алдаа буцаана', async () => {
    (syncApi.push as jest.Mock).mockRejectedValue(new Error('Network down'));
    await syncQueue.queueChange({
      table_name: 'x',
      action: 'INSERT',
      record_id: 0,
      data: {},
    });
    const result = await syncQueue.flushQueue();
    expect(result.synced).toBe(0);
    expect(result.errors).toEqual(['Network down']);
    expect(await syncQueue.getQueueCount()).toBe(1); // preserved
  });

  it('push нь data string-ээр serialize хийнэ', async () => {
    (syncApi.push as jest.Mock).mockResolvedValue({ synced: 1, errors: [] });
    await syncQueue.queueChange({
      table_name: 'animals',
      action: 'INSERT',
      record_id: 0,
      data: { species: 'sheep' },
    });
    await syncQueue.flushQueue();
    const call = (syncApi.push as jest.Mock).mock.calls[0][0];
    expect(typeof call.changes[0].data).toBe('string');
    expect(JSON.parse(call.changes[0].data)).toEqual({ species: 'sheep' });
  });
});

describe('sync-queue / pullChanges', () => {
  it('anhny pull нь since=1970 ашиглана', async () => {
    (syncApi.pull as jest.Mock).mockResolvedValue({ changes: [] });
    await syncQueue.pullChanges();
    const call = (syncApi.pull as jest.Mock).mock.calls[0];
    expect(call[0]).toBe('1970-01-01T00:00:00.000Z');
  });

  it('lastSync байгаа бол түүнээс хойш pull хийнэ', async () => {
    const prev = '2026-04-20T10:00:00.000Z';
    rawMockStorage[LAST_SYNC_KEY] = prev;
    (syncApi.pull as jest.Mock).mockResolvedValue({ changes: [] });
    await syncQueue.pullChanges();
    const call = (syncApi.pull as jest.Mock).mock.calls[0];
    expect(call[0]).toBe(prev);
  });

  it('response нь changes array буцаана + last_sync update', async () => {
    (syncApi.pull as jest.Mock).mockResolvedValue({
      changes: [{ id: 1 }, { id: 2 }],
    });
    const changes = await syncQueue.pullChanges();
    expect(changes.length).toBe(2);
    expect(rawMockStorage[LAST_SYNC_KEY]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('pull алдаа үед хоосон array буцаана', async () => {
    (syncApi.pull as jest.Mock).mockRejectedValue(new Error('offline'));
    const changes = await syncQueue.pullChanges();
    expect(changes).toEqual([]);
  });
});

describe('sync-queue / autoSync', () => {
  it('isConnected=false → null буцаана', async () => {
    const result = await syncQueue.autoSync(false);
    expect(result).toBeNull();
    expect(syncApi.push).not.toHaveBeenCalled();
    expect(syncApi.pull).not.toHaveBeenCalled();
  });

  it('connected + empty queue + server changes байхгүй → null', async () => {
    (syncApi.pull as jest.Mock).mockResolvedValue({ changes: [] });
    const result = await syncQueue.autoSync(true);
    expect(result).toBeNull();
  });

  it('connected + queue item → push хийнэ, pulled 0 ч гэсэн result буцаана', async () => {
    (syncApi.push as jest.Mock).mockResolvedValue({ synced: 1, errors: [] });
    (syncApi.pull as jest.Mock).mockResolvedValue({ changes: [] });
    await syncQueue.queueChange({
      table_name: 'x',
      action: 'INSERT',
      record_id: 0,
      data: {},
    });
    const result = await syncQueue.autoSync(true);
    expect(result).not.toBeNull();
    expect(result?.pushed?.synced).toBe(1);
    expect(result?.pulled).toEqual([]);
  });

  it('connected + empty queue + server changes бий → pulled буцаана', async () => {
    (syncApi.pull as jest.Mock).mockResolvedValue({
      changes: [{ table_name: 'livestock' }],
    });
    const result = await syncQueue.autoSync(true);
    expect(result?.pushed).toBeNull();
    expect(result?.pulled.length).toBe(1);
  });
});

describe('sync-queue / queueOnFailure', () => {
  it('primary амжилттай үед queue-д хадгалахгүй + data буцаана', async () => {
    const primary = jest.fn().mockResolvedValue({ id: 42, ok: true });
    const result = await syncQueue.queueOnFailure(primary, {
      table_name: 'listings',
      action: 'INSERT',
      record_id: 0,
      data: { x: 1 },
    });
    expect(result.synced).toBe(true);
    if (result.synced) {
      expect(result.data).toEqual({ id: 42, ok: true });
      expect(result.queued).toBe(false);
    }
    expect(primary).toHaveBeenCalledTimes(1);
    expect(await syncQueue.getQueueCount()).toBe(0);
  });

  it('primary fail үед queue-д push хийж, entry буцаана', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('offline'));
    const result = await syncQueue.queueOnFailure(primary, {
      table_name: 'listings',
      action: 'INSERT',
      record_id: 0,
      data: { x: 1 },
    });
    expect(result.synced).toBe(false);
    expect(result.queued).toBe(true);
    if (result.queued) {
      expect(result.entry.table_name).toBe('listings');
      expect(result.entry.id).toMatch(/^[0-9a-f-]+$/);
    }
    expect(await syncQueue.getQueueCount()).toBe(1);
  });
});

describe('sync-queue / clearQueue', () => {
  it('queue-г хоосолно', async () => {
    await syncQueue.queueChange({
      table_name: 'x',
      action: 'INSERT',
      record_id: 0,
      data: {},
    });
    expect(await syncQueue.getQueueCount()).toBe(1);
    await syncQueue.clearQueue();
    expect(await syncQueue.getQueueCount()).toBe(0);
  });
});
