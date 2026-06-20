import { Card, Tabs, Select, Typography, Space, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '../components/PageContainer';

import { repoApi } from '../services';

interface DiffLine {
  type: 'add' | 'remove' | 'same';
  line: string;
  lineNumber: number;
}

interface DiffData {
  filePath: string;
  fromVersion: string;
  toVersion: string;
  fromContent: string;
  toContent: string;
  diff: DiffLine[];
}

interface VersionDiffProps {
  data?: DiffData;
  workspaceId?: string;
  repoId?: string;
  versions?: { oid: string; version: number; message: string }[];
  files?: string[];
  selectedFile?: string;
  onFileChange?: (filePath: string) => void;
  onSelectVersions?: (from: string, to: string) => void;
  onBack?: () => void;
}

export function VersionDiff({
  data,
  workspaceId,
  repoId,
  versions,
  files,
  selectedFile,
  onFileChange,
  onSelectVersions,
  onBack,
}: VersionDiffProps) {
  const fromVersion = data?.fromVersion ?? '';
  const toVersion = data?.toVersion ?? '';

  const handleFromChange = (val: string) => {
    if (toVersion && onSelectVersions) {
      onSelectVersions(val, toVersion);
    }
  };

  const handleToChange = (val: string) => {
    if (fromVersion && onSelectVersions) {
      onSelectVersions(fromVersion, val);
    }
  };

  const canUsePreviewUrl =
    workspaceId &&
    repoId &&
    data?.filePath &&
    /\.(html|htm)$/i.test(data.filePath);

  const fromPreviewUrl =
    canUsePreviewUrl && data
      ? repoApi.getPreviewUrl(workspaceId, repoId, data.filePath, data.fromVersion)
      : undefined;
  const toPreviewUrl =
    canUsePreviewUrl && data
      ? repoApi.getPreviewUrl(workspaceId, repoId, data.filePath, data.toVersion)
      : undefined;

  return (
    <PageContainer
      title="版本对比"
      extra={
        onBack && (
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回版本历史
          </Button>
        )
      }
    >
      <Card style={{ marginBottom: 16 }}>
        <Space size={16} wrap>
          <Select
            placeholder="选择基准版本"
            style={{ width: 240 }}
            value={fromVersion || undefined}
            onChange={handleFromChange}
            options={versions?.map((v) => ({
              label: `v${v.version} - ${v.message.trim().substring(0, 30)}`,
              value: v.oid,
            }))}
          />
          <Typography.Text type="secondary">对比</Typography.Text>
          <Select
            placeholder="选择对比版本"
            style={{ width: 240 }}
            value={toVersion || undefined}
            onChange={handleToChange}
            options={versions?.map((v) => ({
              label: `v${v.version} - ${v.message.trim().substring(0, 30)}`,
              value: v.oid,
            }))}
          />
          {files && files.length > 1 && onFileChange && (
            <>
              <Typography.Text type="secondary">文件</Typography.Text>
              <Select
                placeholder="选择对比文件"
                style={{ width: 240 }}
                value={selectedFile || data?.filePath}
                onChange={onFileChange}
                options={files.map((f) => ({ label: f, value: f }))}
              />
            </>
          )}
        </Space>
      </Card>

      {data && (
        <Tabs
          items={[
            {
              key: 'source',
              label: '源码对比',
              children: (
                <Card>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 13,
                      lineHeight: 1.6,
                      overflow: 'auto',
                    }}
                  >
                    {data.diff.map((line, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor:
                            line.type === 'add'
                              ? '#f6ffed'
                              : line.type === 'remove'
                                ? '#fff2f0'
                                : 'transparent',
                          borderLeft:
                            line.type === 'add'
                              ? '3px solid #52c41a'
                              : line.type === 'remove'
                                ? '3px solid #ff4d4f'
                                : '3px solid transparent',
                          paddingLeft: 12,
                          paddingRight: 12,
                        }}
                      >
                        <span style={{ color: '#999', marginRight: 12, userSelect: 'none' }}>
                          {line.lineNumber}
                        </span>
                        <span
                          style={{
                            color:
                              line.type === 'add'
                                ? '#389e0d'
                                : line.type === 'remove'
                                  ? '#cf1322'
                                  : '#333',
                          }}
                        >
                          {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
                          {line.line}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            },
            {
              key: 'preview',
              label: '预览对比',
              children: (
                <div style={{ display: 'flex', gap: 16 }}>
                  <Card title={`From: ${data.fromVersion.substring(0, 8)}`} style={{ flex: 1 }}>
                    <iframe
                      src={fromPreviewUrl}
                      srcDoc={fromPreviewUrl ? undefined : data.fromContent}
                      style={{
                        width: '100%',
                        height: 400,
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                      }}
                    />
                  </Card>
                  <Card title={`To: ${data.toVersion.substring(0, 8)}`} style={{ flex: 1 }}>
                    <iframe
                      src={toPreviewUrl}
                      srcDoc={toPreviewUrl ? undefined : data.toContent}
                      style={{
                        width: '100%',
                        height: 400,
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                      }}
                    />
                  </Card>
                </div>
              ),
            },
          ]}
        />
      )}
    </PageContainer>
  );
}
