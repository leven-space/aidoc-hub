import { useState } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Collapse,
  Button,
  message,
  Alert,
  Typography,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { shareApi } from '../services';
import type { VersionInfo } from '../types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  repoId: string;
  versions?: VersionInfo[];
}

export function ShareModal({ open, onClose, workspaceId, repoId, versions }: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareType, setShareType] = useState<'VIEW_ONLY' | 'SOURCE_ACCESS'>('VIEW_ONLY');
  const [form] = Form.useForm();

  const handleCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const result = await shareApi.create({
        workspaceId,
        repoId,
        type: shareType,
        password: values.password,
        expiresAt: values.expiresAt?.toISOString?.(),
        maxVisits: values.maxVisits,
        version: values.version,
      });
      const fullUrl = `${window.location.origin}${result.url}`;
      setShareUrl(fullUrl);
      message.success('分享链接已创建');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    message.success('已复制到剪贴板');
  };

  const handleClose = () => {
    setShareUrl('');
    form.resetFields();
    onClose();
  };

  const typeDescription =
    shareType === 'VIEW_ONLY'
      ? '接收者只能在线预览 HTML 内容，无法查看或下载源码。'
      : '接收者可以查看 HTML 源码并进行协同编辑提交。';

  return (
    <Modal title="分享仓库" open={open} onCancel={handleClose} footer={null} width={520} destroyOnHidden>
      {shareUrl ? (
        <div>
          <Alert
            type="success"
            message="分享链接已生成"
            description="请复制链接发送给协作者"
            style={{ marginBottom: 16 }}
          />
          <Input
            value={shareUrl}
            readOnly
            addonAfter={
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
            }
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleClose}>
              完成
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Tabs
            activeKey={shareType}
            onChange={(k) => setShareType(k as 'VIEW_ONLY' | 'SOURCE_ACCESS')}
            items={[
              { key: 'VIEW_ONLY', label: '仅预览查看' },
              { key: 'SOURCE_ACCESS', label: '可编辑源码' },
            ]}
          />
          <Typography.Paragraph type="secondary">{typeDescription}</Typography.Paragraph>
          <Form form={form} layout="vertical">
            <Collapse
              ghost
              items={[
                {
                  key: 'advanced',
                  label: '高级设置',
                  children: (
                    <>
                      <Form.Item name="password" label="访问密码">
                        <Input.Password placeholder="可选，设置后访问需输入密码" />
                      </Form.Item>
                      <Form.Item name="expiresAt" label="有效期">
                        <DatePicker showTime style={{ width: '100%' }} placeholder="可选" />
                      </Form.Item>
                      <Form.Item name="maxVisits" label="最大访问次数">
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="可选" />
                      </Form.Item>
                      {versions && versions.length > 0 && (
                        <Form.Item name="version" label="指定版本">
                          <Input placeholder="可选，留空则分享最新版本" />
                        </Form.Item>
                      )}
                    </>
                  ),
                },
              ]}
            />
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button onClick={handleClose} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" loading={loading} onClick={handleCreate}>
                生成链接
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
