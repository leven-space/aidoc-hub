import { useState } from 'react';
import { Card, Tabs, Select, Typography, Space } from 'antd';
import { PageContainer } from '../components/PageContainer';

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
  versions?: { oid: string; version: number; message: string }[];
  onSelectVersions?: (from: string, to: string) => void;
}

export function VersionDiff({ data, versions, onSelectVersions }: VersionDiffProps) {
  const [fromVersion, setFromVersion] = useState('');
  const [toVersion, setToVersion] = useState('');

  const handleFromChange = (val: string) => {
    setFromVersion(val);
    if (toVersion && onSelectVersions) {
      onSelectVersions(val, toVersion);
    }
  };

  const handleToChange = (val: string) => {
    setToVersion(val);
    if (fromVersion && onSelectVersions) {
      onSelectVersions(fromVersion, val);
    }
  };

  return (
    <PageContainer title="版本对比">
      <Card style={{ marginBottom: 16 }}>
        <Space size={16}>
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
                      sandbox=""
                      srcDoc={data.fromContent}
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
                      sandbox=""
                      srcDoc={data.toContent}
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
