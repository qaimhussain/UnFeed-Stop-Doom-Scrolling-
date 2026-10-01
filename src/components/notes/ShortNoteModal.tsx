import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Avatar } from '../common/Avatar';
import { User } from '../../types';

interface ShortNoteModalProps {
  visible: boolean;
  currentUser: User;
  initialText?: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

export const ShortNoteModal: React.FC<ShortNoteModalProps> = ({
  visible,
  currentUser,
  initialText = '',
  onClose,
  onSave,
}) => {
  const { colors, typography, spacing } = useTheme();
  const [text, setText] = useState(initialText);

  const handleShare = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onSave(text.trim());
    onClose();
  };

  const remainingChars = 60 - text.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <Text style={[typography.h3, { color: colors.textPrimary }]}>New note</Text>

            <TouchableOpacity
              onPress={handleShare}
              disabled={text.trim().length === 0}
              style={[
                styles.shareBtn,
                {
                  backgroundColor: text.trim().length > 0 ? colors.accent : colors.divider,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: text.trim().length > 0 ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Share
              </Text>
            </TouchableOpacity>
          </View>

          {/* Thought Bubble Preview */}
          <View style={styles.previewContainer}>
            <View
              style={[
                styles.thoughtBubble,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.divider,
                },
              ]}
            >
              <TextInput
                value={text}
                onChangeText={(val) => {
                  if (val.length <= 60) setText(val);
                }}
                placeholder="Share what's on your mind..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={60}
                autoFocus
                style={[
                  styles.input,
                  typography.bodyMedium,
                  { color: colors.textPrimary },
                ]}
              />

              {/* Thought dots */}
              <View
                style={[
                  styles.tailDot1,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.divider },
                ]}
              />
              <View
                style={[
                  styles.tailDot2,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.divider },
                ]}
              />
            </View>

            <Avatar
              url={currentUser.avatarUrl}
              name={currentUser.fullName}
              size={84}
              style={styles.avatar}
            />

            <Text
              style={[
                typography.caption,
                {
                  color: remainingChars < 10 ? colors.destructive : colors.textSecondary,
                  marginTop: spacing.md,
                },
              ]}
            >
              {text.length}/60 characters • Visible for 24h
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 36,
    paddingHorizontal: 20,
    minHeight: 340,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thoughtBubble: {
    minHeight: 70,
    width: 220,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  tailDot1: {
    position: 'absolute',
    bottom: -6,
    left: 100,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  tailDot2: {
    position: 'absolute',
    bottom: -12,
    left: 92,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 0.5,
  },
  avatar: {
    marginTop: 6,
  },
});
