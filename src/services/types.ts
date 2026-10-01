import {
  User,
  ShortNote,
  Conversation,
  Message,
  UserStory,
  Collection,
  SavedItem,
  PersonalNote,
  NoteBlock,
  FocusSettings,
} from '../types';

export interface IChatService {
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, message: Partial<Message>): Promise<Message>;
  markAsRead(conversationId: string): Promise<void>;
  toggleMute(conversationId: string): Promise<boolean>;
  deleteConversation(conversationId: string): Promise<void>;
  reactToMessage(conversationId: string, messageId: string, emoji: string, userId: string): Promise<void>;
  getContacts(): Promise<User[]>;
  getShortNotes(): Promise<Record<string, ShortNote>>;
  updateUserShortNote(text: string): Promise<ShortNote>;
}

export interface IStoryService {
  getStories(): Promise<UserStory[]>;
  markStorySeen(storyId: string): Promise<void>;
  replyToStory(storyId: string, text: string): Promise<Message>;
}

export interface ISavedService {
  getCollections(): Promise<Collection[]>;
  getSavedItems(collectionId?: string): Promise<SavedItem[]>;
  createCollection(name: string): Promise<Collection>;
  renameCollection(id: string, newName: string): Promise<void>;
  deleteCollection(id: string): Promise<void>;
  removeSavedItem(itemId: string): Promise<void>;
  toggleSaveItem(item: SavedItem): Promise<boolean>;
  moveItemToCollection(itemId: string, collectionId: string): Promise<void>;
}

export interface INotesService {
  getNotes(): Promise<PersonalNote[]>;
  createNote(title: string, content: string, blocks?: NoteBlock[], isPinned?: boolean): Promise<PersonalNote>;
  updateNote(id: string, updates: Partial<PersonalNote>): Promise<PersonalNote>;
  deleteNote(id: string): Promise<void>;
  togglePin(id: string): Promise<boolean>;
}

export interface IStorageService {
  getItem<T>(key: string, defaultValue: T): Promise<T>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}
