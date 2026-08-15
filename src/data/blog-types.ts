/**
 * Unified blog types — supports both static (hand-written) and AI-generated posts.
 * The `isAiGenerated` discriminant lets the UI render them differently.
 */

import type { BlogPost, BlogCategory, BlogSection } from '@/data/blog-posts'

// ─── Static blog post (original, no extra fields) ────────────────────
export type StaticBlogPost = BlogPost & { isAiGenerated?: false }

// ─── AI-generated blog post ──────────────────────────────────────────
export interface AIBlogPost {
  slug: string
  title: string
  description: string
  excerpt: string
  category: BlogCategory
  tags: string[]
  author: string
  authorRole: string
  publishedAt: string // ISO date
  updatedAt?: string
  readingTime: number // minutes
  metaTitle: string
  metaDescription: string
  keywords: string[]
  heroGradient: string // tailwind gradient classes
  heroEmoji: string
  heroImage?: string // path to hero image
  /** AI articles store content as HTML string (markdown rendered) */
  contentHtml?: string
  /** Structured sections are not used for AI articles */
  content?: BlogSection[]
  keyTakeaways: string[]
  isAiGenerated: true // discriminant — always true for AI posts
}

// ─── Unified type for the blog listing ──────────────────────────────
export type UnifiedBlogPost = StaticBlogPost | AIBlogPost

/** Type guard — checks if a post is AI-generated */
export function isAIPost(post: UnifiedBlogPost): post is AIBlogPost {
  return post.isAiGenerated === true
}
