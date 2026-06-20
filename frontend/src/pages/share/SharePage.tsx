import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Layout,
  Tree,
  Spin,
  message,
  Empty,
  Card,
  Form,
  Input,
  Button,
  Typography,
  Tag,
} from 'antd';
import { FileOutlined, FolderOutlined, LockOutlined, DownloadOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HtmlPreview } from '../../components/HtmlPreview';
import { shareApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { pickDefaultPreviewFile } from '../../utils/pickPreviewFile';
import { getDownloadFilename, isFolderPath } from '../../utils/downloadPath';
import { triggerFileDownload } from '../../utils/triggerDownload';
import type { ShareView } from '../../types';

const { Sider, Content } = Layout;

function buildTreeData(filePaths: string[]): Array<{
  key: string;
  title: string;
  icon: ReactNode;
  isLeaf?: boolean;
  children?: ReturnType<typeof buildTreeData>;
}> {
  const root: Record<string, Record<string, unknown> | null> = {};
  for (const fp of filePaths) {
    const parts = fp.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = i === parts.length - 1 ? null : {};
      }
      if (current[part] !== null) {
        current = current[part] as Record<string, Record<string, unknown> | null>;
      }
    }
  }

  const buildNode = (
    obj: Record<string, unknown>,
    prefix: string,
  ): ReturnType<typeof buildTreeData> =>
    Object.keys(obj)
      .sort((a, b) => {
        const aIsFolder = obj[a] !== null;
        const bIsFolder = obj[b] !== null;
        if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
        return a.localeCompare(b);
      })
      .map((key) => {
        const fullPath = prefix ? `${prefix}/${key}` : key;
        if (obj[key] === null) {
          return { key: fullPath, title: key, icon: <FileOutlined />, isLeaf: true };
        }
        return {
          key: fullPath,
          title: key,
          icon: <FolderOutlined />,
          children: buildNode(obj[key] as Record<string, unknown>, fullPath),
        };
      });

  return buildNode(root, '');
}

export function SharePage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [shareView, setShareView] = useState<ShareView | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [form] = Form.useForm();

  const isHtmlFile = (fp: string) => /\.(html|htm)$/i.test(fp);
  const canViewSource = shareView?.type === 'SOURCE_ACCESS';
  const canDownload = Boolean(shareView?.allowDownload);

  const loadShare = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await shareApi.getView(token);
      if (result.requiresPassword) {
        setPasswordRequired(true);
        setShareView(null);
        return;
      }
      setPasswordRequired(false);
      setShareView(result);
      const defaultFile = pickDefaultPreviewFile(result.files);
      setSelectedFile(defaultFile);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'share.invalidLink'));
      setShareView(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadShare();
  }, [loadShare]);

  useEffect(() => {
    const loadPreview = async () => {
      if (!token || !selectedFile || !shareView) {
        setPreviewContent('');
        return;
      }
      if (isHtmlFile(selectedFile)) {
        setPreviewContent('');
        return;
      }
      if (!canViewSource) {
        setPreviewContent('');
        return;
      }
      setPreviewLoading(true);
      try {
        const content = await shareApi.readFile(token, selectedFile);
        setPreviewContent(typeof content === 'string' ? content : String(content));
      } catch {
        setPreviewContent('');
      } finally {
        setPreviewLoading(false);
      }
    };
    loadPreview();
  }, [token, selectedFile, shareView, canViewSource]);

  const handlePasswordSubmit = async (values: { password: string }) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await shareApi.access(token, values.password);
      if (result.requiresPassword) {
        message.error(t('errors.SHARE_INVALID_PASSWORD'));
        return;
      }
      setPasswordRequired(false);
      setShareView(result);
      const defaultFile = pickDefaultPreviewFile(result.files);
      setSelectedFile(defaultFile);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'errors.SHARE_INVALID_PASSWORD'));
    } finally {
      setLoading(false);
    }
  };

  const previewUrl =
    token && selectedFile && isHtmlFile(selectedFile)
      ? shareApi.getPreviewUrl(token, selectedFile)
      : undefined;

  const handleDownload = async () => {
    if (!token || !selectedFile || !shareView) return;
    try {
      await triggerFileDownload(
        shareApi.getDownloadUrl(token, selectedFile),
        getDownloadFilename(selectedFile, shareView.files),
      );
    } catch (err) {
      message.error(getApiErrorMessage(err, 'share.downloadFailed'));
    }
  };

  const selectedIsFolder = selectedFile
    ? isFolderPath(selectedFile, shareView?.files || [])
    : false;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip={t('share.loadingShare')} />
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          padding: 24,
        }}
      >
        <Card style={{ width: 400, maxWidth: '100%' }}>
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            <LockOutlined /> {t('share.passwordRequired')}
          </Typography.Title>
          <Typography.Paragraph type="secondary">{t('share.passwordHint')}</Typography.Paragraph>
          <Form form={form} layout="vertical" onFinish={handlePasswordSubmit}>
            <Form.Item
              name="password"
              rules={[{ required: true, message: t('validation.sharePasswordRequired') }]}
            >
              <Input.Password placeholder={t('share.accessPassword')} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block>
                {t('common.confirm')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  if (!shareView) {
    return (
      <div style={{ padding: 80 }}>
        <Empty description={t('share.invalidOrExpired')} />
      </div>
    );
  }

  const treeData = buildTreeData(shareView.files);

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {shareView.repoName}
          </Typography.Title>
          {shareView.repoDescription && (
            <Typography.Text type="secondary">{shareView.repoDescription}</Typography.Text>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tag color={shareView.type === 'SOURCE_ACCESS' ? 'blue' : 'default'}>
            {shareView.type === 'SOURCE_ACCESS' ? t('share.tagSource') : t('share.tagPreview')}
          </Tag>
          {canDownload && (
            <Button
              icon={<DownloadOutlined />}
              disabled={!selectedFile}
              onClick={handleDownload}
            >
              {selectedIsFolder ? t('share.downloadFolder') : t('share.downloadFile')}
            </Button>
          )}
        </div>
      </div>

      {shareView.files.length === 0 ? (
        <Empty description={t('share.noFiles')} style={{ padding: 80 }} />
      ) : (
        <Layout style={{ background: '#fff', minHeight: 'calc(100vh - 73px)' }}>
          <Sider width={240} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
            <div
              style={{
                padding: '12px 16px',
                fontWeight: 500,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              {t('share.fileList')}
            </div>
            <Tree
              showIcon
              treeData={treeData}
              selectedKeys={selectedFile ? [selectedFile] : []}
              onSelect={(keys) => {
                if (keys[0]) setSelectedFile(String(keys[0]));
              }}
              style={{ padding: 8 }}
            />
          </Sider>
          <Content style={{ padding: 16 }}>
            {!canViewSource && selectedFile && !isHtmlFile(selectedFile) ? (
              <Empty description={t('share.htmlOnly')} style={{ padding: 80 }} />
            ) : (
              <HtmlPreview
                content={previewContent}
                previewUrl={previewUrl}
                loading={previewLoading}
                filePath={selectedFile || undefined}
              />
            )}
          </Content>
        </Layout>
      )}
    </div>
  );
}
