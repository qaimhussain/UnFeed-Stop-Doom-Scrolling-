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
  ScrollView,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { PersonalNote, NoteBlock, NoteBlockType } from '../../types';
import { GlassSurface } from '../focus/GlassSurface';
import { FormattedText } from './FormattedText';

function parseTextToBlocks(text: string): NoteBlock[] {
  if (!text) {
    return [{ id: `blk_${Date.now()}`, type: 'paragraph', text: '' }];
  }
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[x] ') || trimmed.startsWith('[X] ')) {
      return {
        id: `blk_${Date.now()}_${idx}`,
        type: 'checklist',
        text: trimmed.slice(4),
        checked: true,
      };
    }
    if (trimmed.startsWith('[ ] ')) {
      return {
        id: `blk_${Date.now()}_${idx}`,
        type: 'checklist',
        text: trimmed.slice(4),
        checked: false,
      };
    }
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return {
        id: `blk_${Date.now()}_${idx}`,
        type: 'bullet',
        text: trimmed.slice(2),
      };
    }
    return {
      id: `blk_${Date.now()}_${idx}`,
      type: 'paragraph',
      text: line,
    };
  });
}

interface NoteEditorModalProps {
  visible: boolean;
  note?: PersonalNote | null;
  onClose: () => void;
  onSave: (title: string, content: string, blocks?: NoteBlock[], isPinned?: boolean) => void;
  onDelete?: (id: string) => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  visible,
  note,
  onClose,
  onSave,
  onDelete,
}) => {
  const { colors, typography, spacing, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevNoteId, setPrevNoteId] = useState<string | null>(null);

  if (visible !== prevVisible || (visible && (note?.id ?? null) !== prevNoteId)) {
    setPrevVisible(visible);
    setPrevNoteId(note?.id || null);
    if (note) {
      setTitle(note.title);
      setIsPinned(note.isPinned);
      if (note.blocks && note.blocks.length > 0) {
        setBlocks(note.blocks);
      } else {
        setBlocks(parseTextToBlocks(note.content));
      }
    } else {
      setTitle('');
      setIsPinned(false);
      setBlocks([
        {
          id: 'blk_initial_1',
          type: 'paragraph',
          text: '',
        },
      ]);
    }
  }

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const serializeBlocksToContent = (blks: NoteBlock[]): string => {
    return blks
      .map((b) => {
        if (b.type === 'checklist') {
          return `${b.checked ? '[x]' : '[ ]'} ${b.text}`;
        }
        if (b.type === 'bullet') {
          return `• ${b.text}`;
        }
        return b.text;
      })
      .join('\n');
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const plainContent = serializeBlocksToContent(blocks);
    onSave(title, plainContent, blocks, isPinned);
    onClose();
  };

  const handleDeleteNote = () => {
    if (!note || !onDelete) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${title || note.title || 'this note'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            onDelete(note.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleAddBlock = (type: NoteBlockType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const newBlock: NoteBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      text: '',
      checked: type === 'checklist' ? false : undefined,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setActiveBlockId(newBlock.id);
  };

  const handleUpdateBlockText = (id: string, text: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, text } : b))
    );
  };

  const handleToggleChecklist = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, checked: !b.checked } : b))
    );
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) return; // Keep at least one block
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleInsertBold = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            text: b.text ? `${b.text} **bold text**` : '**bold text**',
          };
        }
        return b;
      })
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            {note ? 'Edit Note' : 'New Note'}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {note && onDelete && (
              <TouchableOpacity
                onPress={handleDeleteNote}
                style={[styles.headerBtn, { marginRight: 8 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Delete note"
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
              <Text style={[typography.bodyBold, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={[styles.content, { padding: spacing.base }]}>
            {/* Title Input */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.titleInput,
                typography.h2,
                { color: colors.textPrimary },
              ]}
            />

            {/* Pinned toggle pill */}
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }
                setIsPinned(!isPinned);
              }}
              style={[
                styles.pinToggle,
                {
                  backgroundColor: isPinned ? 'rgba(0, 149, 246, 0.12)' : colors.surfaceSecondary,
                  borderColor: isPinned ? colors.accent : colors.divider,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={14}
                color={isPinned ? colors.accent : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  typography.captionBold,
                  { color: isPinned ? colors.accent : colors.textSecondary },
                ]}
              >
                {isPinned ? 'Pinned note' : 'Pin note'}
              </Text>
            </TouchableOpacity>

            {/* Block-based Note Canvas */}
            <View style={styles.blocksCanvas}>
              {blocks.map((block) => {
                return (
                  <View key={block.id} style={styles.blockRow}>
                    {/* Block Icon / Prefix */}
                    {block.type === 'checklist' ? (
                      <TouchableOpacity
                        onPress={() => handleToggleChecklist(block.id)}
                        style={styles.checkboxTouch}
                      >
                        <Ionicons
                          name={block.checked ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={block.checked ? colors.accent : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    ) : block.type === 'bullet' ? (
                      <View style={styles.bulletDot}>
                        <Text style={{ color: colors.accent, fontSize: 16 }}>•</Text>
                      </View>
                    ) : (
                      <View style={styles.paragraphHandle}>
                        <Ionicons name="reorder-two-outline" size={16} color={colors.textTertiary} />
                      </View>
                    )}

                    {/* Block Text Input */}
                    <TextInput
                      value={block.text}
                      onChangeText={(txt) => handleUpdateBlockText(block.id, txt)}
                      placeholder={
                        block.type === 'checklist'
                          ? 'Checklist item...'
                          : block.type === 'bullet'
                          ? 'Bullet point...'
                          : 'Paragraph...'
                      }
                      placeholderTextColor={colors.inputPlaceholder}
                      multiline
                      onFocus={() => setActiveBlockId(block.id)}
                      style={[
                        styles.blockInput,
                        typography.body,
                        {
                          color: block.checked ? colors.textSecondary : colors.textPrimary,
                          textDecorationLine: block.checked ? 'line-through' : 'none',
                        },
                      ]}
                    />

                    {/* Delete block */}
                    {blocks.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleDeleteBlock(block.id)}
                        style={styles.deleteBlockBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={16} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {note && onDelete && (
              <TouchableOpacity
                onPress={handleDeleteNote}
                style={[styles.deleteNoteRow, { borderColor: colors.divider }]}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={17} color="#FF3B30" style={{ marginRight: 6 }} />
                <Text style={[typography.bodyMedium, { color: '#FF3B30', fontWeight: '600' }]}>
                  Delete Note
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Block Creation & Formatting Floating Toolbar */}
          <GlassSurface
            borderRadius={20}
            elevation={6}
            style={styles.floatingToolbar}
          >
            <View style={styles.toolbarInner}>
              <TouchableOpacity
                onPress={() => handleAddBlock('paragraph')}
                style={styles.toolBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
                <Text style={[typography.footnote, { color: colors.textPrimary, marginLeft: 4 }]}>
                  Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAddBlock('bullet')}
                style={styles.toolBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="list-outline" size={18} color={colors.textPrimary} />
                <Text style={[typography.footnote, { color: colors.textPrimary, marginLeft: 4 }]}>
                  Bullet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAddBlock('checklist')}
                style={styles.toolBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="checkbox-outline" size={18} color={colors.textPrimary} />
                <Text style={[typography.footnote, { color: colors.textPrimary, marginLeft: 4 }]}>
                  Task
                </Text>
              </TouchableOpacity>

              <View style={[styles.toolDivider, { backgroundColor: colors.divider }]} />

              <TouchableOpacity
                onPress={() => activeBlockId && handleInsertBold(activeBlockId)}
                style={styles.toolBtn}
                activeOpacity={0.7}
              >
                <Text style={[typography.bodyBold, { color: colors.accent }]}>**B**</Text>
              </TouchableOpacity>
            </View>
          </GlassSurface>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: 6,
  },
  content: {
    paddingBottom: 100,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 20,
  },
  blocksCanvas: {
    gap: 12,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouch: {
    paddingTop: 3,
    paddingRight: 8,
  },
  bulletDot: {
    width: 20,
    paddingTop: 2,
    alignItems: 'center',
  },
  paragraphHandle: {
    width: 20,
    paddingTop: 5,
    alignItems: 'center',
  },
  blockInput: {
    flex: 1,
    paddingVertical: 2,
    fontSize: 15,
    lineHeight: 22,
  },
  deleteBlockBtn: {
    padding: 4,
    marginLeft: 4,
  },
  floatingToolbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 50,
  },
  toolbarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  toolDivider: {
    width: 1,
    height: 20,
  },
  deleteNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
  },
});
