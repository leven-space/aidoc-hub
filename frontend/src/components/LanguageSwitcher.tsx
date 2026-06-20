import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { setAppLocale, type AppLocale } from '../i18n';

const LOCALE_OPTIONS: { value: AppLocale; labelKey: string }[] = [
  { value: 'zh-CN', labelKey: 'common.localeZh' },
  { value: 'en-US', labelKey: 'common.localeEn' },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <Select
      value={i18n.language as AppLocale}
      onChange={(value: AppLocale) => setAppLocale(value)}
      options={LOCALE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(opt.labelKey),
      }))}
      variant="borderless"
      suffixIcon={<GlobalOutlined />}
      style={{ minWidth: 100 }}
      popupMatchSelectWidth={false}
    />
  );
}
