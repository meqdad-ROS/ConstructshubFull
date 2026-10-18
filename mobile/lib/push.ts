import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './api';

export async function registerForPushAsync(): Promise<string | null> {
  try {
    const current = await Notifications.getPermissionsAsync();
    let granted = current.status === 'granted';
    if (!granted) {
      const next = await Notifications.requestPermissionsAsync();
      granted = next.status === 'granted';
    }
    if (!granted) return null;

    // Expo pushes work on managed workflow via the Expo push token. In a bare
    // / dev-client build with Firebase added, replace this with the native
    // getDevicePushTokenAsync() call. The server treats both as opaque strings.
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api('/api/notifications/devices', {
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
      }),
    }).catch(() => undefined);
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushAsync(token: string): Promise<void> {
  try {
    await api('/api/notifications/devices', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  } catch {
    /* ignore */
  }
}
