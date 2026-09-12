"use client";

import { apiClient } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/Avatar";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { PinUploadModal } from "@/components/upload/PinUploadModal";
import { VisualItem, VisualFeedResponse } from "@/types/visualItem";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["All", "Photography", "Travel", "Architecture", "Nature", "Art & Design", "Culture"];

type AccountSearchResult = {
  id: number;
  name: string;
  pictureUrl: string | null;
  username: string | null;
  followersCount: number;
};

export default function Home() {
  const router = useRouter();
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<VisualItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [accountResults, setAccountResults] = useState<AccountSearchResult[]>([]);

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
    email: string;
    username: string | null;
    pictureUrl: string | null;
    isAdmin?: boolean;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [savedPinIds, setSavedPinIds] = useState<number[]>([]);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);

  // Initial feed load
  const loadFeed = useCallback(async (query: string = "", personalized = false, signal?: AbortSignal) => {
    setLoadingItems(true);
    setError(false);
    try {
      if (personalized && currentUser) {
        try {
          const recommendations = await apiClient<VisualItem[]>("/recommendations?limit=25", { signal });
          if (recommendations?.length) {
            setItems(recommendations);
            setNextCursor(null);
            setHasMore(false);
            return;
          }
        } catch {
          // Use the public feed while personalized recommendations are unavailable.
        }
      }

      const q = query.trim() ? `&query=${encodeURIComponent(query.trim())}` : "";
      const data = await apiClient<VisualFeedResponse>(`/visual-items/feed?limit=25${q}`, { signal });
      setItems(data.items || []);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoadingItems(false);
    }
  }, [currentUser]);

  // Infinite scroll load more
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const q = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : "";
      const data = await apiClient<VisualFeedResponse>(
        `/visual-items/feed?cursor=${nextCursor}&limit=25${q}`
      );
      setItems((prev) => [...prev, ...(data.items || [])]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e) {
      console.error("Failed to load more pins:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    apiClient<{ enabled: boolean }>("/recommendations/status")
      .then((status) => setRecommendationsEnabled(status.enabled))
      .catch(() => setRecommendationsEnabled(true));
  }, []);

  useEffect(() => {
    const accountQuery = searchQuery.trim().replace(/^@/, "");
    const controller = new AbortController();
    const feedLoad = window.setTimeout(() => {
      if (accountQuery.length >= 2) {
        apiClient<AccountSearchResult[]>(`/user/search?query=${encodeURIComponent(accountQuery)}`, { signal: controller.signal })
          .then(setAccountResults)
          .catch(() => {
            if (!controller.signal.aborted) setAccountResults([]);
          });
      } else {
        setAccountResults([]);
      }
      void loadFeed(
        selectedCategory === "All" ? searchQuery : selectedCategory,
        Boolean(recommendationsEnabled && currentUser && selectedCategory === "All" && !searchQuery.trim()),
        controller.signal,
      );
    }, 250);

    return () => {
      window.clearTimeout(feedLoad);
      controller.abort();
    };
  }, [selectedCategory, searchQuery, currentUser, recommendationsEnabled, loadFeed]);

  useEffect(() => {
    apiClient<{ id: number; name: string; email: string; pictureUrl?: string | null; username?: string | null; isAdmin?: boolean } | null>("/auth/session")
      .then((profile) => {
        if (!profile) {
          setCurrentUser(null);
          return;
        }
        setCurrentUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          username: profile.username ?? null,
          pictureUrl: profile.pictureUrl ?? null,
          isAdmin: profile.isAdmin,
        });
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    apiClient<number[]>("/user/saved-ids")
      .then(setSavedPinIds)
      .catch(() => setSavedPinIds([]));
  }, [currentUser]);

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const focusVisibleSearch = () => {
      const searchInputs = [desktopSearchRef.current, mobileSearchRef.current];
      const visibleInput = searchInputs.find((input) => input && input.offsetParent !== null);
      visibleInput?.focus();
    };
    const handleGlobalSearchShortcut = (event: KeyboardEvent) => {
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
      if (modifierPressed && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusVisibleSearch();
      }
    };
    window.addEventListener("keydown", handleGlobalSearchShortcut);
    return () => window.removeEventListener("keydown", handleGlobalSearchShortcut);
  }, []);

  const handleSaveToggle = async (id: number, shouldSave: boolean) => {
    await apiClient(`/user/saved/${id}`, { method: shouldSave ? "POST" : "DELETE" });
    setSavedPinIds((prev) =>
      shouldSave ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((savedId) => savedId !== id)
    );
  };

  const handlePinView = (id: number) => {
    void id;
  };

  const handleLikeToggle = async (id: number, shouldLike: boolean) => {
    const result = await apiClient<{ liked: boolean; likeCount: number }>(`/pins/${id}/like`, {
      method: shouldLike ? "POST" : "DELETE",
    });
    setItems((prev) => prev.map((item) => item.id === id
      ? { ...item, likeCount: result.likeCount, likedByCurrentUser: result.liked }
      : item));
    return result;
  };

  const handleReport = async (id: number, reason: string, description: string) => {
    await apiClient("/reports", { method: "POST", body: JSON.stringify({ targetType: "PIN", targetId: id, reason, description }) });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim().replace(/^@/, "")) {
      setAccountResults([]);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      return;
    }
    if (event.key === "Enter" && accountResults[0]) {
      event.preventDefault();
      router.push(`/account/${accountResults[0].username || accountResults[0].id}`);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient<void>("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  const handleDeletePin = async (id: number) => {
    try {
      await apiClient(`/visual-items/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to delete pin: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleEditPin = async (updated: VisualItem) => {
    const saved = await apiClient<VisualItem>(`/visual-items/${updated.id}`, {
      method: "PUT",
      body: JSON.stringify({ title: updated.title, category: updated.category, description: updated.description }),
    });
    setItems((prev) => prev.map((item) => item.id === saved.id ? saved : item));
    return saved;
  };

  const handlePinCreated = (newPin: VisualItem) => {
    setItems((prev) => [newPin, ...prev]);
  };

  return (
    <main className="min-h-screen bg-[#f5f1e9] px-4 py-6 text-[#1f2925] sm:px-8 lg:px-12">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-6">
          <Link className="shrink-0 hover:opacity-90 transition" href="/" aria-label="Chitram home">
            <Image
              src="/name.png"
              alt="Chitram"
              width={176}
              height={48}
              priority
              className="h-10 w-36 translate-y-2 object-cover object-center sm:h-12 sm:w-44"
            />
          </Link>
        </div>

        <div className="mx-6 hidden min-w-0 max-w-xl flex-1 lg:block">
          <input
            ref={desktopSearchRef}
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search posts or accounts"
            className="w-full rounded-2xl border border-[#d8ded8] bg-white px-4 py-2.5 text-sm text-[#1f2925] shadow-sm outline-none transition placeholder:text-[#98a39c] focus:border-[#d2643b]"
            aria-label="Search posts or accounts"
            aria-keyshortcuts="Control+K Meta+K Escape Enter"
          />
        </div>

        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
          {loadingUser ? (
            <div className="h-9 w-24 rounded-full bg-[#e5ded4] animate-pulse" />
          ) : currentUser ? (
            <>
              <button
                onClick={() => setShowUploadModal(true)}
                className="hidden h-9 w-9 translate-y-0.5 items-center justify-center rounded-full bg-[#d2643b] text-lg font-bold leading-none text-white shadow-sm hover:bg-[#b85029] active:scale-95 transition sm:inline-flex sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
                aria-label="Create post"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ Create Post</span>
              </button>

              <Link
                className="flex max-w-[124px] items-center gap-2 rounded-full bg-[#1f2925] pl-1.5 pr-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2e3b36] transition shadow-sm sm:max-w-none sm:pr-4 sm:text-sm"
                href="/user"
              >
                <Avatar src={currentUser.pictureUrl} name={currentUser.name} size="sm" />
                <span className="max-w-[72px] truncate sm:max-w-[160px]">
                  {currentUser.username ? `@${currentUser.username}` : currentUser.name}
                </span>
              </Link>

              <button
                className="rounded-full border border-[#d2643b] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#a84f37] hover:bg-[#fff5f2] hover:border-[#b85029] hover:text-[#8f402e] transition sm:px-4 sm:py-2 sm:text-sm"
                onClick={handleLogout}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              className="rounded-full border border-[#d8ded8] bg-white px-5 py-2 text-sm font-semibold text-[#1f2925] hover:border-[#1f2925] shadow-sm transition"
              href="/login"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl py-5 sm:py-8 animate-fade-in">
        <div className="flex max-w-2xl flex-col gap-2.5 sm:flex-row lg:hidden">
          <div className="relative flex-1">
            <input
              ref={mobileSearchRef}
              type="search"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search posts or accounts"
              className="w-full rounded-2xl border border-[#d8ded8] bg-white px-4 py-3 text-sm text-[#1f2925] shadow-sm outline-none transition placeholder:text-[#98a39c] focus:border-[#d2643b]"
              aria-label="Search posts or accounts"
              aria-keyshortcuts="Control+K Meta+K Escape Enter"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                handleSearchChange("");
              }}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition active:scale-95 whitespace-nowrap shadow-sm ${selectedCategory === cat
                ? "bg-[#1f2925] text-white"
                : "bg-white border border-[#e4dcd3] text-[#68736d] hover:text-[#1f2925] hover:border-[#1f2925]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#e8b9ad] bg-[#fff5f2] p-5 text-sm font-medium text-[#a84f37] mb-8">
          Unable to load feed from Supabase. Please check your connection and refresh.
        </div>
      )}

      {/* Pinterest-style Masonry Feed */}
      <section className="mx-auto max-w-7xl">
        {accountResults.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#68736d]">Accounts</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accountResults.map((account) => (
                <Link
                  key={account.id}
                  href={`/account/${account.username || account.id}`}
                  className="flex items-center gap-3 rounded-3xl border border-[#e4dcd3] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Avatar src={account.pictureUrl} name={account.name} size="md" className="border border-[#e8ece8]" />
                  <span className="min-w-0">
                    <strong className="block truncate text-sm text-[#1f2925]">{account.name}</strong>
                    <span className="block truncate text-xs text-[#d2643b]">
                      {account.username ? `@${account.username}` : "Chitram account"}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#68736d]">{account.followersCount} followers</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <MasonryFeed
          items={items}
          isLoading={loadingItems}
          isLoadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          currentUserId={currentUser?.id}
          isAdmin={currentUser?.isAdmin}
          onDeletePin={handleDeletePin}
          onEditPin={handleEditPin}
          savedPinIds={savedPinIds}
          onSaveToggle={handleSaveToggle}
          onView={handlePinView}
          onLikeToggle={handleLikeToggle}
          onReport={handleReport}
          emptyTitle={selectedCategory === "All" ? "No posts available yet" : `No posts in ${selectedCategory}`}
          emptySubtitle="Be the first to share an image in this category!"
        />
      </section>

      {/* Upload Pin Modal */}
      <PinUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handlePinCreated}
      />
    </main>
  );
}
