import { useState, useEffect } from 'react';
import { Spin, Select, Button, Space, Empty, Typography } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

interface HtmlPreviewProps {
  content: string;
  loading?: boolean;
  filePath?: string;
  versions?: { oid: string; version: number; message: string }[];
  selectedVersion?: string;
  onVersionChange?: (version: string) => void;
}

export function HtmlPreview({
  content,
  loading,
  filePath,
  versions,
  selectedVersion,
  onVersionChange,
}: HtmlPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const isHtmlFile = (fp?: string) => {
    if (!fp) return true; // default to HTML preview
    const ext = fp.split('.').pop()?.toLowerCase() || '';
    return ['html', 'htm'].includes(ext);
  };

  const showHtmlPreview = isHtmlFile(filePath);

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
        <Typography.Text type="secondary">{showHtmlPreview ? 'HTML 预览' : '文件预览'}</Typography.Text>
        {versions && versions.length > 0 && onVersionChange && (
          <Select
            size="small"
            style={{ width: 200 }}
            placeholder="选择版本"
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
        {fullscreen ? '退出全屏' : '全屏预览'}
      </Button>
    </div>
  );

  const previewBody = (
    <div style={{ position: 'relative', minHeight: 400 }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Spin tip="加载中..." />
        </div>
      ) : content ? (
        showHtmlPreview ? (
          <iframe
            sandbox=""
            srcDoc={content}
            title="HTML Preview"
            style={{
              width: '100%',
              height: fullscreen ? 'calc(100vh - 120px)' : 500,
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
        <Empty description="选择文件以预览" style={{ padding: 80 }} />
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
