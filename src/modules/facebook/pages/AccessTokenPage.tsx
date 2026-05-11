import { Alert, Button, Card } from "antd";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs } from 'antd';
import { Input } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import PageContainer from "../../shared/components/PageContainer";
import { EXTENSION_INFO } from "../../../constants";
import { IAccessTokenPage } from "../types/facebook.interface";
import { copyTextToClipboard } from "../../../utils/common.util";
import { fetchTokenEAAB, fetchTokenEAAGNO } from "../utils/facebook.util";
import { useTranslation } from "react-i18next";



export default function AccessTokenPage() {
  const { t } = useTranslation();
  const [token, setToken] = useState<IAccessTokenPage>({
    tokenEAAB: "",
    tokenEAAGNO: "",
  });
  const [isCopy, setIsCopy] = useState<{ [key: string]: boolean }>({});

  const handleGetTokenEEAB = async () => {
    if (!token.tokenEAAB) {
      return toast.promise(
        (async () => {
          const result = await fetchTokenEAAB();
          if (result) {
            setToken((prev) => ({ ...prev, tokenEAAB: result as string }));
            return result;
          } else {
            throw new Error(t('error_get_eaab'));
          }
        })(),
        {
          loading: t('loading_get_eaab'),
          success: t('success_get_eaab'),
          error: t('error_get_eaab')
        }
      );
    }
  };

  const handleGetTokenEAAGNO = async () => {
    if (!token.tokenEAAGNO) {
      return toast.promise(
        (async () => {
          const result = await fetchTokenEAAGNO();
          if (result) {
            setToken((prev) => ({ ...prev, tokenEAAGNO: result as string }));
            return result;
          } else {
            throw new Error(t('error_get_eaagno'));
          }
        })(),
        {
          loading: t('loading_get_eaagno'),
          success: t('success_get_eaagno'),
          error: t('error_get_eaagno')
        }
      );
    }
  };

  const handleCopyToken = (type: string, tokenValue: string) => {
    copyTextToClipboard(tokenValue);
    setIsCopy(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setIsCopy(prev => ({ ...prev, [type]: false })), 2000);
  };

  useEffect(() => {
    handleGetTokenEEAB();
  }, []);

  return (
    <>
      <PageContainer
        title={t('access_token_page_title')}
        className="flex flex-col">
        <Card className="flex-1 shadow border rounded-xl">
          <div className="space-y-2">
            <Alert
              message={t('access_token_info')}
              type="info"
              showIcon
              action={
                <a className="text-blue-600" target="_blank" href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens">{t('access_token_learn_more')}</a>
              }
            />
            <Alert
              message={
                <div>
                  <div>🔒 {EXTENSION_INFO.displayName} {t('access_token_safe', { ext: EXTENSION_INFO.displayName })}</div>
                  <div>📌 {t('access_token_local')}</div>
                  <div>✅ {t('access_token_privacy')}</div>
                </div>
              }
              type="success"
            />
          </div>
          <Tabs
            className="mt-3"
            type="card"
            defaultActiveKey="EAAB"
            items={[
              {
                label: t('eaab_tab_label'),
                key: "EAAB",
                children: (
                  <div className="space-y-2">
                    <div>{t('eaab_extract_desc')}</div>
                    <Input.TextArea
                      placeholder={t('eaab_placeholder')}
                      value={token.tokenEAAB}
                      autoSize={{ minRows: 2 }}
                      readOnly
                    />
                    <Button
                      icon={isCopy["EAAB"] ? <CheckOutlined /> : <CopyOutlined />}
                      type={isCopy["EAAB"] ? "primary" : "default"}
                      onClick={() => handleCopyToken("EAAB", token.tokenEAAB)}
                    >
                      {isCopy["EAAB"] ? t('copied') : t('copy')}
                    </Button>
                  </div>
                ),
              },
              {
                label: t('eaagno_tab_label'),
                key: "EAAGNO",
                children: (
                  <div className="space-y-2">
                    <div>{t('eaagno_extract_desc')}</div>
                    <Input.TextArea
                      placeholder={t('eaagno_placeholder')}
                      value={token.tokenEAAGNO}
                      autoSize={{ minRows: 2 }}
                      readOnly
                    />
                    <Button
                      icon={isCopy["EAAGNO"] ? <CheckOutlined /> : <CopyOutlined />}
                      type={isCopy["EAAGNO"] ? "primary" : "default"}
                      onClick={() => handleCopyToken("EAAGNO", token.tokenEAAGNO)}
                    >
                      {isCopy["EAAGNO"] ? t('copied') : t('copy')}
                    </Button>
                  </div>
                ),
              },
            ]}
            onChange={handleGetTokenEAAGNO}
          />
        </Card>
      </PageContainer>
    </>
  );
}
