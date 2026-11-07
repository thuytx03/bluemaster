import { MapPin, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { usePostCampaignCheckinSearch } from "src/modules/automation/hooks/usePostCampaignCheckinSearch"
import type { CheckinPlace } from "src/modules/automation/types/post-campaign.types"
import { Button, cn, Input, Modal, Spinner } from "src/modules/shared/ui"

interface Props {
  selected: CheckinPlace | null
  onSelect: (place: CheckinPlace | null) => void
  onClose: () => void
}

export function CheckinSearch({ selected, onSelect, onClose }: Props) {
  const { t } = useTranslation()
  const { query, setQuery, results, loading } = usePostCampaignCheckinSearch()

  return (
    <Modal
      open
      closeLabel={t("campaign_manager_done")}
      title={t("campaign_manager_search_location_title")}
      onClose={onClose}>
      <div className="bm-flex bm-flex-col bm-gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefix={<Search size={13} />}
          placeholder={t("campaign_manager_where_are_you_placeholder")}
          autoFocus
        />

        {selected && (
          <div className="bm-flex bm-items-center bm-justify-between bm-gap-2 bm-rounded-lg bm-bg-brand-soft bm-px-3 bm-py-1.5 bm-text-[13px]">
            <span className="bm-flex bm-min-w-0 bm-items-center bm-gap-1.5 bm-font-medium bm-text-brand-ink">
              <MapPin size={12} className="bm-shrink-0" />{" "}
              <span className="bm-truncate">{selected.name}</span>
            </span>
            <Button
              variant="link"
              size="xs"
              className="bm-text-danger"
              onClick={() => onSelect(null)}>
              {t("campaign_manager_remove")}
            </Button>
          </div>
        )}

        <div className="bm-max-h-[320px] bm-overflow-y-auto">
          {loading && (
            <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-6 bm-text-[13px] bm-text-fg-muted">
              <Spinner size={13} /> {t("campaign_manager_loading")}
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="bm-py-6 bm-text-center bm-text-[13px] bm-italic bm-text-fg-muted">
              {t("campaign_manager_no_location_found")}
            </p>
          )}
          {!loading &&
            results.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => {
                  onSelect(place)
                  onClose()
                }}
                className={cn(
                  "bm-w-full bm-rounded-lg bm-px-3 bm-py-2 bm-text-left bm-text-[13px] bm-transition-colors hover:bm-bg-surface-2",
                  selected?.id === place.id &&
                    "bm-bg-brand-soft bm-text-brand-ink"
                )}>
                <p className="bm-font-medium">{place.name}</p>
                {place.address && (
                  <p className="bm-text-[12px] bm-text-fg-muted">
                    {place.address}
                  </p>
                )}
              </button>
            ))}
        </div>
      </div>
    </Modal>
  )
}
