import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { Step1Groups } from "src/modules/automation/components/post-campaign/Step1Groups"
import { Step2Compose } from "src/modules/automation/components/post-campaign/Step2Compose"
import { Step3Confirm } from "src/modules/automation/components/post-campaign/Step3Confirm"
import { Step4Running } from "src/modules/automation/components/post-campaign/Step4Running"
import { StepIndicator } from "src/modules/automation/components/post-campaign/StepIndicator"
import { usePostCampaign } from "src/modules/automation/hooks/usePostCampaign"
import { usePostCampaignGroups } from "src/modules/automation/hooks/usePostCampaignGroups"
import { usePostCampaignStatusBackgrounds } from "src/modules/automation/hooks/usePostCampaignStatusBackgrounds"
import { usePostCampaignStore } from "src/modules/automation/hooks/usePostCampaignStore"
import type { PostConfig } from "src/modules/automation/types/post-campaign.types"
import {
  POST_CAMPAIGN_DELAY_DEFAULTS,
  POST_CAMPAIGN_DELAY_KEY
} from "src/modules/automation/utils/post-campaign.util"
import { getDelayConfig } from "src/modules/facebook/utils/delay-config.util"

/** 4-step wizard: pick groups → compose posts → confirm → run with live log. */
export function PostCampaignPanel() {
  const { t } = useTranslation()
  const {
    runState,
    error,
    progress,
    logs,
    countdown,
    statusMsg,
    post,
    pause,
    resume,
    stop,
    reset
  } = usePostCampaign()
  const {
    groups: allGroups,
    loading: groupsLoading,
    syncing: groupsSyncing,
    syncProgress,
    error: groupsError,
    lastSyncedAt,
    fetchGroups,
    syncFromFacebook,
    clearGroups
  } = usePostCampaignGroups()
  const bgCategories = usePostCampaignStatusBackgrounds()
  const store = usePostCampaignStore()
  const { step, setStep, posts, selectedGroups, resetCampaign } = store

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  // The wizard store outlives the page but a run stops when the page unmounts:
  // coming back mid-run lands on the confirm step instead of an empty run view
  useEffect(() => {
    if (usePostCampaignStore.getState().step === 4) setStep(3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleStart() {
    setStep(4)
    const validPosts = posts.filter((p) => p.content.trim())
    if (!validPosts.length) return

    const dc = getDelayConfig(
      POST_CAMPAIGN_DELAY_KEY,
      POST_CAMPAIGN_DELAY_DEFAULTS
    )
    const config: PostConfig = {
      campaignName: store.campaignName,
      groups: selectedGroups,
      posts: validPosts.map((p) => ({
        content: p.content,
        images: p.images,
        video: p.video,
        videoLinkUrl: p.videoLinkUrl || undefined,
        shareLinkUrl: p.shareLinkUrl || undefined,
        statusBgIds: p.statusBgIds.length > 0 ? p.statusBgIds : undefined,
        checkinPlaceId: p.checkin?.id ?? null,
        feelingObjectId: p.feeling?.objectId ?? null
      })),
      delayMin: dc.minDelay,
      delayMax: dc.maxDelay,
      restAfterN: dc.sleepAfter,
      restMinutes: Math.round(dc.minSleep / 60),
      skipAfterErrors: store.skipAfterErrors,
      maxGroups: store.maxGroups,
      groupOrder: store.groupOrder,
      signature: store.signature,
      commentAfterPost: store.commentAfterPost,
      commentImage: store.commentImage,
      reactAfterPost: store.reactAfterPost,
      randomPickOneImage: store.randomPickOneImage,
      requestAdminPermission: store.requestAdminPermission,
      requestAdminPermissionTone: store.requestAdminPermissionTone,
      anonymous: store.anonymous
    }

    await post(config)
  }

  function handleNewCampaign() {
    reset()
    resetCampaign(t)
  }

  const running =
    step === 4 && (runState === "running" || runState === "paused")

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <StepIndicator
        steps={[
          { n: 1, label: t("campaign_manager_step_select_groups") },
          { n: 2, label: t("campaign_manager_step_compose") },
          { n: 3, label: t("campaign_manager_step_confirm") },
          { n: 4, label: t("campaign_manager_step_posting") }
        ]}
        current={step}
        onBack={
          step > 1 && step < 4
            ? () => setStep((step - 1) as 1 | 2 | 3)
            : undefined
        }
        backDisabled={running}
      />

      {step === 1 && (
        <Step1Groups
          groups={allGroups}
          loading={groupsLoading}
          syncing={groupsSyncing}
          syncProgress={syncProgress}
          error={groupsError}
          lastSyncedAt={lastSyncedAt}
          onSync={() => void syncFromFacebook()}
          onClearData={() => void clearGroups()}
        />
      )}

      {step === 2 && (
        <Step2Compose allGroups={allGroups} bgCategories={bgCategories} />
      )}

      {step === 3 && <Step3Confirm onStart={() => void handleStart()} />}

      {step === 4 && (
        <Step4Running
          campaignName={store.campaignName}
          runState={runState}
          progress={progress}
          logs={logs}
          countdown={countdown}
          statusMsg={statusMsg}
          error={error}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onNewCampaign={handleNewCampaign}
        />
      )}
    </div>
  )
}
