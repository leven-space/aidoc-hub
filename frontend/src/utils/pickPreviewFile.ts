/** Pick the default file for HTML preview / version diff (matches RepoDetail logic). */
export function pickDefaultPreviewFile(fileList: string[]): string | null {
  if (fileList.length === 0) {
    return null;
  }

  const htmlFiles = fileList.filter((f) => /\.(html|htm)$/i.test(f));
  if (htmlFiles.length > 0) {
    return (
      htmlFiles.find((f) => f === 'index.html') ||
      htmlFiles
        .filter((f) => f === 'index.html' || f.endsWith('/index.html'))
        .sort((a, b) => a.split('/').length - b.split('/').length)[0] ||
      htmlFiles[0]
    );
  }

  return fileList[0];
}
