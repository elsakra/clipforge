import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Content, Clip, GeneratedContent, SocialAccount, User } from '@/types';

// User store
interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateUsage: (usage: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  updateUsage: (usage) => set((state) => ({
    user: state.user ? { ...state.user, usageThisMonth: usage } : null,
  })),
}));

// Content store
interface ContentState {
  contents: Content[];
  currentContent: Content | null;
  isLoading: boolean;
  setContents: (contents: Content[]) => void;
  addContent: (content: Content) => void;
  updateContent: (id: string, updates: Partial<Content>) => void;
  removeContent: (id: string) => void;
  setCurrentContent: (content: Content | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useContentStore = create<ContentState>((set) => ({
  contents: [],
  currentContent: null,
  isLoading: false,
  setContents: (contents) => set({ contents }),
  addContent: (content) => set((state) => ({
    contents: [content, ...state.contents],
  })),
  updateContent: (id, updates) => set((state) => ({
    contents: state.contents.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
    currentContent: state.currentContent?.id === id
      ? { ...state.currentContent, ...updates }
      : state.currentContent,
  })),
  removeContent: (id) => set((state) => ({
    contents: state.contents.filter((c) => c.id !== id),
    currentContent: state.currentContent?.id === id ? null : state.currentContent,
  })),
  setCurrentContent: (content) => set({ currentContent: content }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Clips store
interface ClipState {
  clips: Clip[];
  selectedClips: string[];
  isLoading: boolean;
  setClips: (clips: Clip[]) => void;
  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  removeClip: (id: string) => void;
  toggleClipSelection: (id: string) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
}

export const useClipStore = create<ClipState>((set) => ({
  clips: [],
  selectedClips: [],
  isLoading: false,
  setClips: (clips) => set({ clips }),
  addClip: (clip) => set((state) => ({
    clips: [clip, ...state.clips],
  })),
  updateClip: (id, updates) => set((state) => ({
    clips: state.clips.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),
  removeClip: (id) => set((state) => ({
    clips: state.clips.filter((c) => c.id !== id),
    selectedClips: state.selectedClips.filter((clipId) => clipId !== id),
  })),
  toggleClipSelection: (id) => set((state) => ({
    selectedClips: state.selectedClips.includes(id)
      ? state.selectedClips.filter((clipId) => clipId !== id)
      : [...state.selectedClips, id],
  })),
  clearSelection: () => set({ selectedClips: [] }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Generated content store
interface GeneratedContentState {
  generatedContents: GeneratedContent[];
  isLoading: boolean;
  setGeneratedContents: (contents: GeneratedContent[]) => void;
  addGeneratedContent: (content: GeneratedContent) => void;
  updateGeneratedContent: (id: string, updates: Partial<GeneratedContent>) => void;
  removeGeneratedContent: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useGeneratedContentStore = create<GeneratedContentState>((set) => ({
  generatedContents: [],
  isLoading: false,
  setGeneratedContents: (generatedContents) => set({ generatedContents }),
  addGeneratedContent: (content) => set((state) => ({
    generatedContents: [content, ...state.generatedContents],
  })),
  updateGeneratedContent: (id, updates) => set((state) => ({
    generatedContents: state.generatedContents.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),
  removeGeneratedContent: (id) => set((state) => ({
    generatedContents: state.generatedContents.filter((c) => c.id !== id),
  })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Social accounts store
interface SocialAccountState {
  accounts: SocialAccount[];
  isLoading: boolean;
  setAccounts: (accounts: SocialAccount[]) => void;
  addAccount: (account: SocialAccount) => void;
  removeAccount: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useSocialAccountStore = create<SocialAccountState>((set) => ({
  accounts: [],
  isLoading: false,
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((state) => ({
    accounts: [...state.accounts, account],
  })),
  removeAccount: (id) => set((state) => ({
    accounts: state.accounts.filter((a) => a.id !== id),
  })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// UI store with persistence
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed,
      })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'clipforge-ui',
    }
  )
);

// Upload progress store
interface UploadState {
  uploads: Map<string, UploadProgress>;
  addUpload: (id: string, progress: UploadProgress) => void;
  updateUpload: (id: string, updates: Partial<UploadProgress>) => void;
  removeUpload: (id: string) => void;
  clearUploads: () => void;
}

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: new Map(),
  addUpload: (id, progress) => set((state) => {
    const newUploads = new Map(state.uploads);
    newUploads.set(id, progress);
    return { uploads: newUploads };
  }),
  updateUpload: (id, updates) => set((state) => {
    const newUploads = new Map(state.uploads);
    const existing = newUploads.get(id);
    if (existing) {
      newUploads.set(id, { ...existing, ...updates });
    }
    return { uploads: newUploads };
  }),
  removeUpload: (id) => set((state) => {
    const newUploads = new Map(state.uploads);
    newUploads.delete(id);
    return { uploads: newUploads };
  }),
  clearUploads: () => set({ uploads: new Map() }),
}));


