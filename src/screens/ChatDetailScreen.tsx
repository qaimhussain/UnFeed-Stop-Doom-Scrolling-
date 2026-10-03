import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Avatar } from '../components/common/Avatar';
import { MessageBubble } from '../components/messages/MessageBubble';
import { GlassSurface } from '../components/focus/GlassSurface';
import { Message } from '../types';

interface ChatDetailScreenProps {
  route: {
    params: {
      conversationId: string;
    };
  };
  navigation: any;
}

export const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { conversationId } = route.params;
  const { colors, typography, spacing } = useTheme();

  const conversation = useAppStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );
  const messages = useAppStore((state) => state.messagesByChat[conversationId] || []);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const markChatRead = useAppStore((state) => state.markChatRead);
  const reactToMessage = useAppStore((state) => state.reactToMessage);

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    markChatRead(conversationId);
  }, [conversationId]);

  // Handle Android Back Button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  // Voice recording simulation
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecordingVoice]);

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    const replyMeta = replyingTo
      ? {
          id: replyingTo.id,
          senderName:
            replyingTo.senderId === 'current_user'
              ? 'You'
              : conversation?.participant.fullName || 'User',
          text: replyingTo.text || 'Media',
        }
      : undefined;
    setReplyingTo(null);

    await sendMessage(conversationId, {
      text: textToSend,
      mediaType: 'text',
      replyTo: replyMeta,
    });
  };

  const handleSendPhoto = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    // Deterministic photography seed for simulated photo upload
    const samplePhotos = [
      'https://picsum.photos/seed/chat_photo_1/800/800',
      'https://picsum.photos/seed/chat_photo_2/800/800',
      'https://picsum.photos/seed/chat_photo_3/800/800',
    ];
    const picked = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    await sendMessage(conversationId, {
      mediaUrl: picked,
      mediaType: 'image',
    });
  };

  const handleSendVoice = async () => {
    setIsRecordingVoice(false);
    const duration = Math.max(2, recordDuration);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await sendMessage(conversationId, {
      mediaType: 'voice',
      voiceDuration: duration,
    });
  };

  const cancelRecording = () => {
    setIsRecordingVoice(false);
    setRecordDuration(0);
  };

  if (!conversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Conversation not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[typography.bodyBold, { color: colors.accent }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { participant } = conversation;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              participant.fullName,
              `@${participant.username}\n${participant.isOnline ? 'Active now' : 'Last seen ' + (participant.lastSeen || 'recently')}`
            );
          }}
        >
          <Avatar
            url={participant.avatarUrl}
            name={participant.fullName}
            size={36}
            isOnline={participant.isOnline}
          />
          <View style={{ marginLeft: 10 }}>
            <View style={styles.nameRow}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]} numberOfLines={1}>
                {participant.fullName}
              </Text>
              {participant.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color={colors.accent}
                  style={{ marginLeft: 3 }}
                />
              )}
            </View>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              {participant.isOnline ? 'Active now' : participant.lastSeen || 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => Alert.alert('Voice Call', 'Distraction-free voice calling simulation')}
          >
            <Ionicons name="call-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIcon, { marginLeft: 14 }]}
            onPress={() => Alert.alert('Video Call', 'Direct connection without feeds')}
          >
            <Ionicons name="videocam-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, { paddingHorizontal: spacing.base }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item, index }) => {
          const nextMsg = messages[index + 1];
          const isLastInGroup = !nextMsg || nextMsg.senderId !== item.senderId;

          return (
            <MessageBubble
              message={item}
              isLastInGroup={isLastInGroup}
              onReply={(msg) => setReplyingTo(msg)}
              onReact={(msgId, emoji) => reactToMessage(conversationId, msgId, emoji)}
            />
          );
        }}
      />

      {/* Bottom Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Reply To Bar if present */}
        {replyingTo && (
          <View
            style={[
              styles.replyBar,
              {
                backgroundColor: colors.surfaceSecondary,
                borderTopColor: colors.divider,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.textPrimary }]}>
                Replying to{' '}
                {replyingTo.senderId === 'current_user'
                  ? 'yourself'
                  : participant.fullName}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {replyingTo.text || 'Attachment'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Recording Bar if voice active */}
        {isRecordingVoice ? (
          <View
            style={[
              styles.recordingBar,
              {
                backgroundColor: colors.surfaceSecondary,
                borderTopColor: colors.divider,
              },
            ]}
          >
            <View style={styles.recordLeft}>
              <View style={[styles.redRecordDot, { backgroundColor: colors.destructive }]} />
              <Text style={[typography.bodyBold, { color: colors.destructive, marginLeft: 8 }]}>
                0:{String(recordDuration).padStart(2, '0')}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 12 }]}>
                Recording voice note...
              </Text>
            </View>

            <View style={styles.recordActions}>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelRecordBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendVoice}
                style={[styles.sendRecordBtn, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Normal Input Row inside real blur GlassSurface */
          <GlassSurface
            useRealBlur={true}
            blurIntensity={65}
            borderRadius={0}
            elevation={4}
            style={styles.chatInputGlass}
          >
            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <TouchableOpacity
                onPress={handleSendPhoto}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="image-outline" size={24} color={colors.textPrimary} />
              </TouchableOpacity>

            <View
              style={[
                styles.textInputWrapper,
                {
                  backgroundColor: colors.inputBackground,
                },
              ]}
            >
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                style={[
                  styles.textInput,
                  typography.body,
                  { color: colors.inputText },
                ]}
              />

              <TouchableOpacity
                onPress={() => setIsRecordingVoice(true)}
                style={styles.micBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                onPress={handleSendText}
                style={[styles.sendBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={async () => {
                  await sendMessage(conversationId, { text: '❤️' });
                }}
                style={styles.heartBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="heart-outline" size={24} color={colors.like} />
              </TouchableOpacity>
            )}
          </View>
        </GlassSurface>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backAction: {
    padding: 4,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 4,
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redRecordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelRecordBtn: {
    padding: 8,
    marginRight: 12,
  },
  sendRecordBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInputGlass: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtn: {
    padding: 6,
    marginRight: 6,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    minHeight: 38,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  micBtn: {
    padding: 4,
    marginLeft: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  heartBtn: {
    padding: 6,
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    marginTop: 12,
    padding: 8,
  },
});
