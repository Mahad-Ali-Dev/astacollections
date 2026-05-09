"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  /** Aspect ratio of the preview */
  aspect?: "square" | "video" | "portrait" | "wide";
  className?: string;
};

const ASPECT = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[4/5]",
  wide: "aspect-[16/9]",
};

export function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  aspect = "video",
  className = "",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    upload(files[0]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <button
            type="button"
            onClick={() => setShowUrl(!showUrl)}
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            {showUrl ? "Use upload" : "Use URL"}
          </button>
        </div>
      )}

      {showUrl ? (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg or /uploads/..."
        />
      ) : value ? (
        <div className={`relative ${ASPECT[aspect]} bg-muted rounded-lg overflow-hidden border group`}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 h-9 rounded-full bg-white text-foreground text-xs font-medium uppercase tracking-[0.18em] hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="w-9 h-9 rounded-full bg-white/95 text-destructive hover:bg-destructive hover:text-white transition-colors flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      ) : (
        <label
          className={`${ASPECT[aspect]} bg-muted/40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors text-muted-foreground hover:text-accent`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <span className="text-xs">Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 mb-2" strokeWidth={1.4} />
              <span className="text-xs font-medium">Upload image</span>
              <span className="text-[10px] text-muted-foreground/80 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
