import { IStoryService } from './types';
import { useAppStore } from '../store/useAppStore';
import { UserStory, Message } from '../types';

export class StoryService implements IStoryService {
  async getStories(): Promise<UserStory[]> {
    return useAppStore.getState().stories;
  }

  async markStorySeen(storyId: string): Promise<void> {
    return useAppStore.getState().markStorySeen(storyId);
  }

  async replyToStory(storyId: string, text: string): Promise<Message> {
    const story = useAppStore.getState().stories.find((s) => s.id === storyId);
    if (!story) {
      throw new Error(`Story not found: ${storyId}`);
    }
    const convId = await useAppStore.getState().replyToStory(story, text);
    const msgs = useAppStore.getState().messagesByChat[convId] || [];
    return msgs[msgs.length - 1];
  }
}

export const storyService = new StoryService();
