import { useEffect, useMemo, useState } from 'react';
import { Card, Alert, Input, Button, Typography, message, Spin } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { mcpApi, tokenApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';

export function McpConfigPage() {
  const { t } = useTranslation();
  const [hasToken, setHasToken] = useState(false);
  const [setupGuideTemplate, setSetupGuideTemplate] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tokenApi.list(), mcpApi.getSetupSnippets()])
      .then(([tokenList, snippetData]) => {
        setHasToken(tokenList.some((token) => !token.isRevoked));
        setSetupGuideTemplate(snippetData.setupGuide);
      })
      .catch((err) => message.error(getApiErrorMessage(err, 'common.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  const resolvedGuide = useMemo(() => {
    if (!setupGuideTemplate) return '';
    const token = tokenInput.trim() || t('mcp.tokenDefault');
    return setupGuideTemplate.replaceAll('adh_YOUR_TOKEN', token);
  }, [setupGuideTemplate, tokenInput, t]);

  const handleCopy = () => {
    if (!tokenInput.trim()) {
      message.warning(t('mcp.pasteTokenWarning'));
      return;
    }
    navigator.clipboard.writeText(resolvedGuide).then(
      () => message.success(t('mcp.copySuccess')),
      () => message.error(t('mcp.copyFailed')),
    );
  };

  if (loading) {
    return (
      <PageContainer title={t('mcp.title')}>
        <Spin />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t('mcp.title')}
      subtitle={t('mcp.subtitle')}
      extra={
        <Button type="primary" icon={<CopyOutlined />} size="large" onClick={handleCopy}>
          {t('mcp.copyAll')}
        </Button>
      }
    >
      {!hasToken && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('mcp.noTokenAlert')}
          description={t('mcp.noTokenHint')}
        />
      )}

      <Card>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {t('mcp.tokenHint')}
        </Typography.Paragraph>
        <Typography.Text type="secondary">{t('mcp.tokenLabel')}</Typography.Text>
        <Input.Password
          placeholder={t('mcp.tokenPlaceholder')}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          style={{ marginTop: 8, marginBottom: 16 }}
        />
        <Input.TextArea
          value={resolvedGuide}
          readOnly
          autoSize={{ minRows: 20, maxRows: 40 }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Card>
    </PageContainer>
  );
}
