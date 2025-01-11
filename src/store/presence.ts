import { createClient } from 'redis';
import { config } from '../config';
import { KV, Presence } from '../types';

class PresenceStore {
  private client;
  private subscribers: Set<(userId: string, presence: Presence) => void>;

  constructor() {
    this.client = createClient({
      url: config.redis.url
    });
    this.subscribers = new Set();
    this.client.connect();
  }

  async setPresence(userId: string, presence: Presence): Promise<void> {
    await this.client.set(`presence:${userId}`, JSON.stringify(presence));
    this.notifySubscribers(userId, presence);
  }

  async getPresence(userId: string): Promise<Presence | null> {
    const data = await this.client.get(`presence:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async setKV(userId: string, key: string, value: string): Promise<void> {
    const presence = await this.getPresence(userId);
    if (!presence) return;

    const kv = presence.kv || [];
    const existingIndex = kv.findIndex(item => item.key === key);
    
    if (existingIndex !== -1) {
      kv[existingIndex].value = value;
    } else {
      kv.push({ key, value });
    }

    presence.kv = kv;
    await this.setPresence(userId, presence);
  }

  async subscribe(callback: (userId: string, presence: Presence) => void): Promise<void> {
    this.subscribers.add(callback);
  }

  async unsubscribe(callback: (userId: string, presence: Presence) => void): Promise<void> {
    this.subscribers.delete(callback);
  }

  private notifySubscribers(userId: string, presence: Presence): void {
    this.subscribers.forEach(callback => {
      try {
        callback(userId, presence);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }
}

// Create and export a singleton instance
export const presenceStore = new PresenceStore();