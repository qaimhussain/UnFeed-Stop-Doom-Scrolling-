import { INotesService } from './types';
import { useAppStore } from '../store/useAppStore';
import { PersonalNote, NoteBlock } from '../types';

export class NotesService implements INotesService {
  async getNotes(): Promise<PersonalNote[]> {
    return useAppStore.getState().personalNotes;
  }

  async createNote(title: string, content: string, blocks?: NoteBlock[], isPinned = false): Promise<PersonalNote> {
    return useAppStore.getState().createNote(title, content, blocks, isPinned);
  }

  async updateNote(id: string, updates: Partial<PersonalNote>): Promise<PersonalNote> {
    await useAppStore.getState().updateNote(id, updates);
    const updated = useAppStore.getState().personalNotes.find((n) => n.id === id);
    if (!updated) throw new Error(`Note not found: ${id}`);
    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    return useAppStore.getState().deleteNote(id);
  }

  async togglePin(id: string): Promise<boolean> {
    const note = useAppStore.getState().personalNotes.find((n) => n.id === id);
    await useAppStore.getState().togglePinNote(id);
    return !note?.isPinned;
  }
}

export const notesService = new NotesService();
