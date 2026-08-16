"use client";

import { useRef, useState } from "react";
import { upload as imagekitUpload } from "@imagekit/javascript";
import { Film, Loader2, X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isPlayableVideoUrl } from "@/lib/settings";

const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime"];

export function VideoUploadField({
  value,
  onChange,
  label = "Video",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const badUrl = value.trim() !== "" && !isPlayableVideoUrl(value);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("Video must be under 50MB");
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only MP4, WebM, or MOV videos are supported");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const authRes = await fetch("/api/upload/video");
      if (!authRes.ok) {
        const err = await authRes.json().catch(() => ({}));
        throw new Error(err?.error ?? "Could not authorize upload");
      }
      const auth = await authRes.json();

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const uploaded = await imagekitUpload({
        file,
        fileName,
        folder: "/carousel/videos",
        useUniqueFileName: false,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        publicKey: auth.publicKey,
        onProgress: (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      onChange(uploaded.url ?? "");
      toast.success("Video uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Video upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value ? (
        <div className="relative w-40">
          <video
            src={value}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-[9/16] rounded-lg bg-black object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-background/90 backdrop-blur p-1.5 rounded-full shadow"
            aria-label="Remove video"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="w-40 aspect-[9/16] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent text-muted-foreground hover:text-accent transition text-center px-3">
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <span className="text-xs">
                Uploading{progress > 0 ? ` — ${progress}%` : "…"}
              </span>
            </>
          ) : (
            <>
              <Film className="h-7 w-7 mb-1.5" />
              <span className="text-xs font-medium">Upload video</span>
              <span className="text-[10px] mt-1">MP4 · under 50MB</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      )}

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste a direct video file URL ending in .mp4"
        className={badUrl ? "border-destructive" : undefined}
      />

      {badUrl && (
        <p className="text-xs text-destructive flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            That&apos;s a page link, not a video file — it will show as an empty card.
            Download the video and upload it above instead.
          </span>
        </p>
      )}
    </div>
  );
}
