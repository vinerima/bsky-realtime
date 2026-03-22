/**
 * Represents a feed entry in the system.
 *
 * - `uri`: The unique resource identifier for the entry.
 * - `cid`: The content identifier (CID) associated with this entry.
 * - `authorDid`: The Decentralized Identifier (DID) of the author who created the entry.
 * - `text`: The textual content of the entry.
 * - `rootUri`: The URI of the root entry in the conversation or thread.
 * - `rootCid`: The CID of the root entry.
 * - `indexedAt`: An optional `Date` indicating when the entry was indexed.
 */
export type Post = {
  uri: string
  cid: string
  authorDid: string
  authorHandle?: string
  authorAvatar?: string
  authorBanner?: string
  text: string
  embed: unknown
  langs?: string[]
  rootUri: string
  rootCid: string
  createdAt?: Date
}
