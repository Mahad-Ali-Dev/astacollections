import { cache } from "react";
import {
  getSettings,
  parseVideoCarouselItems,
  videoCarouselSlotFor,
} from "@/lib/settings";
import { VideoCarousel } from "./video-carousel";

/**
 * Pages drop this in at every position the carousel is allowed to occupy;
 * only the slot the admin picked actually renders. That means a page can
 * hold a dozen of these, so settings are cached per request — otherwise
 * each one would fire its own query for the same rows.
 */
const getCachedSettings = cache(getSettings);

export async function VideoCarouselSection({
  page,
  slot,
}: {
  page: string;
  slot: string;
}) {
  const settings = await getCachedSettings();
  if (videoCarouselSlotFor(settings, page) !== slot) return null;

  return (
    <VideoCarousel
      items={parseVideoCarouselItems(settings.videoCarouselItems)}
      title={settings.videoCarouselTitle}
      subtitle={settings.videoCarouselSubtitle}
    />
  );
}
