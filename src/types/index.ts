import { PresenceStatus } from 'discord.js';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  bot?: boolean;
  global_name?: string;
}

export interface KV {
  key: string;
  value: string;
}
export interface Activity {
  name: string;
  type: number;
  url?: string;
  created_at: number;
  timestamps?: {
    start?: number;
    end?: number;
  };
  application_id?: string;
  details?: string;
  state?: string;
  emoji?: {
    name: string;
    id?: string;
    animated?: boolean;
  };
  party?: {
    id?: string;
    size?: [number, number];
  };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  spotify: {
    track_id: string;
    timestamps: Timestamps;
    song: string;
    artist: string;
    sync_id: string;
    large_image: string;
    large_text: string;
  }
  secrets?: {
    join?: string;
    spectate?: string;
    match?: string;
  };
  instance?: boolean;
  flags?: number;
  buttons?: string[];
  createdAt?: Date;

}

export interface Timestamps {
  start: number;
  end: number;
}

  export interface Presence {
  discord_user: User;
  discord_status: PresenceStatus;
  activities: Activity[];
  active_on_discord_web: boolean;
  active_on_discord_desktop: boolean;
  active_on_discord_mobile: boolean;
  listening_to_spotify: boolean;
  spotify?: {
    track_id: string;
    timestamps: {
      start: number;
      end: number;
    };
    album: string;
    album_art_url: string;
    artist: string;
    song: string;
  };
  kv?: KV[];
  badges: string[]
}