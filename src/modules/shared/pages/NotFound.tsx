import { Compass, Home } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { APP_ROUTES } from "src/constants/route.constants"
import { Button, EmptyState } from "src/modules/shared/ui"

const NotFound = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="bm-flex bm-h-full bm-items-center bm-justify-center">
      <EmptyState
        icon={<Compass size={22} />}
        title={t("page_not_found")}
        description={t("page_not_found_desc")}
        action={
          <Button variant="primary" icon={<Home size={14} />} onClick={() => navigate(APP_ROUTES.HOME)}>
            {t("back_home")}
          </Button>
        }
      />
    </div>
  )
}

export default NotFound
