import {
  AppWindow,
  Columns2,
  ExternalLink,
  FileText,
  Info,
  Languages,
  Layers,
  Maximize,
  Palette,
  PanelLeft,
  PanelRight,
  Settings,
  ZoomIn
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { EXTENSION_INFO } from "src/constants"
import SingleFileNameConfig from "src/modules/download/components/SingleFileNameConfig"
import SwitchLanguageControl from "src/modules/settings/components/LanguagePicker"
import PageContainer from "src/modules/shared/components/PageContainer"
import ThemeSwitcher from "src/modules/shared/components/ThemeSwitcher"
import {
  TLayoutMode,
  TPanelPosition
} from "src/modules/shared/types/common.types"
import {
  Badge,
  DescList,
  RadioGroup,
  Segmented,
  Surface
} from "src/modules/shared/ui"
import useExtensionState from "src/stores/extension-state.store"

const SettingPage = () => {
  const { t } = useTranslation()
  const { extensionState, setLayoutMode, setUiScale, setPanelPosition } =
    useExtensionState()
  const docked =
    extensionState.panelPosition === "left" ||
    extensionState.panelPosition === "right"

  return (
    <PageContainer
      title={t("settings")}
      icon={<Settings size={20} />}
      accent="bm-bg-surface-3 bm-text-fg">
      <Surface
        title={t("appearance")}
        description={t("appearance_desc")}
        icon={<Palette size={15} />}>
        <ThemeSwitcher />
      </Surface>

      <Surface
        title={t("ui_scale")}
        description={t("ui_scale_desc")}
        icon={<ZoomIn size={15} />}>
        <Segmented<number>
          block
          value={extensionState.uiScale}
          onChange={(v) => setUiScale(v)}
          options={[
            { value: 0.9, label: "90%" },
            { value: 1, label: "100%" },
            { value: 1.1, label: "110%" },
            { value: 1.25, label: "125%" }
          ]}
        />
      </Surface>

      <Surface
        title={t("panel_position")}
        description={t("panel_position_desc")}
        icon={<AppWindow size={15} />}>
        <RadioGroup<TPanelPosition>
          variant="cards"
          columns={2}
          value={extensionState.panelPosition}
          onChange={(p) => setPanelPosition(p)}
          options={[
            {
              value: "right",
              label: t("pos_right"),
              description: t("pos_right_desc"),
              icon: <PanelRight size={16} />
            },
            {
              value: "left",
              label: t("pos_left"),
              description: t("pos_left_desc"),
              icon: <PanelLeft size={16} />
            },
            {
              value: "center",
              label: t("pos_center"),
              description: t("pos_center_desc"),
              icon: <AppWindow size={16} />
            },
            {
              value: "full",
              label: t("pos_full"),
              description: t("pos_full_desc"),
              icon: <Maximize size={16} />
            }
          ]}
        />
      </Surface>

      <Surface
        title={t("display_mode")}
        description={
          docked ? t("display_mode_desc") : t("display_mode_docked_only")
        }
        icon={<Layers size={15} />}>
        {docked && (
          <RadioGroup<TLayoutMode>
            variant="cards"
            columns={2}
            value={extensionState.layoutMode}
            onChange={(m) => setLayoutMode(m)}
            options={[
              {
                value: "push",
                label: t("push_mode"),
                description: t("push_mode_desc"),
                icon: <Columns2 size={16} />
              },
              {
                value: "overlay",
                label: t("overlay_mode"),
                description: t("overlay_mode_desc"),
                icon: <PanelRight size={16} />
              }
            ]}
          />
        )}
      </Surface>

      <Surface
        title={t("language")}
        description={t("language_desc")}
        icon={<Languages size={15} />}>
        <SwitchLanguageControl />
      </Surface>

      <Surface
        title={t("single_file_name_config_title")}
        description={t("single_file_name_config_desc")}
        icon={<FileText size={15} />}>
        <SingleFileNameConfig />
      </Surface>

      <Surface title={t("about")} icon={<Info size={15} />}>
        <DescList
          items={[
            {
              label: t("version"),
              value: (
                <span className="bm-flex bm-items-center bm-gap-2">
                  <span className="bm-font-mono">
                    v{EXTENSION_INFO.version}
                  </span>
                  {extensionState.isUpdateAvailable ? (
                    <a
                      href={extensionState.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bm-inline-flex bm-items-center bm-gap-1 bm-text-[11.5px]">
                      <Badge tone="warning" size="xs">
                        {t("update_button")} v{extensionState.latestVersion}
                      </Badge>
                    </a>
                  ) : (
                    <Badge tone="success" size="xs">
                      {t("latest_version")}
                    </Badge>
                  )}
                </span>
              )
            },
            { label: t("author"), value: EXTENSION_INFO.author },
            {
              label: "GitHub",
              value: (
                <a
                  href="https://github.com/thuytx03/bluemaster/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bm-inline-flex bm-items-center bm-gap-1">
                  thuytx03/bluemaster <ExternalLink size={12} />
                </a>
              )
            }
          ]}
        />
      </Surface>
    </PageContainer>
  )
}

export default SettingPage
