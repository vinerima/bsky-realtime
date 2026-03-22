import { z } from "zod"

const uriCidSchema = z.object({
  cid: z.string(),
  uri: z.string(),
})

export const websocketMessageSchema = z.object({
  at_uri: z.string(),
  did: z.string(),
  time_us: z.number().nullable(),
  message: z.object({
    did: z.string(),
    time_us: z.number(),
    kind: z.string(),
    commit: z.object({
      rev: z.string(),
      operation: z.string(),
      collection: z.string(),
      rkey: z.string(),
      record: z.object({
        $type: z.string(),
        createdAt: z.string(),
        subject: z.string().optional(),
        reply: z
          .object({
            root: uriCidSchema,
            parent: uriCidSchema,
          })
          .optional(),
        text: z.string().optional(),
        embed: z.unknown().optional(),
        langs: z.array(z.string()).optional(),
      }),
      cid: z.string(),
    }),
  }),
  hydrated_metadata: z.object({
    user: z.object({
      did: z.string(),
      handle: z.string(),
      avatar: z.string().nullable().optional(),
      banner: z.string().nullable().optional(),
      created_at: z.string(),
      description: z.string().nullable().optional(),
      display_name: z.string(),
      followers_count: z.number(),
      follows_count: z.number(),
      indexed_at: z.string().nullable().optional(),
      labels: z.array(z.unknown()),
      posts_count: z.number(),
      verification: z.unknown().nullable().optional(),
      viewer: z.object({
        blocked_by: z.boolean(),
        blocking: z.unknown().nullable().optional(),
        blocking_by_list: z.unknown().nullable().optional(),
        followed_by: z.unknown().nullable().optional(),
        following: z.unknown().nullable().optional(),
        known_followers: z.unknown().nullable().optional(),
        muted: z.boolean(),
        muted_by_list: z.unknown().nullable().optional(),
      }),
    }),
  }),
}).passthrough()

export type WebsocketMessage = z.infer<typeof websocketMessageSchema>
