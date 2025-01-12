import {UserFlagsBitField} from 'discord.js';

export interface LanyardData {
  spotify: Spotify | null;
  listening_to_spotify: boolean;
  discord_user?: DiscordUser;
  discord_status: "online" | "idle" | "dnd" | "invisible";
  kv: Kv;
  badges: string[]
  activities: Activity[];
  active_on_discord_web: boolean;
  active_on_discord_mobile: boolean;
  active_on_discord_desktop: boolean;
}

export interface Kv {
  [key: string]: string;
}

export interface Spotify {
  track_id: string;
  timestamps: Timestamps;
  song: string;
  artist: string;
  album_art_url: string;
  album: string;
}

export interface Activity {
  type: number;
  state: string | null;
  name: string;
  id?: string;
  flags?: number;
  emoji?: Emoji;
  created_at?: number;
  application_id?: string;
  timestamps: Timestamps;
  sync_id?: string;
  session_id?: string;
  party?: Party;
  details?: string;
  buttons?: string[];
  assets?: Assets;
}

export interface Party {
  id: string;
  size?: [number, number];
}

export interface Assets {
  small_text: string;
  small_image: string;
  large_text: string;
  large_image: string;
}

export interface Timestamps {
  start: number | null
  end?: number | null
}

export interface Emoji {
  name: string;
  id?: string;
  animated?: boolean;
}

export interface DiscordUser {
  username: string | undefined
  globalName: string | undefined;
  flags?: Readonly<UserFlagsBitField>
  id: string | undefined;
  discriminator: string | undefined;
  bot: boolean;
  avatar: string | undefined;
  avatar_decoration_data?: {
    sku_id: string | undefined;
    asset: string | undefined;
    expires_at: number;
  } | null;
}
