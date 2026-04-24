import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useAutoSync } from '../use-auto-sync';
import * as syncQueue from '@/services/sync-queue';

// useNetwork-ийг controllable mock болгов
let mockConnected = true;
jest.mock('../use-network', () => ({
  useNetwork: () => mockConnected,
}));

jest.mock('@/services/sync-queue', () => ({
  autoSync: jest.fn(),
  getQueueCount: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (syncQueue.autoSync as jest.Mock).mockResolvedValue(null);
  (syncQueue.getQueueCount as jest.Mock).mockResolvedValue(0);
});

describe('useAutoSync', () => {
  it('анхны render үед autoSync дуудахгүй (reconnect биш)', async () => {
    mockConnected = true;
    renderHook(() => useAutoSync());
    await waitFor(() => {
      expect(syncQueue.autoSync).not.toHaveBeenCalled();
    });
  });

  it('offline-оос online руу шилжихэд queue хоосон үед autoSync дуудахгүй', async () => {
    mockConnected = false;
    const { rerender } = renderHook(() => useAutoSync());
    await waitFor(() => {
      expect(syncQueue.getQueueCount).not.toHaveBeenCalled();
    });

    // false → true transition
    (syncQueue.getQueueCount as jest.Mock).mockResolvedValue(0);
    await act(async () => {
      mockConnected = true;
      rerender();
    });
    await waitFor(() => {
      expect(syncQueue.getQueueCount).toHaveBeenCalled();
    });
    expect(syncQueue.autoSync).not.toHaveBeenCalled();
  });

  it('offline→online + queue-д item бий → autoSync(true) дуудна', async () => {
    mockConnected = false;
    const { rerender } = renderHook(() => useAutoSync());

    (syncQueue.getQueueCount as jest.Mock).mockResolvedValue(3);
    await act(async () => {
      mockConnected = true;
      rerender();
    });
    await waitFor(() => {
      expect(syncQueue.autoSync).toHaveBeenCalledWith(true);
    });
  });

  it('online хэвээр байх хэвэндээ autoSync дахин дуудахгүй (transition биш)', async () => {
    mockConnected = true;
    const { rerender } = renderHook(() => useAutoSync());
    (syncQueue.getQueueCount as jest.Mock).mockResolvedValue(5);
    await act(async () => {
      rerender();
    });
    expect(syncQueue.autoSync).not.toHaveBeenCalled();
  });

  it('autoSync throw хийсэн ч silent (promise-тэй rejection catch)', async () => {
    mockConnected = false;
    const { rerender } = renderHook(() => useAutoSync());
    (syncQueue.getQueueCount as jest.Mock).mockResolvedValue(1);
    (syncQueue.autoSync as jest.Mock).mockRejectedValue(new Error('x'));

    await act(async () => {
      mockConnected = true;
      rerender();
    });
    await waitFor(() => {
      expect(syncQueue.autoSync).toHaveBeenCalled();
    });
    // Unhandled promise rejection үүсгэхгүй — 50ms хүлээж шалгана
    await new Promise((r) => setTimeout(r, 50));
  });
});
