"use client";

import { VisualItem } from "@/types/visualItem";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface PinCardProps {
  item: VisualItem;
  currentUserId?: number | null;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (item: VisualItem) => Promise<VisualItem>;
  isOwnerFeed?: boolean;
  initiallySaved?: boolean;
  onSaveToggle?: (id: number, shouldSave: boolean) => Promise<void>;
  onView?: (id: number) => void;
  onLikeToggle?: (id: number, shouldLike: boolean) => Promise<{ liked: boolean; likeCount: number }>;
}

export function PinCard({
  item,
  currentUserId,
  isAdmin,
  onDelete,
  onEdit,
  isOwnerFeed = false,
  initiallySaved = false,
  onSaveToggle,
  onView,
  onLikeToggle,
}: PinCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [liked, setLiked] = useState(item.likedByCurrentUser ?? false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editDescription, setEditDescription] = useState(item.description ?? "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
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
  const canEdit = Boolean(onEdit && (isOwnerFeed || (currentUserId && item.uploadedBy && currentUserId === item.uploadedBy) || isAdmin));

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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const response = await fetch(item.imageUrl);
      if (!response.ok) throw new Error("Download failed");
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `${item.title.replace(/\s+/g, "_") || "chitram_post"}.${item.mimeType?.split("/")[1] || "jpg"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
      setShowMenu(false);
    } catch {
      setSaveError("Could not download this image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onEdit || !editTitle.trim()) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await onEdit({ ...item, title: editTitle.trim(), category: editCategory, description: editDescription.trim() || null });
      setShowEdit(false);
      setShowMenu(false);
    } catch {
      setEditError("Could not update this post. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
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

  const handleLikeToggle = async () => {
    if (!currentUserId || !onLikeToggle || isLiking) return;

    const nextLiked = !liked;
    const previousLiked = liked;
    const previousCount = likeCount;
    setLikeError(null);
    setLiked(nextLiked);
    setLikeCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
    setIsLiking(true);

    try {
      const result = await onLikeToggle(item.id, nextLiked);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setLikeError("Could not update like");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="group mb-3 break-inside-avoid sm:mb-5">
      {/* Visual Image Container with reserved aspect ratio */}
      <div className="relative rounded-2xl bg-[#e6e0d6] shadow-sm hover:shadow-[0_16px_36px_rgba(31,41,37,0.12)] transition-all duration-300 transform group-hover:-translate-y-0.5 sm:rounded-3xl">
        <div
          className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl"
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
            onLoad={() => {
              setIsLoaded(true);
              onView?.(item.id);
            }}
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
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-md active:scale-90 sm:px-4 sm:py-2 sm:text-xs ${initiallySaved
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
                disabled={isDownloading}
                className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-[#f5f1e9]"
              >
                <span>{isDownloading ? "Downloading..." : "Download Image"}</span>
                <span>↓</span>
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    setEditTitle(item.title);
                    setEditCategory(item.category);
                    setEditDescription(item.description ?? "");
                    setEditError(null);
                    setShowEdit(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center justify-between border-t border-[#f0eee6] px-4 py-2 text-left transition hover:bg-[#f5f1e9]"
                >
                  <span>Edit details</span>
                  <span>✎</span>
                </button>
              )}
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

      {showEdit && (
        <form onSubmit={handleEditSubmit} className="mt-3 rounded-2xl border border-[#e4dcd3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-[#1f2925]">Edit post details</h4>
            <button type="button" onClick={() => setShowEdit(false)} className="text-xs font-semibold text-[#68736d]">Cancel</button>
          </div>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required maxLength={120} className="mt-3 w-full rounded-xl border border-[#d8ded8] px-3 py-2 text-sm outline-none focus:border-[#1f2925]" placeholder="Post title" />
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8ded8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f2925]">
            {['Photography', 'Travel', 'Architecture', 'Nature', 'Art & Design', 'Lifestyle', 'Culture'].map((category) => <option key={category}>{category}</option>)}
          </select>
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={500} rows={2} className="mt-2 w-full resize-none rounded-xl border border-[#d8ded8] px-3 py-2 text-sm outline-none focus:border-[#1f2925]" placeholder="Description (optional)" />
          {editError && <p className="mt-2 text-xs font-medium text-[#a84f37]">{editError}</p>}
          <button type="submit" disabled={isSavingEdit} className="mt-3 w-full rounded-xl bg-[#1f2925] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isSavingEdit ? "Saving..." : "Save details"}</button>
        </form>
      )}

      {/* Pin Meta Footer */}
      <div className="mt-2.5 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-sm font-bold leading-snug text-[#1f2925] line-clamp-2">
            {item.title}
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditTitle(item.title);
                setEditCategory(item.category);
                setEditDescription(item.description ?? "");
                setEditError(null);
                setShowEdit(true);
              }}
              className="shrink-0 rounded-full border border-[#d8ded8] px-2.5 py-1 text-[10px] font-bold text-[#68736d] transition hover:border-[#1f2925] hover:text-[#1f2925]"
            >
              Edit
            </button>
          )}
        </div>

        {item.description && (
          <p className="mt-0.5 text-xs text-[#68736d] line-clamp-1">
            {item.description}
          </p>
        )}

        {/* Creator Info */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar
              src={item.creatorPictureUrl}
              name={item.creatorName || "Chitram Creator"}
              size="xs"
              className="border border-[#e8ece8]"
            />
            <div className="flex min-w-0 items-center gap-1 text-xs text-[#68736d]">
              <span className="truncate font-semibold text-[#1f2925]">
                {item.creatorName || "Chitram Creator"}
              </span>
              {item.creatorUsername && (
                item.uploadedBy ? (
                  <Link
                    href={`/account/${item.uploadedBy}`}
                    className="truncate font-medium text-[#d2643b] hover:underline"
                  >
                    @{item.creatorUsername}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-[#d2643b]">
                    @{item.creatorUsername}
                  </span>
                )
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLikeToggle}
            disabled={!currentUserId || !onLikeToggle || isLiking}
            className={`shrink-0 text-xs font-semibold transition ${liked ? "text-[#d2643b]" : "text-[#68736d] hover:text-[#d2643b]"} disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label={liked ? "Unlike post" : "Like post"}
            title={!currentUserId ? "Sign in to like this post" : undefined}
          >
            <span className="text-base leading-none" aria-hidden="true">{liked ? "♥" : "♡"}</span>
            <span className="ml-1">{likeCount}</span>
          </button>
        </div>
        {likeError && <p className="mt-1 text-right text-[10px] font-medium text-[#a84f37]">{likeError}</p>}
      </div>
    </div>
  );
}
