import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole =
  | 'malchin'
  | 'bag_darga'
  | 'sum_admin'
  | 'khorshoo'
  | 'service_provider';

const ONBOARDING_KEY = '@malchin_onboarding_data';

export const ROLE_LABEL: Record<UserRole, string> = {
  malchin: 'Малчин',
  bag_darga: 'Багийн дарга',
  sum_admin: 'Сумын ажилтан',
  khorshoo: 'Хоршоо',
  service_provider: 'Үйлчилгээ үзүүлэгч',
};

export const ROLE_EMOJI: Record<UserRole, string> = {
  malchin: '🐑',
  bag_darga: '👨‍💼',
  sum_admin: '🏛️',
  khorshoo: '🤝',
  service_provider: '🛠️',
};

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string>('');

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const d = JSON.parse(raw);
            if (d.role) setRole(d.role as UserRole);
            if (d.firstName) setName(d.firstName);
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { role, name, loading };
}
