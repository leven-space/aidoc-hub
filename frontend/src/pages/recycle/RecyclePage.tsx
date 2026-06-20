import { useEffect, useState } from 'react';
import { Tabs, Table, Button, Modal, message, Empty, Spin, Tag } from 'antd';
import { PageContainer } from '../../components/PageContainer';
import { workspaceApi, repoApi } from '../../services';
import type { Workspace, Repository } from '../../types';

export function RecyclePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [repos, setRepos] = useState<(Repository & { workspaceName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const deletedWs = await workspaceApi.listDeleted();
      setWorkspaces(deletedWs);

      const activeWs = await workspaceApi.list();
      const allRepos: (Repository & { workspaceName?: string })[] = [];
      for (const ws of activeWs) {
        try {
          const deletedRepos = await repoApi.listDeleted(ws.id);
          deletedRepos.forEach((r) => {
            allRepos.push({ ...r, workspaceName: ws.name });
          });
        } catch {
          // skip
        }
      }
      setRepos(allRepos);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmAction = (title: string, content: string, onOk: () => Promise<void>) => {
    Modal.confirm({ title, content, okType: 'danger', onOk });
  };

  const wsColumns = [
    { title: '空间名称', dataIndex: 'name', key: 'name' },
    {
      title: '删除时间',
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '剩余天数',
      key: 'remaining',
      render: (_: unknown, record: Workspace) => {
        if (!record.deletedAt) return '-';
        const deleted = new Date(record.deletedAt as unknown as string);
        const remaining = 30 - Math.floor((Date.now() - deleted.getTime()) / 86400000);
        return <Tag color={remaining <= 7 ? 'red' : 'default'}>{remaining} 天</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Workspace) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() =>
              confirmAction('确认恢复', `恢复空间「${record.name}」？`, async () => {
                await workspaceApi.restore(record.id);
                message.success('已恢复');
                load();
              })
            }
          >
            恢复
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() =>
              confirmAction(
                '确认永久删除',
                `永久删除空间「${record.name}」？此操作不可撤销。`,
                async () => {
                  await workspaceApi.permanentDelete(record.id);
                  message.success('已永久删除');
                  load();
                },
              )
            }
          >
            永久删除
          </Button>
        </>
      ),
    },
  ];

  const repoColumns = [
    { title: '仓库名称', dataIndex: 'name', key: 'name' },
    { title: '所属空间', dataIndex: 'workspaceName', key: 'workspaceName' },
    {
      title: '删除时间',
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Repository & { workspaceName?: string }) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() =>
              confirmAction('确认恢复', `恢复仓库「${record.name}」？`, async () => {
                await repoApi.restore(record.workspaceId, record.id);
                message.success('已恢复');
                load();
              })
            }
          >
            恢复
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() =>
              confirmAction(
                '确认永久删除',
                `永久删除仓库「${record.name}」？此操作不可撤销。`,
                async () => {
                  await repoApi.permanentDelete(record.workspaceId, record.id);
                  message.success('已永久删除');
                  load();
                },
              )
            }
          >
            永久删除
          </Button>
        </>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageContainer title="回收站" subtitle="30 天内删除的内容可在此恢复">
      <Tabs
        items={[
          {
            key: 'workspaces',
            label: `空间 (${workspaces.length})`,
            children:
              workspaces.length === 0 ? (
                <Empty description="暂无已删除的空间" />
              ) : (
                <Table rowKey="id" columns={wsColumns} dataSource={workspaces} pagination={false} />
              ),
          },
          {
            key: 'repos',
            label: `仓库 (${repos.length})`,
            children:
              repos.length === 0 ? (
                <Empty description="暂无已删除的仓库" />
              ) : (
                <Table rowKey="id" columns={repoColumns} dataSource={repos} pagination={false} />
              ),
          },
        ]}
      />
    </PageContainer>
  );
}
