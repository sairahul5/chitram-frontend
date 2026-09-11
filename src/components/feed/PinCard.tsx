"use client";

import { VisualItem } from "@/types/visualItem";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";

interface PinCardProps {
  item: VisualItem;
  currentUserId?: number | null;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  initiallySaved?: boolean;
  onSaveToggle?: (id: number, shouldSave: boolean) => Promise<void>;
}

export function PinCard({
  item,
  currentUserId,
  isAdmin,
  onDelete,
  initiallySaved = false,
  onSaveToggle,
}: PinCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate precise aspect ratio to eliminate layout shifts (CLS = 0)
  const ratio = item.aspectRatio
    ? Number(item.aspectRatio)
    : item.width && item.height
      ? item.width / item.height
      : 0.75;

  const canDelete = Boolean(
    (currentUserId && item.uploadedBy && currentUserId === item.uploadedBy) || isAdmin
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.imageUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 1500);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const a = document.createElement("a");
    a.href = item.imageUrl;
    a.download = `${item.title.replace(/\s+/g, "_") || "chitram_post"}.jpg`;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (confirm("Are you sure you want to delete this post? The image file will be removed from Supabase.")) {
      setIsDeleting(true);
      try {
        await onDelete(item.id);
      } finally {
        setIsDeleting(false);
        setShowMenu(false);
      }
    }
  };

  return (
    <div className="break-inside-avoid mb-5 group">
      {/* Visual Image Container with reserved aspect ratio */}
      <div className="relative rounded-3xl bg-[#e6e0d6] shadow-sm hover:shadow-[0_16px_36px_rgba(31,41,37,0.12)] transition-all duration-300 transform group-hover:-translate-y-0.5">
        <div
          className="relative w-full overflow-hidden rounded-3xl"
          style={{ aspectRatio: `${ratio}` }}
        >
          {/* Shimmer skeleton until image loads */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-[#e4dcd3] animate-shimmer" />
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title || "Chitram post"}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 ease-out ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
              }`}
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

          {/* Top Quick Actions (Save Button) */}
          <div className="absolute top-3 right-3 z-10 opacity-100 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!onSaveToggle || isSaving) return;
                const shouldSave = !initiallySaved;
                setIsSaving(true);
                setSaveError(null);
                try {
                  await onSaveToggle(item.id, shouldSave);
                } catch {
                  setSaveError(
                    currentUserId
                      ? "Could not update this post. Please try again."
                      : "Please sign in again to save posts."
                  );
                } finally {
                  setIsSaving(false);
                }
              }}
              type="button"
              disabled={!currentUserId || isSaving}
              title={!currentUserId ? "Sign in to save this post" : undefined}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-90 ${initiallySaved
                ? "bg-[#1f2925] text-white"
                : "bg-[#d2643b] text-white hover:bg-[#b85029]"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isSaving ? "Saving..." : initiallySaved ? "Saved ✓" : "Save"}
            </button>
            {saveError && (
              <p className="absolute right-0 top-11 w-44 rounded-xl bg-[#fff5f2] px-3 py-2 text-[10px] font-semibold leading-tight text-[#a84f37] shadow-md">
                {saveError}
              </p>
            )}
          </div>

          {/* Bottom Category Tag */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
            <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-[#1f2925] shadow-sm">
              {item.category}
            </span>
          </div>
        </div>

        {/* Image menu stays above the crop so its dropdown is never clipped. */}
        <div className="absolute bottom-3 right-3 z-20" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1f2925] shadow-md backdrop-blur-md transition hover:bg-white active:scale-95 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            aria-label="More options"
            aria-expanded={showMenu}
          >
            <span className="flex flex-col items-center gap-0.5" aria-hidden="true">
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
            </span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 bottom-11 w-44 rounded-2xl border border-[#e4dcd3] bg-white py-2 text-xs font-medium text-[#1f2925] shadow-xl animate-scale-in">
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-[#f5f1e9]"
              >
                <span>{copied ? "Link Copied! ✓" : "Copy Link"}</span>
                <span>🔗</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-[#f5f1e9]"
              >
                <span>Download Image</span>
                <span>↓</span>
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex w-full items-center justify-between border-t border-[#f0eee6] px-4 py-2 text-left text-[#d2643b] transition hover:bg-[#fff0ed] disabled:opacity-50"
                >
                  <span>{isDeleting ? "Deleting..." : "Delete Pin"}</span>
                  <span>🗑️</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pin Meta Footer */}
      <div className="mt-2.5 px-1">
        <h3 className="text-sm font-bold text-[#1f2925] leading-snug line-clamp-2">
          {item.title}
        </h3>

        {item.description && (
          <p className="mt-0.5 text-xs text-[#68736d] line-clamp-1">
            {item.description}
          </p>
        )}

        {/* Creator Info */}
        <div className="mt-2 flex items-center gap-2">
          <Avatar
            src={item.creatorPictureUrl}
            name={item.creatorName || "Chitram Creator"}
            size="xs"
            className="border border-[#e8ece8]"
          />
          <div className="flex items-center gap-1 min-w-0 text-xs text-[#68736d]">
            <span className="font-semibold text-[#1f2925] truncate">
              {item.creatorName || "Chitram Creator"}
            </span>
            {item.creatorUsername && (
              <span className="text-[#d2643b] font-medium truncate">
                @{item.creatorUsername}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
