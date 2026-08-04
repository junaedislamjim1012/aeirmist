import { openDB, IDBPDatabase } from 'idb';

interface AeirmistDBSchema {
  messages: {
    key: string;
    value: {
      id: string;
      conversationId: string;
      senderId: string;
      text: string;
      type: string;
      mediaUrl?: string;
      timestamp: number;
      metadata?: any;
    };
    indexes: { 'by-conversation': string };
  };
  media: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
      type: string;
    };
  };
  conversations: {
    key: string;
    value: any;
  };
  pending_uploads: {
    key: string;
    value: {
      id: string;
      path: string;
      blob: Blob;
      timestamp: number;
    };
  };
}

const DB_NAME = 'aeirmist_vault';
const DB_VERSION = 2;

class CacheService {
  private db: Promise<IDBPDatabase<AeirmistDBSchema>>;

  constructor() {
    this.db = openDB<AeirmistDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Messages store
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('by-conversation', 'conversationId');

          // Media store (for offline/caching images/videos)
          db.createObjectStore('media', { keyPath: 'url' });

          // Conversations store
          db.createObjectStore('conversations', { keyPath: 'id' });
        }

        if (oldVersion < 2) {
          // Pending uploads store
          db.createObjectStore('pending_uploads', { keyPath: 'id' });
        }
      },
    });
  }

  async saveMessage(message: any) {
    const db = await this.db;
    return db.put('messages', {
      ...message,
      timestamp: message.timestamp?.toMillis ? message.timestamp.toMillis() : (message.timestamp || Date.now())
    });
  }

  async getMessages(conversationId: string) {
    const db = await this.db;
    return db.getAllFromIndex('messages', 'by-conversation', conversationId);
  }

  async saveMedia(url: string, blob: Blob, type: string) {
    const db = await this.db;
    return db.put('media', {
      url,
      blob,
      type,
      timestamp: Date.now()
    });
  }

  async getMedia(url: string) {
    const db = await this.db;
    const item = await db.get('media', url);
    if (!item) return null;
    
    // Auto-cleanup if older than 7 days (optional logic here)
    return item.blob;
  }

  async clearOldCache() {
    const db = await this.db;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Simple cleanup for media
    const tx = db.transaction('media', 'readwrite');
    let cursor = await tx.store.openCursor();
    while (cursor) {
      if (cursor.value.timestamp < sevenDaysAgo) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  }

  async saveConversation(conv: any) {
    const db = await this.db;
    return db.put('conversations', conv);
  }

  async getConversations() {
    const db = await this.db;
    return db.getAll('conversations');
  }

  async clearAll() {
    const db = await this.db;
    await db.clear('messages');
    await db.clear('media');
    await db.clear('conversations');
    await db.clear('pending_uploads');
  }

  async savePendingUpload(id: string, path: string, blob: Blob) {
    const db = await this.db;
    return db.put('pending_uploads', {
      id,
      path,
      blob,
      timestamp: Date.now()
    });
  }

  async getPendingUploads() {
    const db = await this.db;
    return db.getAll('pending_uploads');
  }

  async removePendingUpload(id: string) {
    const db = await this.db;
    return db.delete('pending_uploads', id);
  }
}

export const aeirmistCache = new CacheService();
