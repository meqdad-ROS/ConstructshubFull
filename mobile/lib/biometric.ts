// Biometric lock. On app launch (and resume after N minutes) we gate the
// signed-in session behind TouchID / FaceID / Android biometrics. The user
// can disable this per-device from Settings.

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PREF_KEY = 'constructhub.biometric.enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return Boolean(hasHardware && supported.length > 0 && enrolled);
  } catch {
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(PREF_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(PREF_KEY, enabled ? '1' : '0', {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Prompt for biometric auth. Returns true on success OR when biometrics are
 * unavailable (so we don't lock the user out of their own account) — the
 * calling flow decides what to do with that info.
 */
export async function requireBiometric(reason = 'Unlock ConstructsHub'): Promise<boolean> {
  if (!(await isBiometricAvailable())) return true;
  if (!(await isBiometricEnabled())) return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  } catch {
    return false;
  }
}
