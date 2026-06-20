import { useEffect, useMemo, useState } from 'react';
import { Card, Alert, Input, Button, Typography, message, Spin } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/PageContainer';
import { mcpApi, tokenApi } from '../../services';

export function McpConfigPage() {
  const [hasToken, setHasToken] = useState(false);
  const [setupGuideTemplate, setSetupGuideTemplate] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tokenApi.list(), mcpApi.getSetupSnippets()])
      .then(([tokenList, snippetData]) => {
        setHasToken(tokenList.some((t) => !t.isRevoked));
        setSetupGuideTemplate(snippetData.setupGuide);
      })
      .catch((err) => message.error(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const resolvedGuide = useMemo(() => {
    if (!setupGuideTemplate) return '';
    const token = tokenInput.trim() || 'adh_YOUR_TOKEN';
    return setupGuideTemplate.replaceAll('adh_YOUR_TOKEN', token);
  }, [setupGuideTemplate, tokenInput]);

  const handleCopy = () => {
    if (!tokenInput.trim()) {
      message.warning('请先粘贴 Personal Access Token');
      return;
    }
    navigator.clipboard.writeText(resolvedGuide).then(
      () => message.success('已复制全部配置说明，请粘贴给 Claude Code / Cursor 等 AI 工具'),
      () => message.error('复制失败'),
    );
  };

  if (loading) {
    return (
      <PageContainer title="MCP 接入配置">
        <Spin />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="MCP 接入配置"
      subtitle="复制全部说明，粘贴给 Claude Code / Cursor 等 AI 工具即可自动完成配置"
      extra={
        <Button type="primary" icon={<CopyOutlined />} size="large" onClick={handleCopy}>
          复制全部
        </Button>
      }
    >
      {!hasToken && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="尚未创建 Personal Access Token"
          description={
            <span>
              请先在 <Link to="/settings/tokens">Token 管理</Link> 创建 Token，并将明文 Token 粘贴到下方。
            </span>
          }
        />
      )}

      <Card>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          粘贴 Token 后点击「复制全部」，将完整内容发给 AI 编程工具即可完成 MCP 配置。内容包含连接参数、各客户端配置示例、HTTP 接口说明及全部可用工具定义。
        </Typography.Paragraph>
        <Typography.Text type="secondary">Personal Access Token</Typography.Text>
        <Input.Password
          placeholder="粘贴 adh_ 开头的 Token"
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
