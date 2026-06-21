import { Button, Card, Col, Row, Tag, Typography, message } from 'antd';
import {
  ApiOutlined,
  AuditOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  KeyOutlined,
  SearchOutlined,
  ShareAltOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import {
  FEATURES,
  FEATURE_CATEGORIES,
  type FeatureCategory,
  type FeatureDef,
} from '../../content/features';
import { startFeatureTour } from '../../content/tours';
import { APP_VERSION } from '../../content/version';

const ICONS: Record<string, ReactNode> = {
  workspace: <TeamOutlined />,
  'html-preview': <EyeOutlined />,
  review: <EditOutlined />,
  'version-history': <HistoryOutlined />,
  upload: <CloudUploadOutlined />,
  share: <ShareAltOutlined />,
  search: <SearchOutlined />,
  recycle: <DeleteOutlined />,
  mcp: <ApiOutlined />,
  token: <KeyOutlined />,
  audit: <AuditOutlined />,
};

function canStartGuide(feature: FeatureDef, pathname: string): boolean {
  if (!feature.tourId) return false;
  if (feature.id === 'workspace' || feature.id === 'search' || feature.id === 'mcp' || feature.id === 'token') {
    return feature.tourId === 'onboarding';
  }
  if (feature.routePattern) {
    return feature.routePattern.test(pathname);
  }
  return true;
}

export function FeaturesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleStartGuide = (feature: FeatureDef) => {
    if (!feature.tourId) return;

    if (feature.tourId === 'onboarding') {
      navigate('/');
      window.setTimeout(() => startFeatureTour('onboarding'), 300);
      return;
    }

    if (feature.routePattern && !feature.routePattern.test(location.pathname)) {
      message.info(t(`features.${feature.id}.guideHint`));
      return;
    }

    startFeatureTour(feature.tourId);
  };

  const grouped = FEATURE_CATEGORIES.map((category) => ({
    category,
    items: FEATURES.filter((f) => f.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <PageContainer
      title={t('help.featuresTitle')}
      subtitle={t('help.featuresSubtitle')}
      extra={
        <Typography.Text type="secondary">
          {t('help.currentVersion', { version: APP_VERSION })}
        </Typography.Text>
      }
    >
      {grouped.map(({ category, items }) => (
        <div key={category} style={{ marginBottom: 32 }}>
          <Typography.Title level={5} style={{ marginBottom: 16 }}>
            {t(`help.categories.${category as FeatureCategory}`)}
          </Typography.Title>
          <Row gutter={[16, 16]}>
            {items.map((feature) => {
              const hasTour = Boolean(feature.tourId);
              const guideReady =
                hasTour &&
                (feature.tourId === 'onboarding' || canStartGuide(feature, location.pathname));

              return (
                <Col key={feature.id} xs={24} sm={12} lg={8}>
                  <Card
                    hoverable
                    styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 24,
                          color: '#1677ff',
                          lineHeight: 1,
                          marginTop: 2,
                        }}
                      >
                        {ICONS[feature.id]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Typography.Text strong>{t(`features.${feature.id}.title`)}</Typography.Text>
                          {feature.badge === 'new' && (
                            <Tag color="blue">{t('help.badgeNew')}</Tag>
                          )}
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            v{feature.introducedIn}
                          </Typography.Text>
                        </div>
                      </div>
                    </div>
                    <Typography.Paragraph
                      type="secondary"
                      style={{ flex: 1, marginBottom: 16 }}
                    >
                      {t(`features.${feature.id}.desc`)}
                    </Typography.Paragraph>
                    {hasTour ? (
                      <Button
                        type={guideReady ? 'primary' : 'default'}
                        block
                        onClick={() => handleStartGuide(feature)}
                      >
                        {t('help.startGuide')}
                      </Button>
                    ) : (
                      <Button block disabled>
                        {t('help.noGuide')}
                      </Button>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ))}
    </PageContainer>
  );
}
