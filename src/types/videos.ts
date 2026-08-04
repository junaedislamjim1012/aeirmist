export interface Video {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  videoURL: string;
  caption: string;
  description?: string;
  tags: string[];
  category?: string;
  language?: string;
  visibility?: 'public' | 'private';
  location?: string;
  commentsEnabled?: boolean;
  likesEnabled?: boolean;
  shareEnabled?: boolean;
  downloadEnabled?: boolean;
  embedEnabled?: boolean;
  aspectRatio?: 'short' | 'long' | 'vertical' | 'horizontal' | 'square';
  thumbnailURL?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  isVerified?: boolean;
  viewCount: number;
  createdAt: string;
  likedBy?: string[];
  savedBy?: string[];
}

export interface VideoInteraction {
  videoId: string;
  type: 'like' | 'share' | 'save' | 'comment' | 'watch_complete';
  timestamp: number;
}

