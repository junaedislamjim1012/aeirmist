import { Timestamp } from 'firebase/firestore';

/**
 * Intelligent relative timestamp formatter for Aeirmist
 * - Within 24h: 2m ago, 3h ago, etc.
 * - Same year: 12 Jun at 6:45 PM
 * - Different year: 12 Jun 2024 at 6:45 PM
 */
export const formatAeirmistTimestamp = (timestamp: any): string => {
  if (!timestamp) return 'Just now';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return 'Just now';
  }

  if (isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  }
  
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleString('default', { hour: 'numeric', minute: '2-digit', hour12: true });

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${time}`;
  }

  if (isSameYear) {
    return `${day} ${month} at ${time}`;
  }

  return `${day} ${month} ${year} at ${time}`;
};

/**
 * Short relative timestamp for messages/comments/seen status
 * e.g. "2m", "3h", "1d"
 */
export const formatShortTimestamp = (timestamp: any): string => {
  if (!timestamp) return 'now';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return 'now';
  }

  if (isNaN(date.getTime())) return 'now';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Formats a timestamp for use as a date separator in chat
 * e.g. "Today", "Yesterday", "June 12"
 */
export const formatDateSeparator = (timestamp: any): string => {
  if (!timestamp) return '';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) return 'Today';
  if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }
  return date.toLocaleDateString('en-US', options);
};

/**
 * Formats a timestamp to show only the time (e.g. "9:50 PM")
 */
export const formatTimeOnly = (timestamp: any): string => {
  if (!timestamp) return '';
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

/**
 * Formatter for active status (e.g. "Active 12 minutes ago")
 */
export const formatActiveStatus = (isOnline: boolean, lastSeen: any, hideExactTime: boolean = false): string => {
  if (isOnline && !hideExactTime) return 'Active now';
  if (hideExactTime) return 'Last seen recently';
  if (!lastSeen) return 'Offline';
  
  const formattedTime = formatAeirmistTimestamp(lastSeen);
  if (formattedTime.includes('ago')) {
    return `Active ${formattedTime}`;
  }
  return `Last seen ${formattedTime}`;
};
