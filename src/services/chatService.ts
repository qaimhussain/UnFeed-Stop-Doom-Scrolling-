import { IChatService } from './types';
import { useAppStore } from '../store/useAppStore';
import { Conversation, Message, User, ShortNote } from '../types';

export class ChatService implements IChatService {
  async getConversations(): Promise<Conversation[]> {
    return useAppStore.getState().conversations;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return useAppStore.getState().messagesByChat[conversationId] || [];
  }

  async sendMessage(conversationId: string, message: Partial<Message>): Promise<Message> {
    return useAppStore.getState().sendMessage(conversationId, {
      text: message.text,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      voiceDuration: message.voiceDuration,
      replyTo: message.replyTo,
    });
  }

  async markAsRead(conversationId: string): Promise<void> {
    return useAppStore.getState().markChatRead(conversationId);
  }

  async toggleMute(conversationId: string): Promise<boolean> {
    const conv = useAppStore.getState().conversations.find((c) => c.id === conversationId);
    await useAppStore.getState().toggleMuteChat(conversationId);
    return !conv?.isMuted;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    return useAppStore.getState().deleteChat(conversationId);
  }

  async reactToMessage(
    conversationId: string,
    messageId: string,
    emoji: string,
    _userId: string
  ): Promise<void> {
    return useAppStore.getState().reactToMessage(conversationId, messageId, emoji);
  }

  async getContacts(): Promise<User[]> {
    return useAppStore.getState().contacts;
  }

  async getShortNotes(): Promise<Record<string, ShortNote>> {
    return useAppStore.getState().shortNotes;
  }

  async updateUserShortNote(text: string): Promise<ShortNote> {
    await useAppStore.getState().updateUserNote(text);
    return useAppStore.getState().userNote;
  }
}

export const chatService = new ChatService();
