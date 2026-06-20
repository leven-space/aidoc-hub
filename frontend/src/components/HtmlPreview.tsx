import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin, Select, Button, Space, Empty, Typography } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

interface HtmlPreviewProps {
  content: string;
  previewUrl?: string;
  loading?: boolean;
  filePath?: string;
  versions?: { oid: string; version: number; message: string }[];
  selectedVersion?: string;
  onVersionChange?: (version: string) => void;
}

export function HtmlPreview({
  content,
  previewUrl,
  loading,
  filePath,
  versions,
  selectedVersion,
  onVersionChange,
}: HtmlPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [loadedPreviewUrl, setLoadedPreviewUrl] = useState<string | null>(null);
  const { t } = useTranslation();

  const isHtmlFile = (fp?: string) => {
    if (!fp) return true;
    const ext = fp.split('.').pop()?.toLowerCase() || '';
    return ['html', 'htm'].includes(ext);
  };

  const showHtmlPreview = isHtmlFile(filePath);
  const iframePending = Boolean(showHtmlPreview && previewUrl && loadedPreviewUrl !== previewUrl);

  const toolbar = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
      }}
    >
      <Space>
        <Typography.Text type="secondary">
          {showHtmlPreview ? t('preview.htmlPreview') : t('preview.filePreview')}
        </Typography.Text>
        {versions && versions.length > 0 && onVersionChange && (
          <Select
            size="small"
            style={{ width: 200 }}
            placeholder={t('preview.selectVersion')}
            value={selectedVersion}
            onChange={onVersionChange}
            options={versions.map((v) => ({
              label: `v${v.version} - ${v.message.trim().substring(0, 20)}`,
              value: v.oid,
            }))}
          />
        )}
      </Space>
      <Button
        type="text"
        size="small"
        icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        onClick={() => setFullscreen(!fullscreen)}
      >
        {fullscreen ? t('preview.exitFullscreen') : t('preview.fullscreen')}
      </Button>
    </div>
  );

  const previewBody = (
    <div style={{ position: 'relative', minHeight: 400 }}>
      {showHtmlPreview && previewUrl ? (
        <>
          {iframePending && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              <Spin tip={t('common.loading')} />
            </div>
          )}
          <iframe
            key={previewUrl}
            src={previewUrl}
            title={t('preview.iframeTitle')}
            sandbox="allow-scripts"
            onLoad={() => setLoadedPreviewUrl(previewUrl)}
            onError={() => setLoadedPreviewUrl(previewUrl)}
            style={{
              width: '100%',
              height: fullscreen ? 'calc(100vh - 120px)' : 'min(80vh, 900px)',
              border: 'none',
              display: 'block',
            }}
          />
        </>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Spin tip={t('common.loading')} />
        </div>
      ) : content ? (
        showHtmlPreview ? (
          <iframe
            srcDoc={content}
            title={t('preview.iframeTitle')}
            sandbox="allow-scripts"
            style={{
              width: '100%',
              height: fullscreen ? 'calc(100vh - 120px)' : 'min(80vh, 900px)',
              border: 'none',
              display: 'block',
            }}
          />
        ) : (
          <pre
            style={{
              padding: 16,
              margin: 0,
              overflow: 'auto',
              height: fullscreen ? 'calc(100vh - 120px)' : 500,
              background: '#fafafa',
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {content}
          </pre>
        )
      ) : (
        <Empty description={t('preview.selectFileHint')} style={{ padding: 80 }} />
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {toolbar}
        {previewBody}
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {toolbar}
      {previewBody}
    </div>
  );
}
