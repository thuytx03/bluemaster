import { Search } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { PostRow } from "src/modules/automation/components/comment-hunter/PostRow"
import type { CommentHunter } from "src/modules/automation/hooks/useCommentHunter"
import type {
  CkAuthorFilter,
  CkCategoryFilter
} from "src/modules/automation/types/comment-hunter.types"
import { filterPostsByCategory } from "src/modules/automation/utils/comment-hunter.util"
import {
  Button,
  Checkbox,
  Field,
  Input,
  NumberInput,
  Segmented,
  Select
} from "src/modules/shared/ui"

type AuthorOption = "everyone" | "friends" | "public"

/** Step 1 of the source Panel: search posts and pick the ones to comment on. */
export function SearchStep({
  hunter,
  onNext
}: {
  hunter: CommentHunter
  onNext: () => void
}) {
  const { t } = useTranslation()
  const {
    state,
    searchStatus,
    posts,
    selected,
    categoryFilter,
    setCategoryFilter,
    searchPosts,
    toggleSelect,
    selectAll
  } = hunter

  const [keyword, setKeyword] = useState("")
  const [limit, setLimit] = useState<number | null>(10)
  const [recentPosts, setRecentPosts] = useState(true)
  const [authorFilter, setAuthorFilter] = useState<AuthorOption>("public")

  const isSearching = state === "searching"
  const rows = filterPostsByCategory(posts, categoryFilter)
  const allChecked = rows.length > 0 && rows.every(({ i }) => selected.has(i))
  const someChecked = !allChecked && rows.some(({ i }) => selected.has(i))

  const handleSearch = () => {
    if (!keyword.trim()) {
      toast.error(t("comment_hunter_toast_enter_keyword"))
      return
    }
    void searchPosts({
      keyword,
      limit: Math.max(1, limit ?? 10),
      recentPosts,
      authorFilter: (authorFilter === "everyone"
        ? ""
        : authorFilter) as CkAuthorFilter
    })
  }

  const resultCountLabel = () => {
    if (categoryFilter === "all")
      return t("comment_hunter_result_count_all", { count: posts.length })
    const category =
      categoryFilter === "group"
        ? t("comment_hunter_category_group")
        : t("comment_hunter_category_page")
    return t("comment_hunter_result_count_filtered", {
      shown: rows.length,
      total: posts.length,
      category
    })
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <div className="bm-flex bm-flex-col bm-gap-2.5 bm-rounded-xl bm-border bm-border-line bm-bg-surface-2/40 bm-p-2.5">
        <Field label={t("comment_hunter_label_keyword")}>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder={t("comment_hunter_placeholder_keyword")}
            disabled={isSearching}
            prefix={<Search size={13} />}
          />
        </Field>

        <div className="bm-flex bm-flex-wrap bm-items-end bm-gap-2">
          <Field
            label={t("comment_hunter_label_post_count")}
            className="bm-w-24">
            <NumberInput
              value={limit}
              onChange={setLimit}
              min={1}
              max={50}
              disabled={isSearching}
            />
          </Field>
          <Select<AuthorOption>
            value={authorFilter}
            onChange={setAuthorFilter}
            disabled={isSearching}
            className="bm-min-w-[150px] bm-flex-1"
            options={[
              { value: "everyone", label: t("comment_hunter_author_everyone") },
              { value: "friends", label: t("comment_hunter_author_friends") },
              { value: "public", label: t("comment_hunter_author_public") }
            ]}
          />
        </div>

        <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-2">
          <Checkbox
            checked={recentPosts}
            onChange={setRecentPosts}
            disabled={isSearching}
            label={t("comment_hunter_label_recent_posts")}
          />
          <Button
            variant="primary"
            onClick={handleSearch}
            loading={isSearching}
            icon={<Search size={14} />}>
            {isSearching
              ? t("comment_hunter_button_searching")
              : t("comment_hunter_button_search")}
          </Button>
        </div>
      </div>

      {searchStatus && (
        <p className="bm-text-[12px] bm-text-fg-muted">{searchStatus}</p>
      )}

      {posts.length > 0 && (
        <div className="bm-flex bm-flex-col bm-gap-2">
          <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-2">
            <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-3">
              <Checkbox
                checked={allChecked}
                indeterminate={someChecked}
                onChange={(v) => selectAll(posts, categoryFilter, v)}
                label={
                  <span className="bm-font-semibold">
                    {t("comment_hunter_select_all")}
                  </span>
                }
              />
              <span className="bm-text-[12px] bm-font-medium bm-text-fg-muted">
                {resultCountLabel()}
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={onNext}
              disabled={selected.size === 0}>
              {t("comment_hunter_button_continue")}
            </Button>
          </div>

          <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
            <span className="bm-text-[11px] bm-font-semibold bm-uppercase bm-tracking-wider bm-text-fg-muted">
              {t("comment_hunter_label_category")}
            </span>
            <Segmented<CkCategoryFilter>
              size="sm"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: t("comment_hunter_category_all") },
                { value: "group", label: t("comment_hunter_category_group") },
                { value: "page", label: t("comment_hunter_category_page") }
              ]}
            />
          </div>

          <div className="bm-max-h-[520px] bm-overflow-y-auto bm-rounded-xl bm-border bm-border-line bm-bg-surface">
            {rows.map(({ p, i }) => (
              <PostRow
                key={p.postId + i}
                post={p}
                selected={selected.has(i)}
                onToggle={() => toggleSelect(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
