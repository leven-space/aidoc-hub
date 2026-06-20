import { useEffect, useState } from 'react';
import { Tabs, Table, Button, Modal, message, Empty, Spin, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { workspaceApi, repoApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import type { Workspace, Repository } from '../../types';

export function RecyclePage() {
  const { t } = useTranslation();
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
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
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
    { title: t('recycle.columnSpaceName'), dataIndex: 'name', key: 'name' },
    {
      title: t('recycle.columnDeletedAt'),
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: t('recycle.columnRemaining'),
      key: 'remaining',
      render: (_: unknown, record: Workspace) => {
        if (!record.deletedAt) return '-';
        const deleted = new Date(record.deletedAt as unknown as string);
        const remaining = 30 - Math.floor((Date.now() - deleted.getTime()) / 86400000);
        return <Tag color={remaining <= 7 ? 'red' : 'default'}>{t('common.days', { count: remaining })}</Tag>;
      },
    },
    {
      title: t('recycle.columnAction'),
      key: 'action',
      render: (_: unknown, record: Workspace) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() =>
              confirmAction(t('recycle.restoreConfirmTitle'), t('recycle.restoreWorkspaceContent', { name: record.name }), async () => {
                await workspaceApi.restore(record.id);
                message.success(t('recycle.restoreSuccess'));
                load();
              })
            }
          >
            {t('common.restore')}
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() =>
              confirmAction(
                t('recycle.permanentDeleteTitle'),
                t('recycle.permanentDeleteWorkspace', { name: record.name }),
                async () => {
                  await workspaceApi.permanentDelete(record.id);
                  message.success(t('recycle.permanentDeleteSuccess'));
                  load();
                },
              )
            }
          >
            {t('recycle.permanentDelete')}
          </Button>
        </>
      ),
    },
  ];

  const repoColumns = [
    { title: t('recycle.columnRepoName'), dataIndex: 'name', key: 'name' },
    { title: t('recycle.columnWorkspace'), dataIndex: 'workspaceName', key: 'workspaceName' },
    {
      title: t('recycle.columnDeletedAt'),
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: t('recycle.columnAction'),
      key: 'action',
      render: (_: unknown, record: Repository & { workspaceName?: string }) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() =>
              confirmAction(t('recycle.restoreConfirmTitle'), t('recycle.restoreRepoContent', { name: record.name }), async () => {
                await repoApi.restore(record.workspaceId, record.id);
                message.success(t('recycle.restoreSuccess'));
                load();
              })
            }
          >
            {t('common.restore')}
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() =>
              confirmAction(
                t('recycle.permanentDeleteTitle'),
                t('recycle.permanentDeleteRepo', { name: record.name }),
                async () => {
                  await repoApi.permanentDelete(record.workspaceId, record.id);
                  message.success(t('recycle.permanentDeleteSuccess'));
                  load();
                },
              )
            }
          >
            {t('recycle.permanentDelete')}
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
    <PageContainer title={t('recycle.title')} subtitle={t('recycle.subtitle')}>
      <Tabs
        items={[
          {
            key: 'workspaces',
            label: t('recycle.tabWorkspaces', { count: workspaces.length }),
            children:
              workspaces.length === 0 ? (
                <Empty description={t('recycle.emptyWorkspaces')} />
              ) : (
                <Table rowKey="id" columns={wsColumns} dataSource={workspaces} pagination={false} />
              ),
          },
          {
            key: 'repos',
            label: t('recycle.tabRepos', { count: repos.length }),
            children:
              repos.length === 0 ? (
                <Empty description={t('recycle.emptyRepos')} />
              ) : (
                <Table rowKey="id" columns={repoColumns} dataSource={repos} pagination={false} />
              ),
          },
        ]}
      />
    </PageContainer>
  );
}
