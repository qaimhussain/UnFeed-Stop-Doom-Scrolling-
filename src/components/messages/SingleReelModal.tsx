import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InstagramWebView } from '../webview/InstagramWebView';
import { GlassSurface } from '../common/GlassSurface';
import { useTheme } from '../../theme/ThemeContext';

interface SingleReelModalProps {
  visible: boolean;
  url: string | null;
  onClose: () => void;
}

export const SingleReelModal: React.FC<SingleReelModalProps> = ({
  visible,
  url,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();

  // Android Back Handler to close modal
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible || !url) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Floating Glass Back to Chat Button */}
        <View style={[styles.headerBar, { top: Math.max(insets.top, 12) }]} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.backButtonTouch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <GlassSurface
              useRealBlur={true}
              blurIntensity={50}
              borderRadius={20}
              elevation={6}
              style={styles.backButtonGlass}
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
                Back to Chat
              </Text>
            </GlassSurface>
          </TouchableOpacity>
        </View>

        {/* Isolated Single Reel WebView with Swipe Blocking */}
        <InstagramWebView
          initialUrl={url}
          fallbackUrl={url}
          isFromDM={true}
          style={styles.webView}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBar: {
    position: 'absolute',
    left: 14,
    zIndex: 100,
  },
  backButtonTouch: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
