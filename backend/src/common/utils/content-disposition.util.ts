export function buildAttachmentDisposition(filePath: string): string {
  const basename = filePath.split('/').pop() || 'download.html';
  const encoded = encodeURIComponent(basename);
  return `attachment; filename*=UTF-8''${encoded}`;
}
