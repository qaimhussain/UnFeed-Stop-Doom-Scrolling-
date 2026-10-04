import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';

interface SessionTimerReminderModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const SessionTimerReminderModal: React.FC<SessionTimerReminderModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { colors, typography } = useTheme();
  const sessionMinutes = useAppStore((state) => state.focusSettings.sessionTimerMinutes);

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onDismiss();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentSecondary }]}>
            <Ionicons name="timer-outline" size={36} color={colors.accent} />
          </View>

          <Text
            style={[
              typography.h2,
              { color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
            ]}
          >
            Session Complete
          </Text>

          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 24,
              },
            ]}
          >
            Your {sessionMinutes || 10}-minute intentional focus window is wrapped up. Take a deep breath, step away, and return to what truly moves you.
          </Text>

          <TouchableOpacity
            onPress={handleDismiss}
            style={[styles.dismissBtn, { backgroundColor: colors.accent }]}
            activeOpacity={0.8}
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Back to the real world</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dismissBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
