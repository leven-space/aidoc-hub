import type { ThemeConfig } from 'antd';
import { brandColors } from './brand';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: brandColors.primary,
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: brandColors.primary,

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    fontSizeHeading4: 14,
    fontSizeHeading5: 12,

    lineHeight: 1.5714,
    lineHeightSM: 1.6667,
    lineHeightLG: 1.5,

    colorTextBase: '#0f172a',
    colorBgBase: brandColors.light,

    boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.08)',
    boxShadowSecondary: '0 4px 16px 0 rgba(99, 102, 241, 0.12)',

    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      siderBg: brandColors.dark,
      headerBg: '#ffffff',
      bodyBg: brandColors.light,
      headerHeight: 64,
    },
    Menu: {
      darkItemBg: brandColors.dark,
      darkSubMenuItemBg: brandColors.darkDeep,
      darkItemSelectedBg: brandColors.primary,
    },
    Card: {
      paddingLG: 24,
    },
    Table: {
      headerBg: brandColors.light,
      borderColor: '#e2e8f0',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(99, 102, 241, 0.15)',
    },
  },
};
