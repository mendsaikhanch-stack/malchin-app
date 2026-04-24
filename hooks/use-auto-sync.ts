import { useEffect, useRef } from 'react';
import { useNetwork } from './use-network';
import { autoSync, getQueueCount } from '@/services/sync-queue';

// Сүлжээ сэргэмэгц (false → true шилжилт) queue-д хуримтлагдсан writes-ийг
// server руу push хийж, шинэ changes-ийг pull хийнэ.
// Offline үед хэрэглэгч зар нэмэх зэрэг үйлдэл хийвэл `queueOnFailure`
// дамжуулан locally хадгалагдсан — энэ hook нь flush талыг хариуцна.
export function useAutoSync() {
  const isConnected = useNetwork();
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    // false → true шилжилт үед л дуудна (дахин дуудахгүй)
    if (!prevConnected.current && isConnected) {
      getQueueCount().then((count) => {
        if (count > 0) {
          autoSync(true).catch(() => {
            // Silent fail — дараагийн reconnect-д дахин оролдоно
          });
        }
      });
    }
    prevConnected.current = isConnected;
  }, [isConnected]);
}
