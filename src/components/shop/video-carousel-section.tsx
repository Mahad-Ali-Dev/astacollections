import {
  getSettings,
  parseVideoCarouselItems,
  videoCarouselShowsOn,
} from "@/lib/settings";
import { VideoCarousel } from "./video-carousel";

/**
 * Server wrapper: reads the admin settings and renders the carousel only if
 * it's enabled for this page. Drop `<VideoCarouselSection page="home" />`
 * into any page — visibility stays controlled from the admin panel.
 */
export async function VideoCarouselSection({ page }: { page: string }) {
  const settings = await getSettings();
  if (!videoCarouselShowsOn(settings, page)) return null;

  return (
    <VideoCarousel
      items={parseVideoCarouselItems(settings.videoCarouselItems)}
      title={settings.videoCarouselTitle}
      subtitle={settings.videoCarouselSubtitle}
    />
  );
}
