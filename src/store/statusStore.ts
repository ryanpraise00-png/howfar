import { create } from 'zustand';
import { type ApiStatusPost, type ApiFeedContact } from '@/src/services/status';

interface StatusState {
  myStatus: ApiStatusPost[];
  feed: ApiFeedContact[];

  setFeed: (myStatus: ApiStatusPost[], feed: ApiFeedContact[]) => void;
  prependContact: (entry: { userId: string; userName: string; statusId: string }) => void;
  clearFeed: () => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  myStatus: [],
  feed: [],

  setFeed: (myStatus, feed) => set({ myStatus, feed }),

  prependContact: ({ userId, userName }) => {
    // A real-time `status:new` arrived — mark that contact as having new statuses.
    // Full data arrives on next pull-to-refresh; here we just ensure the contact
    // appears in the unviewed section with a placeholder entry.
    set((s) => {
      const existing = s.feed.find((c) => c.user.id === userId);
      if (existing) {
        // Mark existing posts as not-yet-viewed so the ring turns amber
        return {
          feed: s.feed.map((c) =>
            c.user.id === userId
              ? { ...c, posts: c.posts.map((p) => ({ ...p, hasViewed: false })) }
              : c,
          ),
        };
      }
      // Unknown contact — insert a stub (viewer will refresh on open)
      return {
        feed: [
          { user: { id: userId, name: userName, avatarUrl: null }, posts: [] },
          ...s.feed,
        ],
      };
    });
  },

  clearFeed: () => set({ myStatus: [], feed: [] }),
}));
