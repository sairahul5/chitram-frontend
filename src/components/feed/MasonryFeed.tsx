"use client";

import { VisualItem } from "@/types/visualItem";
import { PinCard } from "@/components/feed/PinCard";
import { useEffect, useRef } from "react";

interface MasonryFeedProps {
  items: VisualItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  currentUserId?: number | null;
  isAdmin?: boolean;
  onDeletePin?: (id: number) => void;
  savedPinIds?: number[];
  onSaveToggle?: (id: number, shouldSave: boolean) => Promise<void>;
  emptyTitle?: string;
  emptySubtitle?: string;
}

const SKELETON_RATIOS = [0.75, 1.2, 0.67, 1.0, 0.85, 1.33, 0.7, 0.9];

export function MasonryFeed({
  items,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  currentUserId,
  isAdmin,
  onDeletePin,
  savedPinIds = [],
  onSaveToggle,
  emptyTitle = "No posts discovered yet",
  emptySubtitle = "Check back soon or publish your own visual creation!",
}: MasonryFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "300px" }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading && items.length === 0) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {SKELETON_RATIOS.map((ratio, index) => (
          <div
            key={index}
            className="break-inside-avoid mb-4 rounded-3xl overflow-hidden bg-white/70 border border-[#e4dcd3]/60 p-3 shadow-sm"
          >
            <div
              className="w-full rounded-2xl bg-[#e4dcd3] animate-shimmer"
              style={{ aspectRatio: `${ratio}` }}
            />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded-full bg-[#e4dcd3] animate-shimmer" />
              <div className="h-3 w-1/2 rounded-full bg-[#e4dcd3] animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-[#ccd4cd] bg-white/60 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fbebe4] text-2xl">
          🎨
        </div>
        <h3 className="mt-4 text-lg font-bold text-[#1f2925]">{emptyTitle}</h3>
        <p className="mt-1.5 text-sm text-[#68736d]">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 
        Responsive Pinterest Column Layout:
        - Mobile: 2 columns
        - Tablet (sm / md): 3 columns
        - Large Tablet / Laptop (lg): 4 columns
        - Desktop (xl): 5 columns
      */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 animate-fade-in">
        {items.map((item) => (
          <PinCard
            key={item.id}
            item={item}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onDelete={onDeletePin}
            initiallySaved={savedPinIds.includes(item.id)}
            onSaveToggle={onSaveToggle}
          />
        ))}
      </div>

      {/* Infinite Scroll Sentinel and Loaders */}
      <div ref={sentinelRef} className="py-8 flex flex-col items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-3 rounded-full bg-white/90 border border-[#e4dcd3] px-5 py-2.5 shadow-sm text-sm font-semibold text-[#1f2925]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1f2925] border-t-transparent" />
            <span>Discovering more posts...</span>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a8b0a9]">
            • You&apos;ve reached the end of the collection •
          </p>
        )}
      </div>
    </div>
  );
}
