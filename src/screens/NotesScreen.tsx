import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/common/Header';
import { SearchBar } from '../components/common/SearchBar';
import { NoteItem } from '../components/notes/NoteItem';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import { ShortNoteModal } from '../components/notes/ShortNoteModal';
import { CaughtUpNotice } from '../components/common/CaughtUpNotice';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/Avatar';
import { SessionTimerIndicator } from '../components/focus/SessionTimerIndicator';
import { PersonalNote } from '../types';

interface NotesScreenProps {
  navigation: any;
}

export const NotesScreen: React.FC<NotesScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark, spacing } = useTheme();
  const personalNotes = useAppStore((state) => state.personalNotes);
  const currentUser = useAppStore((state) => state.currentUser);
  const userNote = useAppStore((state) => state.userNote);
  const createNote = useAppStore((state) => state.createNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const togglePinNote = useAppStore((state) => state.togglePinNote);
  const updateUserNote = useAppStore((state) => state.updateUserNote);

  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [isNewNoteModalVisible, setIsNewNoteModalVisible] = useState(false);
  const [isShortNoteModalVisible, setIsShortNoteModalVisible] = useState(false);

  // Clearance so notes list footer is never hidden behind floating tab bar
  const bottomTabBarClearance = 50 + Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16) + 16;

  // Separate pinned and unpinned notes
  const filteredNotes = personalNotes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handleCreateNew = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setEditingNote(null);
    setIsNewNoteModalVisible(true);
  };

  const handleEditNote = (note: PersonalNote) => {
    setEditingNote(note);
    setIsNewNoteModalVisible(true);
  };

  const renderHeader = () => (
    <View>
      {/* 24h DM Short Note Card Banner */}
      <View
        style={[
          styles.shortNoteCard,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.divider,
            marginHorizontal: spacing.base,
            marginTop: spacing.sm,
            marginBottom: spacing.xs,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsShortNoteModalVisible(true)}
          style={styles.shortNoteContent}
          activeOpacity={0.8}
        >
          <Avatar url={currentUser.avatarUrl} name={currentUser.fullName} size={44} />

          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={styles.shortNoteTop}>
              <Text style={[typography.captionBold, { color: colors.textPrimary }]}>
                24h Status Note
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Visible in DMs
              </Text>
            </View>

            <Text
              style={[
                typography.bodyMedium,
                { color: userNote.text ? colors.accent : colors.textSecondary, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {userNote.text || 'Tap to share a thought with friends...'}
            </Text>
          </View>

          <Ionicons name="pencil" size={18} color={colors.textSecondary} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Timer Bar */}
      <View style={[styles.timerRow, { borderBottomColor: colors.divider }]}>
        <Text style={[typography.captionBold, { color: colors.textSecondary }]}>
          PERSONAL NOTES & THOUGHTS ({sortedNotes.length})
        </Text>
        <SessionTimerIndicator />
      </View>

      {/* Search Bar */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search personal notes"
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header
        title="Notes"
        rightActions={[
          {
            icon: 'add-outline',
            onPress: handleCreateNew,
          },
        ]}
      />

      {/* Notes List */}
      <FlatList
        data={sortedNotes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.base }}>
            <NoteItem
              note={item}
              onPress={() => handleEditNote(item)}
              onTogglePin={() => togglePinNote(item.id)}
              onDelete={() => deleteNote(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          search.trim().length > 0 ? (
            <EmptyState
              icon="search-outline"
              title="No notes found"
              description={`No notes matching "${search}".`}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="Your personal quiet space"
              description="Capture reflections, checklists, and ideas without algorithmic noise."
              actionLabel="Write a note"
              onAction={handleCreateNew}
            />
          )
        }
        ListFooterComponent={
          sortedNotes.length > 0 ? (
            <CaughtUpNotice subtitle="All personal notes displayed. Encrypted and stored locally." />
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomTabBarClearance + 24 }]}
      />

      {/* Note Editor Modal */}
      <NoteEditorModal
        visible={isNewNoteModalVisible}
        note={editingNote}
        onClose={() => {
          setIsNewNoteModalVisible(false);
          setEditingNote(null);
        }}
        onSave={(title, content, blocks, isPinned) => {
          if (editingNote) {
            updateNote(editingNote.id, { title, content, blocks, isPinned });
          } else {
            createNote(title, content, blocks, isPinned);
          }
        }}
        onDelete={(id) => deleteNote(id)}
      />

      {/* Short Note Modal for 24h DM Bubble */}
      <ShortNoteModal
        visible={isShortNoteModalVisible}
        currentUser={currentUser}
        initialText={userNote.text}
        onClose={() => setIsShortNoteModalVisible(false)}
        onSave={(text) => updateUserNote(text)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shortNoteCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 12,
  },
  shortNoteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortNoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  listContent: {
    paddingBottom: 32,
  },
});
