"use client";

import { apiClient } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/Avatar";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { PinUploadModal } from "@/components/upload/PinUploadModal";
import { VisualItem, VisualFeedResponse } from "@/types/visualItem";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

const CATEGORIES = ["All", "Photography", "Travel", "Architecture", "Nature", "Art & Design", "Culture"];

type AccountSearchResult = {
  id: number;
  name: string;
  pictureUrl: string | null;
  username: string | null;
  followersCount: number;
};

export default function Home() {
  const [items, setItems] = useState<VisualItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"posts" | "accounts">("posts");
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

  // Initial feed load
  const loadFeed = useCallback(async (query: string = "") => {
    setLoadingItems(true);
    setError(false);
    try {
      const q = query.trim() ? `&query=${encodeURIComponent(query.trim())}` : "";
      const data = await apiClient<VisualFeedResponse>(`/visual-items/feed?limit=25${q}`);
      setItems(data.items || []);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoadingItems(false);
    }
  }, []);

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
    if (searchMode === "accounts") {
      const query = searchQuery.trim().replace(/^@/, "");
      if (!query) {
        return;
      }
      apiClient<AccountSearchResult[]>(`/user/search?query=${encodeURIComponent(query)}`)
        .then(setAccountResults)
        .catch(() => setAccountResults([]))
        .finally(() => setLoadingItems(false));
      return;
    }

    loadFeed(selectedCategory === "All" ? searchQuery : selectedCategory);
  }, [selectedCategory, searchMode, searchQuery, loadFeed]);

  useEffect(() => {
    apiClient<{ id: number; name: string; email: string; pictureUrl?: string | null; username?: string | null; isAdmin?: boolean }>("/user/profile")
      .then((profile) => {
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

  const handleSaveToggle = async (id: number, shouldSave: boolean) => {
    await apiClient(`/user/saved/${id}`, { method: shouldSave ? "POST" : "DELETE" });
    setSavedPinIds((prev) =>
      shouldSave ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((savedId) => savedId !== id)
    );
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

  const handlePinCreated = (newPin: VisualItem) => {
    setItems((prev) => [newPin, ...prev]);
  };

  return (
    <main className="min-h-screen bg-[#f5f1e9] px-4 py-6 text-[#1f2925] sm:px-8 lg:px-12">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link className="text-2xl font-bold tracking-tight text-[#1f2925] hover:opacity-90 transition" href="/">
            Chitram
          </Link>
          <span className="hidden sm:inline-block rounded-full bg-[#e8e0d4] px-3 py-1 text-xs font-semibold text-[#68736d]">
            Supabase Cloud
          </span>
        </div>

        <div className="flex items-center gap-3">
          {loadingUser ? (
            <div className="h-9 w-24 rounded-full bg-[#e5ded4] animate-pulse" />
          ) : currentUser ? (
            <>
              <button
                onClick={() => setShowUploadModal(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#d2643b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#b85029] active:scale-95 transition"
              >
                <span>+ Create Post</span>
              </button>

              <Link
                className="flex items-center gap-2 rounded-full bg-[#1f2925] pl-2 pr-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#2e3b36] transition shadow-sm"
                href="/user"
              >
                <Avatar src={currentUser.pictureUrl} name={currentUser.name} size="sm" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {currentUser.username ? `@${currentUser.username}` : currentUser.name}
                </span>
              </Link>

              <button
                className="rounded-full border border-[#d2643b] bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#a84f37] hover:bg-[#fff5f2] hover:border-[#b85029] hover:text-[#8f402e] transition"
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
      <section className="mx-auto max-w-7xl py-10 sm:py-14 animate-fade-in">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.24em] text-[#d2643b]">
          Visual Discovery & Curation
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-[#1f2925] sm:text-6xl lg:text-7xl">
          Find something worth keeping.
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-[#68736d]">
          Browse photography, architecture, and art with preserved original aspect ratios stored live in Supabase Storage.
        </p>

        <div className="mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchMode === "posts" ? "Search posts by title or category" : "Search accounts by name or username"}
              className="w-full rounded-2xl border border-[#d8ded8] bg-white px-4 py-3 text-sm text-[#1f2925] shadow-sm outline-none transition placeholder:text-[#98a39c] focus:border-[#d2643b]"
              aria-label={searchMode === "posts" ? "Search posts" : "Search accounts"}
            />
          </div>
          <div className="flex rounded-2xl border border-[#d8ded8] bg-white p-1 shadow-sm">
            {(["posts", "accounts"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSearchMode(mode)}
                className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${
                  searchMode === mode ? "bg-[#1f2925] text-white" : "text-[#68736d] hover:text-[#1f2925]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchQuery("");
              }}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition active:scale-95 whitespace-nowrap shadow-sm ${
                selectedCategory === cat
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
        {searchMode === "accounts" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!searchQuery.trim() ? (
              <p className="col-span-full rounded-3xl border border-dashed border-[#ccd4cd] bg-white/60 p-10 text-center text-sm text-[#68736d]">
                Search for an account by name or username.
              </p>
            ) : accountResults.length === 0 ? (
              <p className="col-span-full rounded-3xl border border-dashed border-[#ccd4cd] bg-white/60 p-10 text-center text-sm text-[#68736d]">
                No accounts found.
              </p>
            ) : (
              accountResults.map((account) => (
                <Link
                  key={account.id}
                  href={`/account/${account.id}`}
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
              ))
            )}
          </div>
        ) : (
          <MasonryFeed
            items={items}
            isLoading={loadingItems}
            isLoadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            currentUserId={currentUser?.id}
            isAdmin={currentUser?.isAdmin}
            onDeletePin={handleDeletePin}
            savedPinIds={savedPinIds}
            onSaveToggle={handleSaveToggle}
            emptyTitle={selectedCategory === "All" ? "No posts available yet" : `No posts in ${selectedCategory}`}
            emptySubtitle="Be the first to share an image in this category!"
          />
        )}
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
