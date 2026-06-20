const TEXT_FILE_EXTENSIONS = new Set([
  '.css',
  '.cjs',
  '.csv',
  '.htm',
  '.html',
  '.js',
  '.json',
  '.jsonld',
  '.jsx',
  '.map',
  '.md',
  '.mjs',
  '.rss',
  '.shtml',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.vue',
  '.webmanifest',
  '.xml',
  '.xhtml',
  '.yaml',
  '.yml',
]);

export function shouldReadUploadFileAsText(filePath: string): boolean {
  const dot = filePath.lastIndexOf('.');
  if (dot === -1) return true;
  return TEXT_FILE_EXTENSIONS.has(filePath.slice(dot).toLowerCase());
}
