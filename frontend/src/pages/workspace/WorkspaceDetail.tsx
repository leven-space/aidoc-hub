import { useEffect, useState } from 'react';
import { Tabs, Spin, message, Modal } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/PageContainer';
import { workspaceApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { RepoList } from '../repo/RepoList';
import { MemberManage } from './MemberManage';
import type { Workspace } from '../../types';

export function WorkspaceDetail() {
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
      message.error(err instanceof Error ? err.message : '加载失败');
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
      title: '确认删除空间',
      content: '删除后空间将移入回收站，30 天内可恢复。确认继续？',
      okType: 'danger',
      onOk: async () => {
        await workspaceApi.delete(workspaceId);
        message.success('空间已移入回收站');
        navigate('/');
      },
    });
  };

  return (
    <PageContainer
      title={workspace.name}
      subtitle={workspace.description}
      breadcrumb={[
        { title: '工作空间', href: '/' },
        { title: workspace.name },
      ]}
      extra={
        isAdmin ? (
          <a onClick={handleDelete} style={{ color: '#ff4d4f' }}>
            删除空间
          </a>
        ) : undefined
      }
    >
      <Tabs
        items={[
          {
            key: 'repos',
            label: '仓库列表',
            children: (
              <RepoList workspaceId={workspaceId} isAdmin={isAdmin} />
            ),
          },
          {
            key: 'members',
            label: '成员管理',
            children: <MemberManage workspaceId={workspaceId} isAdmin={!!isAdmin} />,
          },
        ]}
      />
    </PageContainer>
  );
}
