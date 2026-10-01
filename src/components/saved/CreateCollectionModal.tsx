import React, { useState, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface CreateCollectionModalProps {
  visible: boolean;
  initialName?: string;
  isRenaming?: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  visible,
  initialName = '',
  isRenaming = false,
  onClose,
  onSave,
}) => {
  const { colors, typography, spacing } = useTheme();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, visible]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
            {isRenaming ? 'Rename Collection' : 'New Collection'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Collection name"
            placeholderTextColor={colors.inputPlaceholder}
            autoFocus
            style={[
              styles.input,
              typography.body,
              {
                backgroundColor: colors.inputBackground,
                color: colors.inputText,
                marginTop: spacing.base,
              },
            ]}
          />

          <View style={[styles.buttonsRow, { marginTop: spacing.lg }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.btn, { borderColor: colors.divider, borderWidth: 1 }]}
            >
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim()}
              style={[
                styles.btn,
                {
                  backgroundColor: name.trim() ? colors.accent : colors.divider,
                  marginLeft: 10,
                },
              ]}
            >
              <Text
                style={[
                  typography.bodyBold,
                  { color: name.trim() ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
