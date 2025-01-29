import { createClient, RedisClientType } from "redis";
import { config } from "#/utils/config";
import { LanyardData } from "#/types/lanyard";

class PresenceStore {
  private client: RedisClientType;
  private subscribers: Set<(userId: string, presence: LanyardData) => void>;

  constructor() {
    this.client = createClient({
      url: config.redis.url,
    });
    this.subscribers = new Set();
    this.client.connect();
  }

  async set(userId: string, presence: LanyardData): Promise<void> {
    await this.client.set(`presence:${userId}`, JSON.stringify(presence));
    this.notifySubscribers(userId, presence);
  }

  async get(userId: string): Promise<LanyardData | null> {
    const data = await this.client.get(`presence:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async setKV(userId: string, key: string, value: string): Promise<void> {
    const presence = await this.get(userId);
    if (!presence) return;

    const kv = presence.kv || {};
    kv[key] = value;
    presence.kv = kv;

    await this.set(userId, presence);
  }

  async subscribe(
    callback: (userId: string, presence: LanyardData) => void
  ): Promise<void> {
    this.subscribers.add(callback);
  }

  async exists(userId: string): Promise<boolean> {
    return (await this.client.exists(`presence:${userId}`)) === 1;
  }

  async unsubscribe(
    callback: (userId: string, presence: LanyardData) => void
  ): Promise<void> {
    this.subscribers.delete(callback);
  }

  async add(userId: string, initialPresence: LanyardData): Promise<void> {
    if (await this.exists(userId)) {
      throw new Error(`User ${userId} already exists`);
    }
    await this.set(userId, initialPresence);
  }

  private notifySubscribers(userId: string, presence: LanyardData) {
    this.subscribers.forEach((callback) => {
      try {
        callback(userId, presence);
      } catch (error) {
        console.error("Error in subscriber callback:", error);
      }
    });
  }
}

export const store = new PresenceStore();
