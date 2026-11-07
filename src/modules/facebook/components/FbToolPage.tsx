import { ReactNode } from "react"

import { FacebookDelayConfig } from "src/modules/facebook/components/DelayConfigPanel"
import VerifyAccountNotice from "src/modules/facebook/components/VerifyAccountNotice"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import PageContainer from "src/modules/shared/components/PageContainer"

interface FbToolPageProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** Hide the shared delay / safety config (tools without bulk actions) */
  hideDelayConfig?: boolean
  children: ReactNode
}

/**
 * Page shell for the ported Facebook tools: title, the standard Bluemaster
 * account verification notice, the shared delay config, then the tool once a
 * Facebook account is verified.
 */
export default function FbToolPage({
  title,
  description,
  icon,
  hideDelayConfig,
  children
}: FbToolPageProps) {
  const { isLoggedIn } = useFacebook()

  return (
    <PageContainer title={title} description={description} icon={icon}>
      <VerifyAccountNotice />
      {isLoggedIn && (
        <>
          {!hideDelayConfig && <FacebookDelayConfig />}
          {children}
        </>
      )}
    </PageContainer>
  )
}
