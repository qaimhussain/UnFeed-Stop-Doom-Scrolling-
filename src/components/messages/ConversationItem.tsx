import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Avatar } from '../common/Avatar';
import { Conversation, UserStory } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  hasStory?: boolean;
  storyIsSeen?: boolean;
  onPress: () => void;
  onMute: () => void;
  onDelete: () => void;
  onAvatarPress?: () => void;
}

const ACTION_WIDTH = 140;

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  hasStory = false,
  storyIsSeen = false,
  onPress,
  onMute,
  onDelete,
  onAvatarPress,
}) => {
  const { colors, typography, spacing } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Swiping left
          translateX.setValue(Math.max(-ACTION_WIDTH, gestureState.dx));
        } else if (isOpen && gestureState.dx > 0) {
          // Closing from open state
          translateX.setValue(-ACTION_WIDTH + gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Open
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          setIsOpen(true);
        } else {
          // Close
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          setIsOpen(false);
        }
      },
    })
  ).current;

  const closeActions = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setIsOpen(false);
  };

  const handleMute = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    closeActions();
    onMute();
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    closeActions();
    onDelete();
  };

  const handlePress = () => {
    if (isOpen) {
      closeActions();
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  // Determine last message text preview
  const lastMsg = conversation.lastMessage;
  let previewText = 'No messages yet';
  if (lastMsg) {
    if (lastMsg.mediaType === 'image') {
      previewText = 'Sent a photo';
    } else if (lastMsg.mediaType === 'voice') {
      previewText = `Voice message (${lastMsg.voiceDuration || 15}s)`;
    } else if (lastMsg.mediaType === 'shared_post') {
      previewText = 'Shared a post';
    } else if (lastMsg.text) {
      previewText = lastMsg.text;
    }
  }

  const isUnread = conversation.unreadCount > 0;

  return (
    <View style={styles.outerContainer}>
      {/* Background Swipe Actions */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          onPress={handleMute}
          style={[styles.actionBtn, { backgroundColor: '#555555' }]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={conversation.isMuted ? 'notifications-outline' : 'notifications-off-outline'}
            size={22}
            color="#FFFFFF"
          />
          <Text style={[typography.captionMedium, styles.actionText]}>
            {conversation.isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.actionBtn, { backgroundColor: colors.destructive }]}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={[typography.captionMedium, styles.actionText]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground Row with PanResponder */}
      <Animated.View
        style={[
          styles.row,
          {
            backgroundColor: colors.background,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.md,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          style={styles.touchArea}
        >
          {/* Avatar with optional story ring */}
          <Avatar
            url={conversation.participant.avatarUrl}
            name={conversation.participant.fullName}
            size={56}
            hasStory={hasStory}
            isSeen={storyIsSeen}
            isOnline={conversation.participant.isOnline}
            onPress={onAvatarPress}
          />

          {/* Details */}
          <View style={[styles.info, { marginLeft: spacing.md }]}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  isUnread ? typography.bodyBold : typography.bodyMedium,
                  { color: colors.textPrimary, flexShrink: 1 },
                ]}
                numberOfLines={1}
              >
                {conversation.participant.fullName}
              </Text>
              {conversation.participant.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.accent}
                  style={styles.verified}
                />
              )}
              {conversation.isMuted && (
                <Ionicons
                  name="volume-mute-outline"
                  size={14}
                  color={colors.textSecondary}
                  style={styles.mutedIcon}
                />
              )}
            </View>

            <View style={styles.messageRow}>
              <Text
                style={[
                  isUnread ? typography.bodyBold : typography.body,
                  {
                    color: isUnread ? colors.textPrimary : colors.textSecondary,
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {lastMsg?.senderId === 'current_user' && 'You: '}
                {previewText}
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textSecondary,
                    marginLeft: 6,
                  },
                ]}
              >
                • {conversation.updatedAt}
              </Text>
            </View>
          </View>

          {/* Unread Blue Dot */}
          {isUnread && (
            <View
              style={[
                styles.unreadDot,
                { backgroundColor: colors.accent },
              ]}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
  },
  actionBtn: {
    width: ACTION_WIDTH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    marginTop: 4,
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  touchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verified: {
    marginLeft: 4,
  },
  mutedIcon: {
    marginLeft: 6,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
