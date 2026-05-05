import { exerciseVideoLinks } from "../data/exerciseVideos";
import type { ExerciseVideoLinks } from "../types/training";

export const youtubeSearch = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} execução correta profissional educação física`)}`;

export function videoKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getManualVideoLinks(nameOrKey: string, videoName?: string): ExerciseVideoLinks | undefined {
  const keyFromName = videoKey(nameOrKey);
  const keyFromVideoName = videoName ? videoKey(videoName) : keyFromName;
  return exerciseVideoLinks[keyFromName] ?? exerciseVideoLinks[keyFromVideoName];
}

export function getExerciseVideoUrl(name: string, videoName?: string) {
  if (videoName === "-") return undefined;
  const manualVideo = getManualVideoLinks(name, videoName);
  if (manualVideo?.youtube?.trim()) return manualVideo.youtube;
  if (manualVideo?.tiktok?.trim()) return manualVideo.tiktok;
  return youtubeSearch(videoName ?? name);
}
