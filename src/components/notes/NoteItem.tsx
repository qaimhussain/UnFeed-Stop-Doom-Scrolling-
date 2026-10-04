import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { PersonalNote } from '../../types';
import { FormattedText } from './FormattedText';

interface NoteItemProps {
  note: PersonalNote;
  onPress: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onPress,
  onTogglePin,
  onDelete,
}) => {
  const { colors, typography, spacing } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const handlePin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onTogglePin();
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Alert.alert(
      'Delete Note',
      `Delete "${note.title || 'Untitled Note'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            onDelete();
          },
        },
      ]
    );
  };

  const hasChecklist =
    note.blocks?.some((b) => b.type === 'checklist') ??
    (note.content.includes('[ ]') || note.content.includes('[x]'));

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.divider,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          {note.isPinned && (
            <Ionicons
              name="pin"
              size={14}
              color={colors.accent}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[typography.h3, { color: colors.textPrimary, flex: 1 }]}
            numberOfLines={1}
          >
            {note.title}
          </Text>
        </View>

        <View style={styles.topActionsRow}>
          <TouchableOpacity
            onPress={handlePin}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.pinBtn}
            accessibilityLabel={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Ionicons
              name={note.isPinned ? 'pin' : 'pin-outline'}
              size={18}
              color={note.isPinned ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.pinBtn, { marginLeft: 10 }]}
            accessibilityLabel="Delete note"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {note.blocks && note.blocks.length > 0 ? (
        <View style={{ marginVertical: spacing.xs, gap: 4 }}>
          {note.blocks.slice(0, 3).map((block) => (
            <View key={block.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              {block.type === 'checklist' ? (
                <Ionicons
                  name={block.checked ? 'checkbox' : 'square-outline'}
                  size={14}
                  color={block.checked ? colors.accent : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
              ) : block.type === 'bullet' ? (
                <Text style={{ color: colors.accent, marginRight: 6, fontSize: 13, lineHeight: 18 }}>•</Text>
              ) : null}
              <FormattedText
                text={block.text}
                numberOfLines={1}
                style={[
                  typography.body,
                  {
                    color: block.checked ? colors.textTertiary : colors.textSecondary,
                    textDecorationLine: block.checked ? 'line-through' : 'none',
                    flex: 1,
                  },
                ]}
              />
            </View>
          ))}
          {note.blocks.length > 3 && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              +{note.blocks.length - 3} more items
            </Text>
          )}
        </View>
      ) : (
        <FormattedText
          text={note.content}
          numberOfLines={3}
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              marginVertical: spacing.xs,
            },
          ]}
        />
      )}

      <View style={[styles.bottomRow, { marginTop: spacing.sm }]}>
        <Text style={[typography.footnote, { color: colors.textTertiary }]}>
          {note.updatedAt || note.createdAt}
        </Text>

        {hasChecklist && (
          <View style={[styles.checklistBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkbox-outline" size={12} color={colors.accent} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
              Checklist
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinBtn: {
    padding: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checklistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
