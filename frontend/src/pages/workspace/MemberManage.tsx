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
import { useTranslation } from 'react-i18next';
import { workspaceApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import type { WorkspaceMember } from '../../types';

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  EDITOR: 'blue',
  VIEWER: 'default',
};

interface MemberManageProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function MemberManage({ workspaceId, isAdmin }: MemberManageProps) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  const roleLabels: Record<string, string> = {
    ADMIN: t('member.roleAdmin'),
    EDITOR: t('member.roleEditor'),
    VIEWER: t('member.roleViewer'),
  };

  const roleOptions = [
    { label: t('member.roleAdmin'), value: 'ADMIN' },
    { label: t('member.roleEditor'), value: 'EDITOR' },
    { label: t('member.roleViewer'), value: 'VIEWER' },
  ];

  const load = async () => {
    setLoading(true);
    try {
      const data = await workspaceApi.listMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
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
      message.success(t('member.inviteSuccess'));
      setInviteOpen(false);
      load();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'member.inviteFailed'));
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await workspaceApi.updateMemberRole(workspaceId, memberId, role);
      message.success(t('member.roleUpdated'));
      load();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'member.updateFailed'));
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      message.success(t('member.memberRemoved'));
      load();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'member.removeFailed'));
    }
  };

  const columns = [
    {
      title: t('member.columnMember'),
      key: 'user',
      render: (_: unknown, record: WorkspaceMember) => (
        <Space direction="vertical" size={0}>
          <span>{record.user.name}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{record.user.phone}</span>
        </Space>
      ),
    },
    {
      title: t('member.columnRole'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: WorkspaceMember) =>
        isAdmin ? (
          <Select
            value={role}
            size="small"
            style={{ width: 100 }}
            onChange={(val) => handleRoleChange(record.id, val)}
            options={roleOptions}
          />
        ) : (
          <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
        ),
    },
    ...(isAdmin
      ? [
          {
            title: t('member.columnAction'),
            key: 'action',
            render: (_: unknown, record: WorkspaceMember) => (
              <Popconfirm title={t('member.removeConfirm')} onConfirm={() => handleRemove(record.id)}>
                <Button type="link" danger size="small">
                  {t('common.remove')}
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
            placeholder={t('member.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder={t('member.roleFilter')}
            allowClear
            style={{ width: 120 }}
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
          />
        </Space>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInviteOpen(true)}>
            {t('member.invite')}
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
        title={t('member.inviteModalTitle')}
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleInvite} initialValues={{ role: 'VIEWER' }}>
          <Form.Item
            name="phone"
            label={t('member.phone')}
            rules={[
              { required: true, message: t('validation.phoneRequired') },
              { pattern: /^1[3-9]\d{9}$/, message: t('validation.phoneInvalid') },
            ]}
          >
            <Input placeholder={t('member.phonePlaceholder')} />
          </Form.Item>
          <Form.Item name="role" label={t('member.role')} rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setInviteOpen(false)} style={{ marginRight: 8 }}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" loading={inviting}>
              {t('member.invite')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
