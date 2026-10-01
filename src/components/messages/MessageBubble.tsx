import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Message } from '../../types';
import { VoiceMessageUI } from './VoiceMessageUI';
import { SharedPostCard } from './SharedPostCard';
import { ReactionPicker } from './ReactionPicker';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface MessageBubbleProps {
  message: Message;
  isLastInGroup?: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLastInGroup = false,
  onReply,
  onReact,
}) => {
  const { colors, typography, spacing } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const isMe = message.senderId === 'current_user';

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setShowPicker(true);
  };

  const handleSelectReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
  };

  const reactionEntries = Object.entries(message.reactions || {}).filter(
    ([_, users]) => users.length > 0
  );

  return (
    <View
      style={[
        styles.wrapper,
        isMe ? styles.wrapperMe : styles.wrapperOther,
        { marginBottom: isLastInGroup ? 8 : 3 },
      ]}
    >
      {/* Reaction Picker Popover */}
      {showPicker && (
        <View style={[styles.pickerContainer, isMe ? { right: 0 } : { left: 0 }]}>
          <ReactionPicker
            onSelectReaction={handleSelectReaction}
            onDismiss={() => setShowPicker(false)}
            selectedEmojis={
              reactionEntries
                .filter(([_, users]) => users.includes('current_user'))
                .map(([emoji]) => emoji)
            }
          />
        </View>
      )}

      {/* Bubble Content */}
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        delayLongPress={280}
        onPress={() => {
          if (showPicker) setShowPicker(false);
        }}
        style={styles.bubbleTouchable}
      >
        {/* Reply Preview Header if replying */}
        {message.replyTo && (
          <View
            style={[
              styles.replyHeader,
              {
                backgroundColor: isMe ? 'rgba(0, 0, 0, 0.15)' : colors.divider,
                borderLeftColor: isMe ? '#FFFFFF' : colors.accent,
              },
            ]}
          >
            <Text
              style={[
                typography.captionBold,
                { color: isMe ? '#FFFFFF' : colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              Replying to {message.replyTo.senderName}
            </Text>
            <Text
              style={[
                typography.caption,
                { color: isMe ? 'rgba(255, 255, 255, 0.85)' : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {message.replyTo.text}
            </Text>
          </View>
        )}

        {/* Message Body */}
        {isMe ? (
          <LinearGradient
            colors={colors.sentBubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.bubble,
              styles.bubbleSent,
              message.replyTo && styles.bubbleWithReply,
            ]}
          >
            {message.mediaType === 'image' && message.mediaUrl && (
              <ImageWithFallback uri={message.mediaUrl} style={styles.image} fallbackIcon="image-outline" />
            )}

            {message.mediaType === 'voice' && (
              <VoiceMessageUI duration={message.voiceDuration || 15} isSentByMe={true} />
            )}

            {message.mediaType === 'shared_post' && message.sharedPost && (
              <SharedPostCard post={message.sharedPost} isSentByMe={true} />
            )}

            {message.text && (
              <Text style={[typography.body, { color: colors.sentBubbleText }]}>
                {message.text}
              </Text>
            )}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.bubble,
              styles.bubbleReceived,
              { backgroundColor: colors.receivedBubble },
              message.replyTo && styles.bubbleWithReply,
            ]}
          >
            {message.mediaType === 'image' && message.mediaUrl && (
              <ImageWithFallback uri={message.mediaUrl} style={styles.image} fallbackIcon="image-outline" />
            )}

            {message.mediaType === 'voice' && (
              <VoiceMessageUI duration={message.voiceDuration || 15} isSentByMe={false} />
            )}

            {message.mediaType === 'shared_post' && message.sharedPost && (
              <SharedPostCard post={message.sharedPost} isSentByMe={false} />
            )}

            {message.text && (
              <Text style={[typography.body, { color: colors.receivedBubbleText }]}>
                {message.text}
              </Text>
            )}
          </View>
        )}

        {/* Reaction Badges on Bubble */}
        {reactionEntries.length > 0 && (
          <View
            style={[
              styles.reactionsRow,
              isMe ? styles.reactionsMe : styles.reactionsOther,
              {
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
          >
            {reactionEntries.map(([emoji, users]) => (
              <View key={emoji} style={styles.reactionPill}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {users.length > 1 && (
                  <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 2 }]}>
                    {users.length}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Meta row: timestamp & seen */}
      {isLastInGroup && (
        <View style={[styles.metaRow, isMe ? styles.metaMe : styles.metaOther]}>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {message.createdAt}
          </Text>
          {isMe && message.isSeen && (
            <Text style={[typography.footnote, { color: colors.textSecondary, marginLeft: 4 }]}>
              • Seen
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '78%',
    position: 'relative',
  },
  wrapperMe: {
    alignSelf: 'flex-end',
  },
  wrapperOther: {
    alignSelf: 'flex-start',
  },
  pickerContainer: {
    position: 'absolute',
    top: -46,
    zIndex: 999,
  },
  bubbleTouchable: {
    position: 'relative',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleSent: {
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    borderBottomLeftRadius: 4,
  },
  bubbleWithReply: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  replyHeader: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderLeftWidth: 3,
    marginBottom: -2,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 4,
    resizeMode: 'cover',
  },
  reactionsRow: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0.5,
    elevation: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reactionsMe: {
    right: 8,
  },
  reactionsOther: {
    left: 8,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  metaMe: {
    justifyContent: 'flex-end',
  },
  metaOther: {
    justifyContent: 'flex-start',
  },
});
