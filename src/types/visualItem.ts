export interface VisualItem {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  imagePath?: string | null;
  width?: number | null;
  height?: number | null;
  aspectRatio?: number | null;
  fileSize?: number | null;
  mimeType?: string | null;
  description?: string | null;
  createdAt?: string | null;
  uploadedBy?: number | null;
  creatorName?: string | null;
  creatorUsername?: string | null;
  creatorPictureUrl?: string | null;
  likeCount?: number;
  likedByCurrentUser?: boolean;
}

export interface VisualFeedResponse {
  items: VisualItem[];
  nextCursor: number | null;
  hasMore: boolean;
}
