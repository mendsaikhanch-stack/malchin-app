import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsConnected(state.isConnected ?? true);
      } catch {
        setIsConnected(true); // Assume connected if can't check
      }
    };
    check();
    const interval = setInterval(check, 10000); // 10 секунд тутамд шалгах
    return () => clearInterval(interval);
  }, []);

  return isConnected;
}
