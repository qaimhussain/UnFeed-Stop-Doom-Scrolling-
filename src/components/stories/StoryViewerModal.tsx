import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UserStory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { STORY_DAILY_LIMIT_SECONDS, STORY_TIME_CONFIG } from '../../config/storyTimeConfig';
import { storyTimeService } from '../../services/storyTimeService';
import { GlassSurface } from '../focus/GlassSurface';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface StoryViewerModalProps {
  visible: boolean;
  stories: UserStory[];
  initialIndex: number;
  onClose: () => void;
  onNavigateToChat?: (conversationId: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_DURATION = 5000; // 5 seconds per slide
const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😂', '😮', '😢'];

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  visible,
  stories,
  initialIndex,
  onClose,
  onNavigateToChat,
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [reactionSent, setReactionSent] = useState<string | null>(null);

  const markStorySeen = useAppStore((state) => state.markStorySeen);
  const replyToStory = useAppStore((state) => state.replyToStory);
  const storyTimeUsage = useAppStore((state) => state.storyTimeUsage);
  const startStoryViewingSession = useAppStore((state) => state.startStoryViewingSession);
  const pauseStoryViewingSession = useAppStore((state) => state.pauseStoryViewingSession);
  const resumeStoryViewingSession = useAppStore((state) => state.resumeStoryViewingSession);
  const endStoryViewingSession = useAppStore((state) => state.endStoryViewingSession);

  const [progressAnim] = useState(() => new Animated.Value(0));
  const currentProgress = useRef(0);
  const [translateY] = useState(() => new Animated.Value(0));

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  // Track story viewing session start / end
  useEffect(() => {
    if (visible) {
      startStoryViewingSession();
    }
    return () => {
      endStoryViewingSession();
    };
  }, [visible]);

  // Pause / resume tracking on press-and-hold
  useEffect(() => {
    if (!visible) return;
    if (isPaused) {
      pauseStoryViewingSession();
    } else {
      resumeStoryViewingSession();
    }
  }, [isPaused, visible]);

  // Story time left calculation (max 20m = 1200s)
  const remainingSeconds = storyTimeService.getRemainingSeconds(storyTimeUsage.secondsUsed);

  // When story limit reaches 0, close viewer immediately and alert user
  useEffect(() => {
    if (visible && remainingSeconds <= 0) {
      endStoryViewingSession();
      onClose();
      Alert.alert(
        "Time's Up",
        "You've used today's story time. See you tomorrow."
      );
    }
  }, [visible, remainingSeconds]);

  // Sync initial index on open
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setCurrentUserIndex(initialIndex);
      setCurrentSlideIndex(0);
    }
  }

  useEffect(() => {
    if (visible) {
      progressAnim.setValue(0);
      currentProgress.current = 0;
      translateY.setValue(0);
    }
  }, [visible, progressAnim, translateY]);

  const currentStory = stories[currentUserIndex];
  const slides = currentStory?.slides || [];
  const currentSlide = slides[currentSlideIndex];

  // Mark story as seen
  useEffect(() => {
    if (visible && currentStory && !currentStory.isSeen) {
      markStorySeen(currentStory.id);
    }
  }, [visible, currentStory, markStorySeen]);

  const goToNextSlide = () => {
    progressAnim.setValue(0);
    currentProgress.current = 0;
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else if (currentUserIndex < stories.length - 1) {
      // Go to next user
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentSlideIndex(0);
    } else {
      // End of all stories
      onClose();
    }
  };

  const goToPrevSlide = () => {
    progressAnim.setValue(0);
    currentProgress.current = 0;
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      // Go to prev user's last slide
      const prevUser = stories[currentUserIndex - 1];
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentSlideIndex(prevUser.slides.length - 1);
    }
  };

  const handleNextUser = () => {
    progressAnim.setValue(0);
    currentProgress.current = 0;
    if (currentUserIndex < stories.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentSlideIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevUser = () => {
    progressAnim.setValue(0);
    currentProgress.current = 0;
    if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentSlideIndex(0);
    }
  };

  // Slide timer animation
  useEffect(() => {
    if (!visible || !currentSlide) return;

    if (isPaused) {
      progressAnim.stopAnimation((val) => {
        currentProgress.current = val;
      });
      return;
    }

    const remainingTime = (1 - currentProgress.current) * SLIDE_DURATION;

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: Math.max(100, remainingTime),
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (finished) {
        goToNextSlide();
      }
    });

    return () => {
      anim.stop();
    };
  }, [visible, currentUserIndex, currentSlideIndex, isPaused, currentSlide, progressAnim]);

  // Gestures for swipe down to close (spring physics, scale & corner rounding)
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 12 || Math.abs(gestureState.dx) > 30;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          // Swipe down to close with spring physics (damping: 18, stiffness: 180)
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          Animated.spring(translateY, {
            toValue: SCREEN_HEIGHT,
            damping: 18,
            stiffness: 180,
            useNativeDriver: false,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else if (gestureState.dx < -80) {
          // Swipe left -> Next user
          handleNextUser();
          translateY.setValue(0);
        } else if (gestureState.dx > 80) {
          // Swipe right -> Prev user
          handlePrevUser();
          translateY.setValue(0);
        } else {
          // Reset with spring physics
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 180,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  );

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const textToSend = replyText;
    setReplyText('');
    const convId = await replyToStory(currentStory, textToSend);
    onClose();
    if (onNavigateToChat) {
      onNavigateToChat(convId);
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    if (!currentStory) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setReactionSent(emoji);
    await replyToStory(currentStory, `Reacted ${emoji} to your story`);
    setTimeout(() => {
      setReactionSent(null);
    }, 1500);
  };

  if (!visible || !currentStory || !currentSlide) return null;

  const dragScale = translateY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  const dragBorderRadius = translateY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 32],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }, { scale: dragScale }],
            borderRadius: dragBorderRadius,
            overflow: 'hidden',
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Story Background Media */}
        <ImageWithFallback uri={currentSlide.mediaUrl} style={styles.mediaImage} fallbackIcon="image-outline" />

        {/* Reaction Sent Overlay */}
        {reactionSent && (
          <View style={styles.reactionOverlay}>
            <Text style={styles.reactionOverlayText}>{reactionSent}</Text>
          </View>
        )}

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Progress Bars */}
          <View style={styles.progressContainer}>
            {slides.map((_, idx) => {
              let barWidth: any = '0%';
              if (idx < currentSlideIndex) {
                barWidth = '100%';
              } else if (idx === currentSlideIndex) {
                barWidth = progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                });
              }

              return (
                <View key={idx} style={styles.progressBarBackground}>
                  <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
                </View>
              );
            })}
          </View>

          {/* Top User Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <ImageWithFallback uri={currentStory.user.avatarUrl} style={styles.avatar} fallbackText={currentStory.user.username} />
              <Text style={styles.username}>{currentStory.user.username}</Text>
              <Text style={styles.timeAgo}>{currentSlide.timestamp || currentStory.lastUpdated}</Text>
            </View>

            {/* Story Time Left Glass Pill */}
            <GlassSurface
              borderRadius={12}
              style={[
                styles.storyCapBadge,
                remainingSeconds <= 120 && styles.storyCapWarningBadge,
              ]}
            >
              <Ionicons
                name={remainingSeconds <= 120 ? 'warning-outline' : 'hourglass-outline'}
                size={12}
                color={remainingSeconds <= 120 ? '#FA7E1E' : '#FFFFFF'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.storyCapText,
                  remainingSeconds <= 120 && styles.storyCapWarningText,
                ]}
              >
                Story time left: {storyTimeService.formatTimeRemaining(remainingSeconds)}
              </Text>
            </GlassSurface>


            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Tap Navigation Zones (Left 30%, Right 70%) & Hold to Pause */}
          <View style={styles.touchAreaContainer}>
            {/* Left Tap: Previous Slide */}
            <TouchableOpacity
              activeOpacity={1}
              style={styles.touchLeft}
              onPress={goToPrevSlide}
              onPressIn={() => setIsPaused(true)}
              onPressOut={() => setIsPaused(false)}
            />

            {/* Right Tap: Next Slide */}
            <TouchableOpacity
              activeOpacity={1}
              style={styles.touchRight}
              onPress={goToNextSlide}
              onPressIn={() => setIsPaused(true)}
              onPressOut={() => setIsPaused(false)}
            />
          </View>

          {/* Slide Caption if any */}
          {currentSlide.caption && (
            <View style={styles.captionContainer}>
              <Text style={styles.captionText}>{currentSlide.caption}</Text>
            </View>
          )}

          {/* Bottom Interactive Bar (Quick Emojis + Direct Reply Input) */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.bottomBar}
          >
            {/* Quick emoji reactions */}
            <View style={styles.quickEmojiRow}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleQuickReaction(emoji)}
                  style={styles.emojiPill}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Real Blur Glass Reply Input */}
            <GlassSurface
              useRealBlur={true}
              blurIntensity={65}
              borderRadius={24}
              elevation={4}
              style={styles.replyGlassSurface}
            >
              <View style={styles.inputRow}>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder={`Reply to ${currentStory.user.username}...`}
                  placeholderTextColor="rgba(255, 255, 255, 0.75)"
                  style={styles.replyInput}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  returnKeyType="send"
                  onSubmitEditing={handleSendReply}
                />
                {replyText.trim().length > 0 && (
                  <TouchableOpacity onPress={handleSendReply} style={styles.sendBtn}>
                    <Ionicons name="send" size={20} color="#0095F6" />
                  </TouchableOpacity>
                )}
              </View>
            </GlassSurface>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 10,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  touchAreaContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  touchLeft: {
    width: '30%',
    height: '100%',
  },
  touchRight: {
    width: '70%',
    height: '100%',
  },
  captionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  quickEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  emojiPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  quickEmojiText: {
    fontSize: 22,
  },
  replyGlassSurface: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  replyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  sendBtn: {
    marginLeft: 8,
    padding: 4,
  },
  reactionOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 99,
  },
  reactionOverlayText: {
    fontSize: 72,
  },
  storyCapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  storyCapWarningBadge: {
    backgroundColor: 'rgba(250, 126, 30, 0.3)',
    borderColor: '#FA7E1E',
  },
  storyCapText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  storyCapWarningText: {
    color: '#FA7E1E',
    fontWeight: '700',
  },
});
