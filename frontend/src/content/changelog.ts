import { APP_RELEASE_DATE, APP_VERSION } from './version';

export interface ChangelogRelease {
  version: string;
  date: string;
  /** i18n key for release title, e.g. changelog.v100.title */
  titleKey: string;
  /** i18n key for string[] items, e.g. changelog.v100.items */
  itemsKey: string;
}

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: APP_VERSION,
    date: APP_RELEASE_DATE,
    titleKey: 'changelog.v100.title',
    itemsKey: 'changelog.v100.items',
  },
];
