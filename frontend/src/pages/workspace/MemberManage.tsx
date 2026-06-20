import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Space,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { workspaceApi } from '../../services';
import type { WorkspaceMember } from '../../types';

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  EDITOR: 'blue',
  VIEWER: 'default',
};

const roleLabels: Record<string, string> = {
  ADMIN: '管理员',
  EDITOR: '编辑者',
  VIEWER: '查看者',
};

interface MemberManageProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function MemberManage({ workspaceId, isAdmin }: MemberManageProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await workspaceApi.listMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const filtered = members.filter((m) => {
    const matchSearch =
      !search ||
      m.user.name.includes(search) ||
      m.user.phone.includes(search);
    const matchRole = !roleFilter || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleInvite = async (values: { phone: string; role: string }) => {
    setInviting(true);
    try {
      await workspaceApi.inviteMember(workspaceId, values);
      message.success('邀请成功');
      setInviteOpen(false);
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '邀请失败');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await workspaceApi.updateMemberRole(workspaceId, memberId, role);
      message.success('角色已更新');
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败');
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      message.success('成员已移除');
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '移除失败');
    }
  };

  const columns = [
    {
      title: '成员',
      key: 'user',
      render: (_: unknown, record: WorkspaceMember) => (
        <Space direction="vertical" size={0}>
          <span>{record.user.name}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{record.user.phone}</span>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: WorkspaceMember) =>
        isAdmin ? (
          <Select
            value={role}
            size="small"
            style={{ width: 100 }}
            onChange={(val) => handleRoleChange(record.id, val)}
            options={[
              { label: '管理员', value: 'ADMIN' },
              { label: '编辑者', value: 'EDITOR' },
              { label: '查看者', value: 'VIEWER' },
            ]}
          />
        ) : (
          <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
        ),
    },
    ...(isAdmin
      ? [
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: WorkspaceMember) => (
              <Popconfirm title="确认移除该成员？" onConfirm={() => handleRemove(record.id)}>
                <Button type="link" danger size="small">
                  移除
                </Button>
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索成员"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="角色筛选"
            allowClear
            style={{ width: 120 }}
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { label: '管理员', value: 'ADMIN' },
              { label: '编辑者', value: 'EDITOR' },
              { label: '查看者', value: 'VIEWER' },
            ]}
          />
        </Space>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInviteOpen(true)}>
            邀请成员
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={false}
      />

      <Modal
        title="邀请成员"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleInvite} initialValues={{ role: 'VIEWER' }}>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="被邀请用户的手机号" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '管理员', value: 'ADMIN' },
                { label: '编辑者', value: 'EDITOR' },
                { label: '查看者', value: 'VIEWER' },
              ]}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setInviteOpen(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={inviting}>
              邀请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
