import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../exceptions/app.exception';

export type DownloadTarget =
  | { mode: 'file'; filePath: string }
  | { mode: 'folder'; folderPath: string; filePaths: string[] };

export function resolveDownloadTarget(
  allFiles: string[],
  path: string,
): DownloadTarget {
  if (allFiles.includes(path)) {
    return { mode: 'file', filePath: path };
  }

  const prefix = `${path}/`;
  const filePaths = allFiles.filter((filePath) => filePath.startsWith(prefix));
  if (filePaths.length === 0) {
    throw new AppException(ErrorCode.FILE_NOT_FOUND, HttpStatus.NOT_FOUND, {
      path,
    });
  }

  return { mode: 'folder', folderPath: path, filePaths };
}

export function toZipEntryPath(folderPath: string, filePath: string): string {
  return filePath.slice(folderPath.length + 1);
}
