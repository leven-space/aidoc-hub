/** Whether a tree path refers to a folder (has child files under it). */
export function isFolderPath(path: string, files: string[]): boolean {
  if (files.includes(path)) {
    return false;
  }
  return files.some((filePath) => filePath.startsWith(`${path}/`));
}

export function getDownloadFilename(path: string, files: string[]): string {
  if (isFolderPath(path, files)) {
    const folderName = path.split('/').pop() || 'folder';
    return `${folderName}.zip`;
  }
  return path.split('/').pop() || 'download';
}
