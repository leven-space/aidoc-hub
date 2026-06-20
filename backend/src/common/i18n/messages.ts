import { ErrorCode, type ErrorCodeType } from './error-codes';

export type SupportedLocale = 'zh-CN' | 'en-US';

type MessageParams = Record<string, string | number>;

const zhCN: Record<ErrorCodeType, string> = {
  [ErrorCode.REPO_NOT_FOUND]: '仓库不存在',
  [ErrorCode.WORKSPACE_NOT_FOUND]: '工作空间不存在',
  [ErrorCode.WORKSPACE_NO_ACCESS]: '无权访问此工作空间',
  [ErrorCode.WORKSPACE_DELETED_NOT_FOUND]: '已删除的工作空间不存在',
  [ErrorCode.WORKSPACE_ACCESS_DENIED]: '工作空间访问被拒绝',
  [ErrorCode.WORKSPACE_NOT_MEMBER]: '您不是此工作空间的成员',
  [ErrorCode.WORKSPACE_INSUFFICIENT_PERMISSION]: '工作空间权限不足',
  [ErrorCode.ADMIN_PERMISSION_REQUIRED]: '需要管理员权限',
  [ErrorCode.EDITOR_PERMISSION_REQUIRED]: '需要编辑者权限',
  [ErrorCode.USER_NOT_FOUND_BY_PHONE]: '未找到该手机号对应的用户',
  [ErrorCode.USER_ALREADY_MEMBER]: '该用户已是成员',
  [ErrorCode.MEMBER_NOT_FOUND]: '成员不存在',
  [ErrorCode.CANNOT_REMOVE_SELF]: '不能移除自己',
  [ErrorCode.REPO_NAME_EXISTS]: '同名仓库已存在',
  [ErrorCode.REPO_DELETED_NOT_FOUND]: '已删除的仓库不存在',
  [ErrorCode.NO_FILES_PROVIDED]: '未提供任何文件',
  [ErrorCode.MAX_FILES_EXCEEDED]: '单次提交最多 {{max}} 个文件',
  [ErrorCode.INVALID_FILE_PATH]: '无效的文件路径：{{path}}',
  [ErrorCode.FILE_SIZE_EXCEEDED]: '文件 {{path}} 超过最大限制 {{maxSize}}',
  [ErrorCode.FILE_NOT_FOUND]: '文件不存在：{{path}}',
  [ErrorCode.FILE_NOT_FOUND_AT_VERSION]:
    '版本 {{version}} 中不存在文件：{{path}}',
  [ErrorCode.VERSION_CONFLICT]:
    '当前最新版本为 {{latestOid}}，与您基于的版本 {{baseVersion}} 不一致。如需强制提交，请设置 forceOverwrite 为 true。',
  [ErrorCode.PATH_REQUIRED]: 'path 参数必填',
  [ErrorCode.VERSION_RANGE_REQUIRED]: 'from 和 to 版本参数必填',
  [ErrorCode.VERSION_REQUIRED]: 'version 参数必填',
  [ErrorCode.SYSTEM_ALREADY_INITIALIZED]: '系统已完成初始化',
  [ErrorCode.SYSTEM_ADMIN_REQUIRED]: '需要系统管理员权限',
  [ErrorCode.SYSTEM_NOT_INITIALIZED]: '系统尚未初始化，请先完成初始化',
  [ErrorCode.REGISTRATION_DISABLED]: '公开注册已关闭',
  [ErrorCode.INVALID_PHONE_FORMAT]: '手机号格式无效',
  [ErrorCode.PASSWORD_TOO_SHORT]: '密码至少 6 位',
  [ErrorCode.PHONE_ALREADY_REGISTERED]: '该手机号已注册',
  [ErrorCode.INVALID_CREDENTIALS]: '手机号或密码错误',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.TOKEN_NOT_FOUND]: 'Token 不存在',
  [ErrorCode.INVALID_AUTH_HEADER]: '缺少或无效的 Authorization 头',
  [ErrorCode.INVALID_OR_EXPIRED_TOKEN]: '访问令牌无效或已过期',
  [ErrorCode.SHARE_NOT_FOUND]: '分享不存在',
  [ErrorCode.SHARE_SOURCE_ACCESS_DENIED]: '此分享不允许查看源码',
  [ErrorCode.SHARE_PASSWORD_REQUIRED]: '需要访问密码',
  [ErrorCode.SHARE_LINK_NOT_FOUND]: '分享链接不存在或已停用',
  [ErrorCode.SHARE_LINK_EXPIRED]: '分享链接已过期',
  [ErrorCode.SHARE_MAX_VISITS]: '分享链接已达最大访问次数',
  [ErrorCode.SHARE_INVALID_PASSWORD]: '访问密码错误',
  [ErrorCode.TOKEN_WRITE_PERMISSION_REQUIRED]: 'Token 缺少写入权限',
  [ErrorCode.VALIDATION_FAILED]: '请求参数校验失败',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
};

