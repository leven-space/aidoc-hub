import { useState } from 'react';
import { Card, Timeline, Button, Tag, Typography, Space, Modal, Empty } from 'antd';
import { ClockCircleOutlined, UserOutlined, RollbackOutlined } from '@ant-design/icons';
import { PageContainer } from '../../components/PageContainer';
import type { VersionInfo } from '../../types';

interface VersionHistoryProps {
  versions: VersionInfo[];
  canRestore?: boolean;
  onRestore?: (oid: string) => void | Promise<void>;
  onDiff?: (fromOid: string, toOid: string) => void;
}

export function VersionHistory({ versions, canRestore, onRestore, onDiff }: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleSelect = (oid: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(oid)) {
        return prev.filter((v) => v !== oid);
      }
      if (prev.length >= 2) {
        return [prev[1], oid];
      }
      return [...prev, oid];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length !== 2 || !onDiff) {
      return;
    }
    const versionMap = new Map(versions.map((v) => [v.oid, v]));
    const sorted = [...selectedVersions].sort(
      (a, b) => (versionMap.get(a)?.timestamp ?? 0) - (versionMap.get(b)?.timestamp ?? 0),
    );
    onDiff(sorted[0], sorted[1]);
  };

  const handleRestore = (oid: string) => {
    Modal.confirm({
      title: '确认恢复',
      content: '恢复此版本将生成一个新的提交，不会删除任何历史版本。确认继续？',
      onOk: () => onRestore?.(oid),
    });
  };

  return (
    <PageContainer
      title="版本历史"
      extra={
        selectedVersions.length === 2 && (
          <Button type="primary" onClick={handleCompare}>
            对比选中版本
          </Button>
        )
      }
    >
      {versions.length === 0 ? (
        <Empty description="暂无版本记录" />
      ) : (
        <Timeline
          items={versions.map((v) => ({
            color: selectedVersions.includes(v.oid) ? 'blue' : 'gray',
            dot: <ClockCircleOutlined />,
            children: (
              <Card
                size="small"
                hoverable
                onClick={() => handleSelect(v.oid)}
                style={{
                  cursor: 'pointer',
                  border: selectedVersions.includes(v.oid)
                    ? '1px solid #1677ff'
                    : '1px solid #f0f0f0',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Space>
                      <Typography.Text strong>{v.message.trim()}</Typography.Text>
                      <Tag color="blue">v{v.version}</Tag>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      <Space size={16}>
                        <Typography.Text type="secondary">
                          <UserOutlined /> {v.author}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {new Date(v.timestamp).toLocaleString()}
                        </Typography.Text>
                        <Typography.Text copyable code>
                          {v.oid.substring(0, 8)}
                        </Typography.Text>
                      </Space>
                    </div>
                  </div>
                  {canRestore && (
                    <Button
                      size="small"
                      icon={<RollbackOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(v.oid);
                      }}
                    >
                      恢复此版本
                    </Button>
                  )}
                </div>
              </Card>
            ),
          }))}
        />
      )}
    </PageContainer>
  );
}
