import { Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined, CopyOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface ReviewToolbarProps {
  repoName: string;
  filePath: string;
  versionLabel?: string;
  copyDisabled: boolean;
  onBack: () => void;
  onCopy: () => void;
  onHelp?: () => void;
}

export function ReviewToolbar({
  repoName,
  filePath,
  versionLabel,
  copyDisabled,
  onBack,
  onCopy,
  onHelp,
}: ReviewToolbarProps) {
  const { t } = useTranslation();

  const meta = [filePath, versionLabel, repoName].filter(Boolean).join(' · ');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        flexShrink: 0,
      }}
    >
      <Space>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t('review.backToRepo')}
        </Button>
        <Typography.Text type="secondary">{meta}</Typography.Text>
      </Space>
      <Space>
        {onHelp && (
          <Button type="text" icon={<QuestionCircleOutlined />} onClick={onHelp}>
            {t('help.startGuide')}
          </Button>
        )}
        <Button
          type="primary"
          icon={<CopyOutlined />}
          disabled={copyDisabled}
          onClick={onCopy}
          data-tour="review-copy"
        >
          {t('review.copyPrompt')}
        </Button>
      </Space>
    </div>
  );
}
