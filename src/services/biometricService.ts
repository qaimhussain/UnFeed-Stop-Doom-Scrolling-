import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  /**
   * Check if the device has biometric or screen lock hardware available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  /**
   * Authenticate using Fingerprint, Face ID, or Device PIN/Pattern
   */
  async authenticate(promptMessage: string = 'Unlock Unfeed'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  },
};
