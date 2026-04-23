import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getToken } from './api';

const API_BASE = 'http://localhost:5000';

/**
 * Push notification үйлчилгээ - Expo Notifications
 */

// Foreground дээр notification хэрхэн харагдахыг тохируулах
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Push notification-д бүртгүүлэх, token-г backend-руу илгээх
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Физик төхөөрөмж дээр ажиллуулна уу');
    return null;
  }

  // Зөвшөөрөл шалгах
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Push notification зөвшөөрөл олгогдоогүй');
    return null;
  }

  // Android channel тохируулах
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Малчин',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22C55E',
    });
  }

  // Expo push token авах
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  // Backend-руу token илгээх
  try {
    const authToken = await getToken();
    if (authToken) {
      const res = await fetch(`${API_BASE}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: pushToken }),
      });
      if (!res.ok) {
        console.error('[Notifications] Token бүртгэх амжилтгүй:', res.status);
      }
    }
  } catch (e) {
    console.error('[Notifications] Token илгээхэд алдаа:', e);
  }

  return pushToken;
}

// Notification хүлээн авах listener
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Notification дарах (tap) listener - навигацид ашиглах
export function addResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
