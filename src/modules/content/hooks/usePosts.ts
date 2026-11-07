import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import postsService from "src/modules/content/services/posts.service"
import type { Post, PostAction, PostsLoadOptions, PostsLoadState } from "src/modules/content/types/posts.types"
import { CACHE_TIME, getMyUid } from "src/modules/facebook/services/fb-graphql.service"
import { getFromLocalStorageWithExpiry, saveToLocalStorageWithExpiry } from "src/utils/storage.util"

const cacheKeyOf = (uid: string) => `fb_manage_posts_${uid}`

/** Port of xthuy-social `usePosts`: state, 1-day localStorage cache and the per-post actions. */
export const usePosts = () => {
  const { t } = useTranslation()
  const [state, setState] = useState<PostsLoadState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [hasNextPage, setHasNextPage] = useState(false)
  const [endCursor, setEndCursor] = useState<string | null>(null)

  const load = useCallback(
    async ({ cursor = null, accumulate = false, forceRefresh = false }: PostsLoadOptions = {}): Promise<void> => {
      setState("loading")
      setError(null)

      if (!accumulate && cursor === null) {
        setPosts([])
      }

      try {
        const uid = getMyUid()
        if (!uid) {
          throw new Error(t("posts_error_not_logged_in"))
        }

        const cacheKey = cacheKeyOf(uid)
        if (!forceRefresh && !accumulate && cursor === null) {
          const cachedData = getFromLocalStorageWithExpiry<Post[]>(cacheKey)
          if (cachedData !== null) {
            setPosts(cachedData)
            setState("success")
            return
          }
        }

        const result = await postsService.fetchAllPosts(uid, cursor, accumulate ? posts : [], (list, nextCursor, hasNext) => {
          setPosts(list)
          setEndCursor(nextCursor)
          setHasNextPage(hasNext)
        })
        if (result.complete) {
          saveToLocalStorageWithExpiry(cacheKey, result.list, CACHE_TIME.ONE_DAY)
        }
        setState("success")
      } catch (err) {
        setState("error")
        setError(err instanceof Error ? err.message : t("posts_error_load_failed"))
      }
    },
    [posts, t]
  )

  /** Runs an action and, on success, drops the story from the list and the cache. */
  const runAction = useCallback(async (type: PostAction, storyId: string): Promise<boolean> => {
    const uid = getMyUid()
    if (!uid) return false

    const success = await postsService.runPostAction(uid, type, storyId)
    if (success) {
      setPosts((prev) => prev.filter((p) => p.storyId !== storyId))
      const cacheKey = cacheKeyOf(uid)
      const cached = getFromLocalStorageWithExpiry<Post[]>(cacheKey)
      if (cached) {
        saveToLocalStorageWithExpiry(
          cacheKey,
          cached.filter((p) => p.storyId !== storyId),
          CACHE_TIME.ONE_DAY
        )
      }
    }
    return success
  }, [])

  return {
    state,
    error,
    posts,
    hasNextPage,
    endCursor,
    load,
    runAction,
    deletePost: (storyId: string) => runAction("delete", storyId),
    hidePost: (storyId: string) => runAction("hide", storyId),
    untagPost: (storyId: string) => runAction("untag", storyId),
    trashPost: (storyId: string) => runAction("trash", storyId),
    archivePost: (storyId: string) => runAction("archive", storyId)
  }
}
