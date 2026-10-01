import { ISavedService } from './types';
import { useAppStore } from '../store/useAppStore';
import { Collection, SavedItem } from '../types';

export class SavedService implements ISavedService {
  async getCollections(): Promise<Collection[]> {
    return useAppStore.getState().collections;
  }

  async getSavedItems(collectionId?: string): Promise<SavedItem[]> {
    const items = useAppStore.getState().savedItems;
    if (!collectionId || collectionId === 'col_all') {
      return items;
    }
    return items.filter((item) => item.collectionIds.includes(collectionId));
  }

  async createCollection(name: string): Promise<Collection> {
    return useAppStore.getState().createCollection(name);
  }

  async renameCollection(id: string, newName: string): Promise<void> {
    return useAppStore.getState().renameCollection(id, newName);
  }

  async deleteCollection(id: string): Promise<void> {
    return useAppStore.getState().deleteCollection(id);
  }

  async removeSavedItem(itemId: string): Promise<void> {
    return useAppStore.getState().removeSavedItem(itemId);
  }

  async toggleSaveItem(item: SavedItem): Promise<boolean> {
    return useAppStore.getState().toggleSaveItem(item);
  }

  async moveItemToCollection(itemId: string, collectionId: string): Promise<void> {
    return useAppStore.getState().moveItemToCollection(itemId, collectionId);
  }
}

export const savedService = new SavedService();
