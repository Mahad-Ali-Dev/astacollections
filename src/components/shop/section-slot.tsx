import { cache } from "react";
import {
  getSettings,
  parseVideoCarouselItems,
  videoCarouselSlotFor,
  reviewsStripSlotFor,
} from "@/lib/settings";
import { VideoCarousel } from "./video-carousel";
import { ReviewsStrip } from "./reviews-strip";

/**
 * A position on a page that admin-placed sections can occupy.
 *
 * Every page drops one of these at each of its named slots; each section
 * renders only where the admin put it. Pages therefore hold a dozen of these,
 * so settings are cached per request — otherwise each would query separately.
 *
 * More than one section can share a slot; they render in a fixed order so the
 * layout doesn't shuffle when settings change.
 */
const getCachedSettings = cache(getSettings);

export async function SectionSlot({ page, slot }: { page: string; slot: string }) {
  const settings = await getCachedSettings();

  const showVideos = videoCarouselSlotFor(settings, page) === slot;
  const showReviews = reviewsStripSlotFor(settings, page) === slot;
  if (!showVideos && !showReviews) return null;

  return (
    <>
      {showVideos && (
        <VideoCarousel
          items={parseVideoCarouselItems(settings.videoCarouselItems)}
          title={settings.videoCarouselTitle}
          subtitle={settings.videoCarouselSubtitle}
        />
      )}
      {showReviews && (
        <ReviewsStrip
          title={settings.reviewsStripTitle}
          subtitle={settings.reviewsStripSubtitle}
          count={Math.min(48, Math.max(1, Number(settings.reviewsStripCount) || 9))}
          minRating={Math.min(5, Math.max(1, Number(settings.reviewsStripMinRating) || 4))}
          showProduct={settings.reviewsStripShowProduct !== "false"}
        />
      )}
    </>
  );
}
