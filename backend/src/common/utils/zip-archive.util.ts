import { ZipArchive } from 'archiver';
import type { Response } from 'express';
import { buildAttachmentDisposition } from './content-disposition.util';

export async function streamZipToResponse(
  res: Response,
  archiveName: string,
  entries: Array<{ path: string; buffer: Buffer }>,
): Promise<void> {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    buildAttachmentDisposition(`${archiveName}.zip`),
  );

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on('error', (err) => {
    throw err;
  });
  archive.pipe(res);

  for (const entry of entries) {
    archive.append(entry.buffer, { name: entry.path });
  }

  await archive.finalize();
}
