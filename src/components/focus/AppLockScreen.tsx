import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { GlassSurface } from './GlassSurface';
import { UnfeedWordmark } from '../common/UnfeedWordmark';
import { biometricService } from '../../services/biometricService';

interface AppLockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ isLocked, onUnlock }) => {
  const { colors, typography, isDark } = useTheme();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      const success = await biometricService.authenticate('Unlock Unfeed');
      if (success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        onUnlock();
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    if (isLocked) {
      // Trigger biometric prompt on open
      const timer = setTimeout(() => {
        handleAuthenticate();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  return (
    <Modal visible={isLocked} animationType="fade" transparent={false}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <UnfeedWordmark fontSize={42} useGradient={true} />

          <GlassSurface
            useRealBlur={true}
            blurIntensity={45}
            borderRadius={24}
            elevation={8}
            style={styles.card}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={32} color={colors.accent} />
            </View>

            <Text style={[typography.h2, styles.title, { color: colors.textPrimary }]}>
              Unfeed is Locked
            </Text>
            <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
              Your chats, saved visual library, and personal reflections are protected.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAuthenticate}
              style={[styles.unlockButton, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="finger-print-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>
                {isAuthenticating ? 'Authenticating...' : 'Unlock with Biometrics'}
              </Text>
            </TouchableOpacity>
          </GlassSurface>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: 28,
    alignItems: 'center',
    marginTop: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 149, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
