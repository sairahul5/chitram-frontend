"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "@/lib/apiClient";
import { VisualItem } from "@/types/visualItem";

interface PinUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPin: VisualItem) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MIN_RESOLUTION_PX = 400;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_EXTENSIONS = ".jpg, .jpeg, .png, .webp, .avif";

export function PinUploadModal({ isOpen, onClose, onSuccess }: PinUploadModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Photography");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);

    // 1. MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type.toLowerCase())) {
      setError("Unsupported format. Please upload a JPEG, PNG, WebP, or AVIF image.");
      return;
    }

    // 2. File size validation (10MB)
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      setError(`File is too large (${sizeMB} MB). The maximum allowed size is 10 MB.`);
      return;
    }

    // 3. Inspect image resolution and natural aspect ratio
    const objectUrl = URL.createObjectURL(selectedFile);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (width < MIN_RESOLUTION_PX || height < MIN_RESOLUTION_PX) {
        URL.revokeObjectURL(objectUrl);
        setError(
          `Image resolution is too low (${width} × ${height} px). Minimum required is ${MIN_RESOLUTION_PX} × ${MIN_RESOLUTION_PX} px.`
        );
        return;
      }

      const aspectRatio = Number((width / height).toFixed(4));
      setFile(selectedFile);
      setPreviewUrl(objectUrl);
      setDimensions({ width, height, aspectRatio });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Unable to read image. The file may be corrupted.");
    };

    img.src = objectUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setDimensions(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setError("Upload cancelled by user.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !dimensions) {
      setError("Please select a valid image before publishing.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a title for your post.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    if (description.trim()) {
      formData.append("description", description.trim());
    }
    formData.append("image", file);
    formData.append("width", String(dimensions.width));
    formData.append("height", String(dimensions.height));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await apiClient<VisualItem>("/visual-items", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      handleClear();
      setTitle("");
      setDescription("");
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Upload was cancelled.");
      } else {
        const msg = err instanceof Error ? err.message : "Upload failed. Please retry.";
        setError(msg);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          onClose();
        }
      }}
    >
      <div
        className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e4dcd3] bg-white p-4 shadow-2xl animate-scale-in sm:my-8 sm:max-h-none sm:overflow-visible sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0eee6] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1f2925]">Create New Post</h2>
            <p className="mt-0.5 text-xs text-[#68736d]">
              Upload to Supabase Storage with original aspect ratio preservation
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#68736d] hover:bg-[#fafaf7] hover:text-[#1f2925] transition disabled:opacity-40"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Dropzone & Preview */}
          {!previewUrl ? (
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition ${isDragging
                ? "border-[#d2643b] bg-[#fbebe4]/50"
                : "border-[#ccd4cd] bg-[#fafaf7] hover:border-[#1f2925] hover:bg-[#f5f1e9]/60"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border border-[#e4dcd3]">
                🖼️
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1f2925]">
                Drag & drop or <span className="text-[#d2643b] underline">browse image</span>
              </p>
              <p className="mt-1 text-xs text-[#68736d]">
                Allowed: JPEG, PNG, WebP, AVIF • Max 10 MB • Min 400 × 400 px
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-[#e4dcd3] bg-[#fafaf7] p-3 sm:flex-row sm:gap-5 sm:p-4">
              {/* Preserved Natural Ratio Thumbnail */}
              <div
                className="relative w-full max-w-[200px] overflow-hidden rounded-2xl bg-[#e6e0d6] shadow-sm"
                style={{ aspectRatio: `${dimensions?.aspectRatio || 1}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Metadata Badges */}
              <div className="flex-1 space-y-2 text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 break-all text-xs font-bold uppercase tracking-wider text-[#1f2925]">
                    {file?.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isUploading}
                    className="text-xs font-semibold text-[#a84f37] hover:underline"
                  >
                    Change Image
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-white border border-[#d8ded8] px-2.5 py-0.5 font-medium text-[#1f2925]">
                    📐 {dimensions?.width} × {dimensions?.height} px
                  </span>
                  <span className="rounded-full bg-white border border-[#d8ded8] px-2.5 py-0.5 font-medium text-[#1f2925]">
                    ⚖️ {((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="rounded-full bg-white border border-[#d8ded8] px-2.5 py-0.5 font-medium text-[#1f2925]">
                    🔄 Ratio: {dimensions?.aspectRatio}
                  </span>
                </div>
                <p className="text-[11px] text-[#68736d]">
                  ✓ Image proportions locked. Ready to store in Supabase Storage.
                </p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#68736d]" htmlFor="pin-title">
                Title *
              </label>
              <input
                id="pin-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post an inspiring title"
                required
                disabled={isUploading}
                className="mt-1.5 w-full rounded-2xl border border-[#d8ded8] bg-[#fafaf7] px-4 py-2.5 text-sm text-[#1f2925] outline-none focus:border-[#1f2925] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#68736d]" htmlFor="pin-category">
                Category
              </label>
              <select
                id="pin-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isUploading}
                className="mt-1.5 w-full rounded-2xl border border-[#d8ded8] bg-[#fafaf7] px-4 py-2.5 text-sm text-[#1f2925] outline-none focus:border-[#1f2925] focus:bg-white transition"
              >
                <option value="Photography">Photography</option>
                <option value="Travel">Travel</option>
                <option value="Architecture">Architecture</option>
                <option value="Nature">Nature</option>
                <option value="Art & Design">Art & Design</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Culture">Culture</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#68736d]" htmlFor="pin-desc">
              Description (Optional)
            </label>
            <textarea
              id="pin-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this visual creation special? (optional)"
              rows={2}
              disabled={isUploading}
              className="mt-1.5 w-full rounded-2xl border border-[#d8ded8] bg-[#fafaf7] px-4 py-2 text-sm text-[#1f2925] outline-none focus:border-[#1f2925] focus:bg-white transition resize-none"
            />
          </div>

          {/* Error / Retry Box */}
          {error && (
            <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-[#e8b9ad] bg-[#fff5f2] p-4 text-xs font-medium text-[#a84f37] animate-fade-in sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading || !file}
                className="rounded-full bg-[#a84f37] text-white px-3 py-1 text-[11px] font-bold hover:bg-[#8e3f2a] active:scale-95 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Progress / Status */}
          {isUploading && (
            <div className="space-y-2 rounded-2xl bg-[#edf3ee] p-4 border border-[#b7dfc8] animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-[#2c6e49]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#2c6e49] border-t-transparent" />
                  <span>Uploading to Supabase Storage...</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="text-[#a84f37] hover:underline text-[11px]"
                >
                  Cancel
                </button>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                <div className="h-full bg-[#3b795c] animate-shimmer" style={{ width: "100%" }} />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-full border border-[#d8ded8] px-5 py-2.5 text-sm font-semibold text-[#68736d] hover:bg-[#fafaf7] transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="rounded-full bg-[#1f2925] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2e3b36] active:scale-95 disabled:opacity-50 transition inline-flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Publishing...</span>
                </>
              ) : (
                "Publish Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
