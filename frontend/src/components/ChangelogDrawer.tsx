import { Drawer, Timeline, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { CHANGELOG } from '../content/changelog';
import { APP_VERSION } from '../content/version';

interface ChangelogDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChangelogDrawer({ open, onClose }: ChangelogDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      title={t('changelog.title')}
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Typography.Text type="secondary">
          {t('help.currentVersion', { version: APP_VERSION })}
        </Typography.Text>
      }
    >
      <Timeline
        items={CHANGELOG.map((release) => {
          const items = t(release.itemsKey, { returnObjects: true }) as string[];
          return {
            color: release.version === APP_VERSION ? 'blue' : 'gray',
            children: (
              <div key={release.version}>
                <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
                  {t(release.titleKey)}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {release.date}
                </Typography.Text>
                <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
                  {Array.isArray(items) &&
                    items.map((item) => (
                      <li key={item} style={{ marginBottom: 4 }}>
                        <Typography.Text>{item}</Typography.Text>
                      </li>
                    ))}
                </ul>
              </div>
            ),
          };
        })}
      />
    </Drawer>
  );
}
