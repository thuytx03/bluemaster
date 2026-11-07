import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { PostsTab } from "src/modules/content/components/posts/PostsTab"
import { usePosts } from "src/modules/content/hooks/usePosts"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { Badge, Callout } from "src/modules/shared/ui"

/** Port of xthuy-social `modules/extension/facebook/posts/Panel`. */
export function PostsPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const { state, error, posts, hasNextPage, endCursor, load, runAction } = usePosts()

  useEffect(() => {
    if (profile?.uid) {
      load({ cursor: null, accumulate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3">
      {posts.length > 0 && (
        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <Badge tone="info">{t("posts_loaded_count", { count: posts.length })}</Badge>
        </div>
      )}

      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      <PostsTab
        posts={posts}
        state={state}
        hasNextPage={hasNextPage}
        endCursor={endCursor}
        load={load}
        runAction={runAction}
      />
    </div>
  )
}
