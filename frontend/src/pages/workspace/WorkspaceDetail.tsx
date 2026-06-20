import { useEffect, useState } from 'react';
import { Tabs, Spin, message, Modal } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { workspaceApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { RepoList } from '../repo/RepoList';
import { MemberManage } from './MemberManage';
import type { Workspace } from '../../types';

export function WorkspaceDetail() {
  const { t } = useTranslation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const data = await workspaceApi.get(workspaceId);
      setWorkspace(data);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  if (loading || !workspace || !workspaceId) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentMember = workspace.members?.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  const handleDelete = () => {
    Modal.confirm({
      title: t('workspace.deleteConfirmTitle'),
      content: t('workspace.deleteConfirmContent'),
      okType: 'danger',
      onOk: async () => {
        await workspaceApi.delete(workspaceId);
        message.success(t('workspace.deleteSuccess'));
        navigate('/');
      },
    });
  };

  return (
    <PageContainer
      title={workspace.name}
      subtitle={workspace.description}
      breadcrumb={[
        { title: t('workspace.breadcrumb'), href: '/' },
        { title: workspace.name },
      ]}
      extra={
        isAdmin ? (
          <a onClick={handleDelete} style={{ color: '#ff4d4f' }}>
            {t('workspace.deleteSpace')}
          </a>
        ) : undefined
      }
    >
      <Tabs
        items={[
          {
            key: 'repos',
            label: t('workspace.tabsRepos'),
            children: (
              <RepoList workspaceId={workspaceId} isAdmin={isAdmin} />
            ),
          },
          {
            key: 'members',
            label: t('workspace.tabsMembers'),
            children: <MemberManage workspaceId={workspaceId} isAdmin={!!isAdmin} />,
          },
        ]}
      />
    </PageContainer>
  );
}
