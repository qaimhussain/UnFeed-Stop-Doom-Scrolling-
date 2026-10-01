import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Avatar } from '../common/Avatar';
import { User, ShortNote } from '../../types';

interface NotesBarProps {
  currentUser: User;
  userNote: ShortNote;
  contacts: User[];
  shortNotes: Record<string, ShortNote>;
  onPressYourNote: () => void;
  onPressFriendNote: (contact: User, note: ShortNote) => void;
}

export const NotesBar: React.FC<NotesBarProps> = ({
  currentUser,
  userNote,
  contacts,
  shortNotes,
  onPressYourNote,
  onPressFriendNote,
}) => {
  const { colors, typography, spacing } = useTheme();

  const handlePress = (cb: () => void) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    cb();
  };

  // Contacts who have active short notes
  const contactsWithNotes = contacts.filter((c) => !!shortNotes[c.id]);

  return (
    <View style={[styles.container, { borderBottomColor: colors.divider }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
      >
        {/* Your Note */}
        <View style={styles.itemContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handlePress(onPressYourNote)}
            style={styles.bubbleTouchTarget}
          >
            <View
              style={[
                styles.thoughtBubble,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.divider,
                  shadowColor: '#000',
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: userNote.text ? colors.textPrimary : colors.textSecondary,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={2}
              >
                {userNote.text || 'Share a thought...'}
              </Text>

              {/* Thought tail dots */}
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

            <View style={styles.avatarWrapper}>
              <Avatar
                url={currentUser.avatarUrl}
                name={currentUser.fullName}
                size={64}
                onPress={() => handlePress(onPressYourNote)}
              />
              {!userNote.text && (
                <View style={[styles.plusBadge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
                  <Ionicons name="add" size={14} color="#FFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
            ]}
            numberOfLines={1}
          >
            Your note
          </Text>
        </View>

        {/* Friends Notes */}
        {contactsWithNotes.map((contact) => {
          const note = shortNotes[contact.id];
          return (
            <View key={contact.id} style={styles.itemContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePress(() => onPressFriendNote(contact, note))}
                style={styles.bubbleTouchTarget}
              >
                <View
                  style={[
                    styles.thoughtBubble,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.divider,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textPrimary, textAlign: 'center' },
                    ]}
                    numberOfLines={2}
                  >
                    {note.text}
                  </Text>

                  {/* Thought tail dots */}
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

                <View style={styles.avatarWrapper}>
                  <Avatar
                    url={contact.avatarUrl}
                    name={contact.fullName}
                    size={64}
                    isOnline={contact.isOnline}
                    onPress={() => handlePress(() => onPressFriendNote(contact, note))}
                  />
                </View>
              </TouchableOpacity>

              <Text
                style={[
                  typography.caption,
                  { color: colors.textPrimary, marginTop: 6, textAlign: 'center', maxWidth: 76 },
                ]}
                numberOfLines={1}
              >
                {contact.username.split('.')[0]}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  itemContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  bubbleTouchTarget: {
    alignItems: 'center',
  },
  thoughtBubble: {
    minHeight: 34,
    maxWidth: 86,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tailDot1: {
    position: 'absolute',
    bottom: -4,
    left: 20,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 0.5,
  },
  tailDot2: {
    position: 'absolute',
    bottom: -8,
    left: 14,
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  avatarWrapper: {
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
