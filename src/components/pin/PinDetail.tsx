"use client";

import { Avatar } from "@/components/ui/Avatar";
import { PinCard } from "@/components/feed/PinCard";
import { apiClient } from "@/lib/apiClient";
import { VisualItem } from "@/types/visualItem";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REPORT_REASONS = [
  ["SPAM", "Spam"],
  ["NUDITY", "Nudity or sexual content"],
  ["VIOLENCE", "Violence or graphic content"],
  ["HARASSMENT", "Hate or harassment"],
  ["COPYRIGHT", "Copyright violation"],
  ["MISLEADING", "Misleading content"],
  ["OTHER", "Other"],
] as const;

type Session = { id: number; isAdmin?: boolean } | null;

export function PinDetail({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<VisualItem | null>(null);
  const [recommendations, setRecommendations] = useState<VisualItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [error, setError] = useState<"not-found" | "failed" | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [pin, currentSession] = await Promise.all([
          apiClient<VisualItem>(`/visual-items/${encodeURIComponent(id)}`, { signal: controller.signal }),
          apiClient<Session>("/auth/session", { signal: controller.signal }).catch(() => null),
        ]);
        setItem(pin);
        setSession(currentSession);
        setLiked(Boolean(pin.likedByCurrentUser));
        setLikeCount(pin.likeCount ?? 0);
        setLoading(false);

        try {
          if (currentSession) {
            const [savedIds, personalized] = await Promise.all([
              apiClient<number[]>("/user/saved-ids", { signal: controller.signal }).catch((): number[] => []),
              apiClient<VisualItem[]>("/recommendations?limit=25", { signal: controller.signal }),
            ]);
            setSaved(savedIds.includes(pin.id));
            setRecommendations(personalized.filter((candidate) => candidate.id !== pin.id).slice(0, 25));
          } else {
            const feed = await apiClient<{ items: VisualItem[] }>("/visual-items/feed?limit=25", { signal: controller.signal });
            setRecommendations((feed.items || []).filter((candidate) => candidate.id !== pin.id).slice(0, 25));
          }
        } catch {
          if (!controller.signal.aborted) setRecommendations([]);
        } finally {
          if (!controller.signal.aborted) setRecommendationsLoading(false);
        }
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error && loadError.name === "ApiError404" ? "not-found" : "failed");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRecommendationsLoading(false);
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  const handleLike = async () => {
    if (!session || !item || isLiking) return;
    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(Math.max(0, likeCount + (nextLiked ? 1 : -1)));
    setIsLiking(true);
    setActionError(null);
    try {
      const result = await apiClient<{ liked: boolean; likeCount: number }>(`/pins/${item.id}/like`, { method: nextLiked ? "POST" : "DELETE" });
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setActionError("Could not update like.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!session || !item || isSaving) return;
    const nextSaved = !saved;
    setSaved(nextSaved);
    setIsSaving(true);
    setActionError(null);
    try {
      await apiClient(`/user/saved/${item.id}`, { method: nextSaved ? "POST" : "DELETE" });
    } catch {
      setSaved(!nextSaved);
      setActionError("Could not update saved posts.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item || !session) return;
    setReporting(true);
    setActionError(null);
    try {
      await apiClient("/reports", { method: "POST", body: JSON.stringify({ targetType: "PIN", targetId: item.id, reason: reportReason, description: reportDescription.trim() }) });
      setShowReport(false);
      setReportDescription("");
    } catch {
      setActionError("Could not submit report.");
    } finally {
      setReporting(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShowMenu(false);
  };

  const downloadImage = async () => {
    if (!item) return;
    try {
      const response = await fetch(item.imageUrl);
      if (!response.ok) throw new Error("Download failed");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${item.title.replace(/\s+/g, "_") || "chitram_post"}.${item.mimeType?.split("/")[1] || "jpg"}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setShowMenu(false);
    } catch {
      setActionError("Could not download this image.");
    }
  };

  if (loading) return <PinDetailSkeleton />;
  if (error || !item) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f1e9] px-6 text-[#1f2925]">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{error === "not-found" ? "Pin not found" : "Could not load this pin"}</h1>
          <button type="button" onClick={() => router.back()} className="mt-5 rounded-full bg-[#1f2925] px-5 py-2.5 text-sm font-semibold text-white">Go back</button>
        </div>
      </main>
    );
  }

  const ratio = item.aspectRatio ? Number(item.aspectRatio) : item.width && item.height ? item.width / item.height : 0.75;
  const creatorLabel = item.creatorName || item.creatorUsername || "Chitram creator";

  return (
    <main className="min-h-screen bg-[#f5f1e9] px-3 py-4 text-[#1f2925] sm:px-8 sm:py-5 lg:px-12">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" aria-label="Chitram home"><img src="/name.png" alt="Chitram" className="h-9 w-32 translate-y-1 object-cover object-center sm:h-11 sm:w-40" /></Link>
      </header>

      <article className="mx-auto mt-5 max-w-7xl animate-fade-in sm:mt-8">
        <div className="grid items-start gap-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5 lg:gap-6 xl:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="relative flex w-full items-center justify-center overflow-visible rounded-2xl border border-[#e4dcd3] bg-[#e6e0d6] sm:aspect-[var(--pin-ratio)] sm:max-h-[calc(100vh-18rem)] sm:rounded-3xl" style={{ "--pin-ratio": ratio } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.title || "Chitram pin"} className="block h-auto w-full rounded-2xl sm:max-h-full sm:max-w-full sm:rounded-3xl sm:object-contain" fetchPriority="high" />
              <button type="button" onClick={() => router.back()} className="absolute left-2.5 top-2.5 z-10 rounded-full border border-[#d8ded8] bg-white/95 px-3.5 py-2 text-xs font-semibold shadow-sm hover:bg-white sm:left-4 sm:top-4 sm:px-4 sm:text-sm">Back</button>
              <div className="absolute bottom-2.5 right-2.5 z-10 sm:bottom-4 sm:right-4">
                <button type="button" onClick={() => setShowMenu((open) => !open)} aria-label="More pin options" aria-expanded={showMenu} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8ded8] bg-white/95 text-lg shadow-sm hover:bg-white sm:h-11 sm:w-11">⋮</button>
                {showMenu && <div role="menu" className="absolute right-0 top-13 z-20 w-44 rounded-xl border border-[#d8ded8] bg-white p-1 text-sm font-semibold shadow-[0_10px_24px_rgba(31,41,37,0.14)]"><button type="button" role="menuitem" onClick={() => { setShowReport(true); setShowMenu(false); }} disabled={!session} className="block h-10 w-full rounded-lg px-3 text-left text-[#a84f37] hover:bg-[#fff5f2] disabled:opacity-50">Report</button><button type="button" role="menuitem" onClick={copyLink} className="block h-10 w-full rounded-lg px-3 text-left hover:bg-[#f5f1e9]">Copy link</button><button type="button" role="menuitem" onClick={downloadImage} className="block h-10 w-full rounded-lg px-3 text-left hover:bg-[#f5f1e9]">Download image</button></div>}
              </div>
            </div>

            <div className="mt-4 pt-1 sm:mt-5">
            <Link href={item.creatorUsername ? `/account/${item.creatorUsername}` : `/account/${item.uploadedBy || ""}`} className="flex items-center gap-3 rounded-2xl py-2 hover:opacity-80">
              <Avatar src={item.creatorPictureUrl} name={creatorLabel} size="md" />
              <span className="min-w-0"><span className="block truncate font-bold">{creatorLabel}</span>{item.creatorUsername && <span className="block truncate text-sm text-[#68736d]">@{item.creatorUsername}</span>}</span>
            </Link>

            <div className="mt-4 flex items-center gap-2 sm:mt-6">
              <button type="button" onClick={handleLike} disabled={!session || isLiking} aria-label={liked ? "Unlike pin" : "Like pin"} aria-pressed={liked} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${liked ? "border-[#d2643b] bg-[#fff0e9] text-[#b85029]" : "border-[#d8ded8] bg-white hover:border-[#1f2925]"} disabled:cursor-not-allowed disabled:opacity-60`}><span aria-hidden="true" className="text-lg">{liked ? "♥" : "♡"}</span>{likeCount}</button>
              <button type="button" onClick={handleSave} disabled={!session || isSaving} aria-label={saved ? "Remove pin from saved posts" : "Save pin"} aria-pressed={saved} className={`rounded-full px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${saved ? "bg-[#1f2925] text-white" : "bg-[#d2643b] text-white hover:bg-[#b85029]"}`}>{saved ? "Saved" : "Save"}</button>
            </div>
            {actionError && <p role="alert" className="mt-2 text-sm text-[#a84f37]">{actionError}</p>}

            {item.title && <h1 className="mt-5 text-2xl font-bold tracking-tight sm:mt-7 sm:text-3xl">{item.title}</h1>}
            {item.description && <p className="mt-3 max-w-prose text-sm leading-7 text-[#68736d]">{item.description}</p>}

            {showReport && <form onSubmit={handleReport} className="mt-6 rounded-2xl border border-[#e4dcd3] bg-white p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Report pin</h2><button type="button" onClick={() => setShowReport(false)} className="text-xs font-semibold text-[#68736d]">Cancel</button></div><select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-3 w-full rounded-xl border border-[#d8ded8] bg-white px-3 py-2 text-sm">{REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} rows={3} maxLength={1000} placeholder="Additional details (optional)" className="mt-2 w-full resize-none rounded-xl border border-[#d8ded8] px-3 py-2 text-sm" /><button type="submit" disabled={reporting} className="mt-3 w-full rounded-xl bg-[#1f2925] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{reporting ? "Submitting..." : "Submit report"}</button></form>}
            </div>
          </div>

          <div className="mt-1 sm:col-span-2 lg:col-span-3 lg:mt-0 xl:col-span-4">
            {recommendationsLoading ? (
              <div className="columns-2 gap-4 space-y-4">{[0, 1, 2, 3].map((index) => <div key={`recommendation-skeleton-${index}`} className="mb-4 break-inside-avoid aspect-[4/5] animate-shimmer rounded-2xl bg-[#e4dcd3]" />)}</div>
            ) : (
              <div className="columns-2 gap-2.5 space-y-3 sm:gap-4 sm:space-y-4 lg:columns-3 xl:columns-4">
                {recommendations.map((recommendation) => <PinCard key={recommendation.id} item={recommendation} currentUserId={session?.id} initiallySaved={false} onSaveToggle={handleSaveRecommendation} onLikeToggle={handleLikeRecommendation} onReport={handleReportRecommendation} />)}
              </div>
            )}
          </div>
        </div>
      </article>
    </main>
  );

  async function handleSaveRecommendation(pinId: number, shouldSave: boolean) {
    await apiClient(`/user/saved/${pinId}`, { method: shouldSave ? "POST" : "DELETE" });
  }

  async function handleLikeRecommendation(pinId: number, shouldLike: boolean) {
    return apiClient<{ liked: boolean; likeCount: number }>(`/pins/${pinId}/like`, { method: shouldLike ? "POST" : "DELETE" });
  }

  async function handleReportRecommendation(pinId: number, reason: string, description: string) {
    await apiClient("/reports", { method: "POST", body: JSON.stringify({ targetType: "PIN", targetId: pinId, reason, description }) });
  }
}

function PinDetailSkeleton() {
  return <main className="min-h-screen bg-[#f5f1e9] px-4 py-6 sm:px-8"><div className="mx-auto max-w-7xl"><div className="h-11 w-40 animate-shimmer rounded-xl" /><div className="mx-auto mt-8 max-w-6xl animate-pulse lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-12"><div className="aspect-[3/4] rounded-3xl bg-[#e4dcd3]" /><div className="mt-7 space-y-4 lg:mt-0"><div className="h-12 w-48 rounded-full bg-[#e4dcd3]" /><div className="h-12 w-full rounded-xl bg-[#e4dcd3]" /><div className="h-10 w-2/3 rounded-xl bg-[#e4dcd3]" /></div></div></div></main>;
}

