import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onDismiss: () => void;
  selectedEmojis?: string[];
}

const DEFAULT_REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelectReaction,
  onDismiss,
  selectedEmojis = [],
}) => {
  const { colors } = useTheme();

  const handleSelect = (emoji: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onSelectReaction(emoji);
    onDismiss();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
          shadowColor: '#000',
        },
      ]}
    >
      {DEFAULT_REACTIONS.map((emoji) => {
        const isSelected = selectedEmojis.includes(emoji);
        return (
          <TouchableOpacity
            key={emoji}
            onPress={() => handleSelect(emoji)}
            style={[
              styles.emojiBtn,
              isSelected && { backgroundColor: colors.surfaceSecondary, borderRadius: 16 },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 0.5,
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  emojiBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 22,
  },
});
