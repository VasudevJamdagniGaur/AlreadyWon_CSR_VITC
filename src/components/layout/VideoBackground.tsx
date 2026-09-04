"use client";

import { useEffect, useRef } from "react";

const LOOP_START_SECONDS = 9;

/**
 * Full-viewport looping background video.
 * Plays from 0:09 to the end, then seeks back to 0:09 and repeats.
 */
export function VideoBackground({
  src = "/media/kellyos-bg.mp4",
  className = "",
}: {
  src?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const ensureStart = () => {
      if (video.currentTime < LOOP_START_SECONDS) {
        video.currentTime = LOOP_START_SECONDS;
      }
    };

    const onLoaded = () => {
      ensureStart();
      void video.play().catch(() => {});
    };

    const onTimeUpdate = () => {
      if (video.currentTime < LOOP_START_SECONDS - 0.05) {
        video.currentTime = LOOP_START_SECONDS;
      }
    };

    const onEnded = () => {
      video.currentTime = LOOP_START_SECONDS;
      void video.play().catch(() => {});
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    if (video.readyState >= 1) onLoaded();

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [src]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050d10] ${className}`}
    >
      <video
        ref={ref}
        className="h-full w-full scale-105 object-cover"
        src={src}
        muted
        playsInline
        autoPlay
        preload="auto"
      />
      {/* Light frosted veil only — keeps the map video clearly visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
    </div>
  );
}
