import type { Rule } from 'antd/es/form';
import type { TFunction } from 'i18next';

/** Keep in sync with backend auth/setup DTO validators */
export const PHONE_PATTERN = /^1[3-9]\d{9}$/;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_ALPHANUMERIC_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function phoneRules(t: TFunction): Rule[] {
  return [
    { required: true, message: t('validation.phoneRequired') },
    { pattern: PHONE_PATTERN, message: t('validation.phoneInvalid') },
  ];
}

export function passwordRules(t: TFunction): Rule[] {
  return [
    { required: true, message: t('validation.passwordRequired') },
    { min: PASSWORD_MIN_LENGTH, message: t('validation.passwordMin') },
    { pattern: PASSWORD_ALPHANUMERIC_PATTERN, message: t('validation.passwordAlphanumeric') },
  ];
}

export function loginPasswordRules(t: TFunction): Rule[] {
  return [{ required: true, message: t('validation.passwordRequired') }];
}

export function confirmPasswordRules(t: TFunction): Rule[] {
  return [
    { required: true, message: t('validation.confirmPasswordRequired') },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || getFieldValue('password') === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error(t('validation.passwordMismatch')));
      },
    }),
  ];
}

export function siteNameRules(t: TFunction): Rule[] {
  return [{ required: true, message: t('validation.siteNameRequired') }];
}

/** Matches backend @IsUrl({ require_tld: false }) — allows localhost without TLD */
export function publicApiUrlRules(t: TFunction): Rule[] {
  return [
    { required: true, message: t('validation.apiUrlRequired') },
    {
      validator(_, value: string) {
        if (!value) {
          return Promise.resolve();
        }
        try {
          const url = new URL(value);
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return Promise.reject(new Error(t('validation.urlInvalid')));
          }
          return Promise.resolve();
        } catch {
          return Promise.reject(new Error(t('validation.urlInvalid')));
        }
      },
    },
  ];
}
