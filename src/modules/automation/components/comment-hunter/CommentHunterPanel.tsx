import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { CommentStep } from "src/modules/automation/components/comment-hunter/CommentStep"
import { SearchStep } from "src/modules/automation/components/comment-hunter/SearchStep"
import { useCommentHunter } from "src/modules/automation/hooks/useCommentHunter"
import type { CkPost } from "src/modules/automation/types/comment-hunter.types"

/** Port of xthuy-social `comment-hunter/Panel`: step 1 search & select, step 2 comment. */
export function CommentHunterPanel() {
  const { t } = useTranslation()
  const hunter = useCommentHunter()
  const { posts, selected } = hunter
  const [step, setStep] = useState<1 | 2>(1)

  const selectedPosts = Array.from(selected)
    .map((i) => posts[i])
    .filter(Boolean) as CkPost[]

  const handleNext = () => {
    if (selected.size === 0) {
      toast.error(t("comment_hunter_toast_no_post_selected"))
      return
    }
    setStep(2)
  }

  return step === 1 ? (
    <SearchStep hunter={hunter} onNext={handleNext} />
  ) : (
    <CommentStep
      hunter={hunter}
      selectedPosts={selectedPosts}
      onBack={() => setStep(1)}
    />
  )
}
