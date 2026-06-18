"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FB_PIXEL_ID, pageview } from "@/lib/fbpixel";

/**
 * Fires PageView on client-side navigations. The base snippet below already
 * fires the first PageView on initial load, so we skip the first effect run
 * to avoid double-counting, then track every subsequent route change.
 *
 * Uses useSearchParams, so it must live inside a <Suspense> boundary —
 * otherwise it would opt the whole app out of static rendering.
 */
function PageViewOnRouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    pageview();
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  // No pixel ID configured → render nothing (tracking disabled).
  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewOnRouteChange />
      </Suspense>
    </>
  );
}