const enUS: Record<ErrorCodeType, string> = {
  [ErrorCode.REPO_NOT_FOUND]: 'Repository not found',
  [ErrorCode.WORKSPACE_NOT_FOUND]: 'Workspace not found',
  [ErrorCode.WORKSPACE_NO_ACCESS]: 'No access to this workspace',
  [ErrorCode.WORKSPACE_DELETED_NOT_FOUND]: 'Deleted workspace not found',
  [ErrorCode.WORKSPACE_ACCESS_DENIED]: 'Workspace access denied',
  [ErrorCode.WORKSPACE_NOT_MEMBER]: 'Not a member of this workspace',
  [ErrorCode.WORKSPACE_INSUFFICIENT_PERMISSION]:
    'Insufficient workspace permissions',
  [ErrorCode.ADMIN_PERMISSION_REQUIRED]: 'Admin permission required',
  [ErrorCode.EDITOR_PERMISSION_REQUIRED]: 'Editor permission required',
  [ErrorCode.USER_NOT_FOUND_BY_PHONE]: 'User not found with this phone number',
  [ErrorCode.USER_ALREADY_MEMBER]: 'User is already a member',
  [ErrorCode.MEMBER_NOT_FOUND]: 'Member not found',
  [ErrorCode.CANNOT_REMOVE_SELF]: 'Cannot remove yourself',
  [ErrorCode.REPO_NAME_EXISTS]: 'Repository with this name already exists',
  [ErrorCode.REPO_DELETED_NOT_FOUND]: 'Deleted repository not found',
  [ErrorCode.NO_FILES_PROVIDED]: 'No files provided',
  [ErrorCode.MAX_FILES_EXCEEDED]: 'Maximum {{max}} files per commit',
  [ErrorCode.INVALID_FILE_PATH]: 'Invalid file path: {{path}}',
  [ErrorCode.FILE_SIZE_EXCEEDED]:
    'File {{path}} exceeds maximum size of {{maxSize}}',
  [ErrorCode.FILE_NOT_FOUND]: 'File not found: {{path}}',
  [ErrorCode.FILE_NOT_FOUND_AT_VERSION]:
    'File not found: {{path}} at version {{version}}',
  [ErrorCode.VERSION_CONFLICT]:
    'Latest version is {{latestOid}}, which differs from your base version {{baseVersion}}. Set forceOverwrite to true to force commit.',
  [ErrorCode.PATH_REQUIRED]: 'path is required',
  [ErrorCode.VERSION_RANGE_REQUIRED]: 'from and to version are required',
  [ErrorCode.VERSION_REQUIRED]: 'version is required',
  [ErrorCode.SYSTEM_ALREADY_INITIALIZED]: 'System already initialized',
  [ErrorCode.SYSTEM_ADMIN_REQUIRED]: 'System administrator access required',
  [ErrorCode.SYSTEM_NOT_INITIALIZED]:
    'System not initialized. Please complete setup first.',
  [ErrorCode.REGISTRATION_DISABLED]: 'Registration is disabled',
  [ErrorCode.INVALID_PHONE_FORMAT]: 'Invalid phone number format',
  [ErrorCode.PASSWORD_TOO_SHORT]: 'Password must be at least 6 characters',
  [ErrorCode.PHONE_ALREADY_REGISTERED]: 'Phone number already registered',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid phone or password',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.TOKEN_NOT_FOUND]: 'Token not found',
  [ErrorCode.INVALID_AUTH_HEADER]: 'Missing or invalid authorization header',
  [ErrorCode.INVALID_OR_EXPIRED_TOKEN]: 'Invalid or expired access token',
  [ErrorCode.SHARE_NOT_FOUND]: 'Share not found',
  [ErrorCode.SHARE_SOURCE_ACCESS_DENIED]:
    'Source access is not allowed for this share',
  [ErrorCode.SHARE_PASSWORD_REQUIRED]: 'Password required',
  [ErrorCode.SHARE_LINK_NOT_FOUND]: 'Share link not found or deactivated',
  [ErrorCode.SHARE_LINK_EXPIRED]: 'Share link has expired',
  [ErrorCode.SHARE_MAX_VISITS]: 'Share link has reached max visits',
  [ErrorCode.SHARE_INVALID_PASSWORD]: 'Invalid password',
  [ErrorCode.TOKEN_WRITE_PERMISSION_REQUIRED]:
    'Token does not have write permission',
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
};

const MESSAGES: Record<SupportedLocale, Record<ErrorCodeType, string>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`,
  );
}

export function resolveLocale(acceptLanguage?: string): SupportedLocale {
  if (!acceptLanguage) return 'zh-CN';
  const normalized = acceptLanguage.toLowerCase();
  if (normalized.includes('en')) return 'en-US';
  return 'zh-CN';
}

export function translateError(
  code: ErrorCodeType,
  locale: SupportedLocale,
  params?: MessageParams,
): string {
  const template = MESSAGES[locale][code] ?? MESSAGES['en-US'][code] ?? code;
  return interpolate(template, params);
}
