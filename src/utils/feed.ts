import type { WebsocketMessage } from '@/types/message'
import type { Post } from '@/types/post'

/**
 * Converts a raw WebSocket message into a `FeedEntry` object, if possible.
 *
 * This function checks if the incoming WebSocket data is structured like a feed commit message
 * with the required properties for a created post. If the data matches the expected shape,
 * it extracts and returns a `FeedEntry` object. Otherwise, it returns `null`.
 *
 * @param data - The raw WebSocket data.
 * @returns A `FeedEntry` object if the data represents a newly created post, otherwise `null`.
 */
export function websocketToFeedEntry(data: unknown): Post | null {
  const wsData = JSON.parse(data as string) as WebsocketMessage
  const message = wsData.message
  const metaData = wsData.hydrated_metadata
  if (
    !message.commit ||
    !message.commit.record ||
    !message.commit.record['$type'] ||
    !message.did ||
    !message.commit.cid ||
    !message.commit.rkey ||
    message.commit.operation !== 'create'
  ) {
    return null
  }
  const messageUri = `at://${message.did}/${message.commit.record['$type']}/${message.commit.rkey}`
  return {
    cid: message.commit.cid,
    uri: messageUri,
    authorDid: message.did,
    authorHandle: metaData.user.handle,
    authorAvatar: metaData.user.avatar,
    authorBanner: metaData.user.banner,
    text: message.commit.record.text,
    embed: message.commit.record.embed,
    rootCid: message.commit.record.reply?.root.cid ?? message.commit.cid,
    rootUri: message.commit.record.reply?.root.uri ?? messageUri,
  }
}
