import {createClient, RedisClientType} from 'redis';
import { config } from '@/utils/config';
import {LanyardData} from "@/types";

class PresenceStore {
  private client: RedisClientType;
  private subscribers: Set<(userId: string, presence: LanyardData) => void>;

  constructor() {
    this.client = createClient({
      url: config.redis.url
    });
    this.subscribers = new Set();
    this.client.connect();
  }

  async setPresence(userId: string, presence: LanyardData): Promise<void> {
    await this.client.set(`presence:${userId}`, JSON.stringify(presence));
    this.notifySubscribers(userId, presence);
  }

  async getPresence(userId: string): Promise<LanyardData | null> {
    const data = await this.client.get(`presence:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async setKV(userId: string, key: string, value: string): Promise<void> {
    const presence = await this.getPresence(userId);
    if (!presence) return;

    const kv = presence.kv || {};
    kv[key] = value;
    presence.kv = kv;

    await this.setPresence(userId, presence);
  }

  async subscribe(callback: (userId: string, presence: LanyardData) => void): Promise<void> {
    this.subscribers.add(callback);
  }

  async unsubscribe(callback: (userId: string, presence: LanyardData) => void): Promise<void> {
    this.subscribers.delete(callback);
  }

  private notifySubscribers(userId: string, presence: LanyardData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(userId, presence);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }
}

export const presenceStore = new PresenceStore();