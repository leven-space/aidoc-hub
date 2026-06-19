import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // Primary color - Ant Design standard tech blue
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',

    // Border radius - medium rounded corners
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Font sizes - 5 level hierarchy
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    fontSizeHeading4: 14,
    fontSizeHeading5: 12,

    // Line height
    lineHeight: 1.5714,
    lineHeightSM: 1.6667,
    lineHeightLG: 1.5,

    // Neutral color - 10-step gray scale
    colorTextBase: '#000000',
    colorBgBase: '#ffffff',

    // Shadows - 3-level restrained shadow system
    boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',

    // Spacing - 8px base grid
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // Motion
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
      bodyBg: '#f5f7fa',
      headerHeight: 64,
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
    },
    Card: {
      paddingLG: 24,
    },
    Table: {
      headerBg: '#fafafa',
      borderColor: '#f0f0f0',
    },
  },
};
