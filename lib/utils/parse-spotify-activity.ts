import { Activity } from "@/types/lanyard";

export function parseSpotifyActivity(activity: Activity) {
  if (activity?.type !== 2 || !activity.id) return undefined;

  const { start, end } = activity.timestamps ?? {};
  if (!start || !end || Date.now() < start || Date.now() > end) {
    console.log("Spotify activity detected but not playing a valid track.");
    return undefined;
  }

  return {
    track_id: activity.id,
    timestamps: { start, end },
    album: activity.assets?.large_text ?? "Unknown Album",
    album_art_url: activity.assets?.large_image
      ? `https://i.scdn.co/image/${activity.assets.large_image.replace("spotify:", "")}`
      : "",
    artist: activity.state ?? "Unknown Artist",
    song: activity.details ?? "Unknown Song",
  };
}
