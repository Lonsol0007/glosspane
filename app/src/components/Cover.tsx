"use client";
import { BookImage } from "lucide-react";
import { useEffect, useState } from "react";

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export function Cover({ blob, title, className = "" }: { blob: Blob | null; title: string; className?: string }) {
  const url = useObjectUrl(blob);
  return (
    <div className={`flex aspect-[2/3] items-center justify-center overflow-hidden rounded-md bg-surface-2 text-muted ${className}`}>
      {url ? <img src={url} alt={`Cover of ${title}`} className="h-full w-full object-cover" /> : <BookImage size={32} aria-label={`No cover for ${title}`} />}
    </div>
  );
}
