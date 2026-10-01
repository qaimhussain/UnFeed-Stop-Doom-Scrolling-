import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { SearchBar } from '../components/common/SearchBar';
import { Avatar } from '../components/common/Avatar';
import { HairlineDivider } from '../components/common/HairlineDivider';
import { User } from '../types';

interface NewMessageModalProps {
  navigation: any;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const contacts = useAppStore((state) => state.contacts);
  const startConversation = useAppStore((state) => state.startConversation);
  const [search, setSearch] = useState('');

  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
  });

  const handleSelectContact = async (contact: User) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const convId = await startConversation(contact);
    navigation.replace('ChatDetail', { conversationId: convId });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[typography.h3, { color: colors.textPrimary }]}>New message</Text>

        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search contacts"
      />

      <View style={{ paddingHorizontal: spacing.base, paddingVertical: 8 }}>
        <Text style={[typography.captionBold, { color: colors.textSecondary }]}>
          SUGGESTED CONTACTS
        </Text>
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <HairlineDivider insetLeft={64} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelectContact(item)}
            style={[styles.contactRow, { paddingHorizontal: spacing.base }]}
            activeOpacity={0.7}
          >
            <Avatar url={item.avatarUrl} name={item.fullName} size={44} isOnline={item.isOnline} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  {item.fullName}
                </Text>
                {item.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={colors.accent}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                @{item.username}
              </Text>
            </View>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
