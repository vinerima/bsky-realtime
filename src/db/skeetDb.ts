import Dexie, { type EntityTable } from "dexie"
import type { Post } from "@/types/post"

const db = new Dexie("bsky-realtime") as Dexie & {
  posts: EntityTable<Post, "id">
}

db.version(1).stores({
  posts: "++id, uri, authorDid, createdAt",
})

export async function addPost(post: Post): Promise<number | undefined> {
  const existing = await db.posts.where("uri").equals(post.uri).first()
  if (existing) return existing.id
  return db.posts.add(post)
}

export async function getPostsPage(page: number, pageSize: number): Promise<Post[]> {
  const offset = (page - 1) * pageSize
  return db.posts.orderBy("id").reverse().offset(offset).limit(pageSize).toArray()
}

export async function getTotalCount(): Promise<number> {
  return db.posts.count()
}

export async function clearAllPosts(): Promise<void> {
  return db.posts.clear()
}

export { db }
