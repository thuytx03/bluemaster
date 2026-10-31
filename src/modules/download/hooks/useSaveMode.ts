import { useEffect, useState } from "react"

import { EStorageKey } from "src/constants/enum"
import { TSaveMode } from "src/modules/download/types/download.types"
import { chromeUtils } from "src/utils/chrome.util"

/** "files" (one download per item) or "zip" (one archive, one confirmation); remembered across sessions */
const useSaveMode = (): [TSaveMode, (mode: TSaveMode) => void] => {
  const [saveMode, setSaveModeState] = useState<TSaveMode>("files")

  useEffect(() => {
    chromeUtils
      .getStorage<TSaveMode>(EStorageKey.DOWNLOAD_SAVE_MODE)
      .then((stored) => {
        if (stored === "zip" || stored === "files") setSaveModeState(stored)
      })
      .catch(() => undefined)
  }, [])

  const setSaveMode = (mode: TSaveMode) => {
    setSaveModeState(mode)
    void chromeUtils.setStorage(EStorageKey.DOWNLOAD_SAVE_MODE, mode)
  }

  return [saveMode, setSaveMode]
}

export default useSaveMode
