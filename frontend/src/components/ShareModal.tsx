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
  Switch,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { shareApi } from '../services';
import { getApiErrorMessage } from '../utils/apiError';
import type { VersionInfo } from '../types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  repoId: string;
  versions?: VersionInfo[];
}

export function ShareModal({ open, onClose, workspaceId, repoId, versions }: ShareModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareType, setShareType] = useState<'VIEW_ONLY' | 'SOURCE_ACCESS'>('VIEW_ONLY');
  const [allowDownload, setAllowDownload] = useState(false);
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
        allowDownload: shareType === 'VIEW_ONLY' ? allowDownload : true,
      });
      const fullUrl = `${window.location.origin}${result.url}`;
      setShareUrl(fullUrl);
      message.success(t('share.linkCreated'));
    } catch (err) {
      message.error(getApiErrorMessage(err, 'share.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    message.success(t('share.copied'));
  };

  const handleClose = () => {
    setShareUrl('');
    setAllowDownload(false);
    form.resetFields();
    onClose();
  };

  const typeDescription =
    shareType === 'VIEW_ONLY' ? t('share.previewDesc') : t('share.sourceDesc');

  return (
    <Modal title={t('share.modalTitle')} open={open} onCancel={handleClose} footer={null} width={520} destroyOnHidden>
      {shareUrl ? (
        <div>
          <Alert
            type="success"
            message={t('share.linkGenerated')}
            description={t('share.copyHint')}
            style={{ marginBottom: 16 }}
          />
          <Input
            value={shareUrl}
            readOnly
            addonAfter={
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                {t('common.copy')}
              </Button>
            }
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleClose}>
              {t('common.done')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Tabs
            activeKey={shareType}
            onChange={(k) => {
              const nextType = k as 'VIEW_ONLY' | 'SOURCE_ACCESS';
              setShareType(nextType);
              if (nextType === 'SOURCE_ACCESS') {
                setAllowDownload(true);
              }
            }}
            items={[
              { key: 'VIEW_ONLY', label: t('share.tabPreview') },
              { key: 'SOURCE_ACCESS', label: t('share.tabSource') },
            ]}
          />
          <Typography.Paragraph type="secondary">{typeDescription}</Typography.Paragraph>
          {shareType === 'VIEW_ONLY' && (
            <Form.Item
              label={t('share.allowDownload')}
              style={{ marginBottom: 16 }}
            >
              <Switch checked={allowDownload} onChange={setAllowDownload} />
              <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                {t('share.allowDownloadHint')}
              </Typography.Paragraph>
            </Form.Item>
          )}
          <Form form={form} layout="vertical">
            <Collapse
              ghost
              items={[
                {
                  key: 'advanced',
                  label: t('share.advanced'),
                  children: (
                    <>
                      <Form.Item name="password" label={t('share.password')}>
                        <Input.Password placeholder={t('share.passwordPlaceholder')} />
                      </Form.Item>
                      <Form.Item name="expiresAt" label={t('share.expires')}>
                        <DatePicker showTime style={{ width: '100%' }} placeholder={t('share.optional')} />
                      </Form.Item>
                      <Form.Item name="maxVisits" label={t('share.maxVisits')}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder={t('share.optional')} />
                      </Form.Item>
                      {versions && versions.length > 0 && (
                        <Form.Item name="version" label={t('share.version')}>
                          <Input placeholder={t('share.versionPlaceholder')} />
                        </Form.Item>
                      )}
                    </>
                  ),
                },
              ]}
            />
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button onClick={handleClose} style={{ marginRight: 8 }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" loading={loading} onClick={handleCreate}>
                {t('share.generateLink')}
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
