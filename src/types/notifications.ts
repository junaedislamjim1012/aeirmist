
export type NotificationType = 
  | 'like' | 'comment' | 'mention' | 'follow' | 'follow_request' | 'message' | 'call' | 'system' | 'security' | 'trending' | 'milestone'
  // Social
  | 'follow_accept' | 'follow_back' | 'tag' | 'comment_reply' | 'comment_like' | 'post_share' | 'post_save'
  // Message
  | 'message_media' | 'message_voice' | 'message_video' | 'call_missed' | 'video_call_missed' | 'store_message'
  // Stories
  | 'story_reply' | 'story_react' | 'story_mention' | 'story_share' | 'ngl_story_reply'
  // Videos
  | 'video_milestone' | 'video_comment' | 'video_comment_reply' | 'video_share' | 'video_save' | 'video_follower'
  // Marketplace
  | 'store_follow' | 'review_new' | 'store_review' | 'product_like' | 'product_save' | 'product_report' | 'stock_low' | 'product_comment'
  // NGL & System
  | 'ngl_message' | 'ngl_reply' | 'verification' | 'username_change' | 'password_change' | 'security_login' | 'profile_update';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  message?: string; // For backend messages
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  user?: {
    name: string;
    avatar: string;
    isVerified?: boolean;
    isPro?: boolean;
  };
  metadata?: {
    postId?: string;
    postImage?: string;
    count?: number; // For grouping (e.g. "12 others")
    groupUsers?: { name: string; avatar: string }[];
    actionLabel?: string;
    isAcceptable?: boolean;
  };
}

export interface ActivitySummary {
  period: string;
  totalInteractions: number;
  topPostId?: string;
  highlights: string[];
}
