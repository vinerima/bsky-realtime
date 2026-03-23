import type { WebsocketMessage } from '@/types/message'
import type { Post } from '@/types/post'

/**
 * Converts a validated WebSocket message into a Post, if possible.
 *
 * Returns null if the message is not a "create" operation or lacks required fields.
 */
export function websocketMessageToPost(data: WebsocketMessage): Post | null {
  const message = data.message
  const metaData = data.hydrated_metadata

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
    authorAvatar: metaData.user.avatar ?? undefined,
    authorBanner: metaData.user.banner ?? undefined,
    text: message.commit.record.text ?? '',
    embed: message.commit.record.embed,
    langs: message.commit.record.langs,
    rootCid: message.commit.record.reply?.root.cid ?? message.commit.cid,
    rootUri: message.commit.record.reply?.root.uri ?? messageUri,
  }
}
