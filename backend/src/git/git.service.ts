import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as path from 'path';

export interface CommitInfo {
  oid: string;
  version: number;
  message: string;
  author: string;
  timestamp: number;
}

export interface FileContent {
  filePath: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export type RepoFileInput = FileContent;

@Injectable()
export class GitService {
  private readonly reposBasePath: string;

  constructor() {
    this.reposBasePath = path.resolve(process.env.REPOS_PATH || './repos');
    if (!fs.existsSync(this.reposBasePath)) {
      fs.mkdirSync(this.reposBasePath, { recursive: true });
    }
  }

  getRepoPath(workspaceId: string, repoName: string): string {
    return path.join(this.reposBasePath, workspaceId, repoName);
  }

  async initRepo(workspaceId: string, repoName: string): Promise<void> {
    const dir = this.getRepoPath(workspaceId, repoName);
    if (fs.existsSync(dir)) {
      return;
    }
    fs.mkdirSync(dir, { recursive: true });
    await git.init({ fs, dir, defaultBranch: 'main' });

    // Create initial commit with a placeholder file
    const readmePath = path.join(dir, 'README.md');
    fs.writeFileSync(readmePath, `# ${repoName}\n`);
    await git.add({ fs, dir, filepath: 'README.md' });
    await git.commit({
      fs,
      dir,
      message: 'Initial commit',
      author: { name: 'system', email: 'system@aidochub.local' },
    });
  }

  async commitFiles(
    workspaceId: string,
    repoName: string,
    files: RepoFileInput[],
    message: string,
    author: string,
    baseVersion?: string,
    forceOverwrite?: boolean,
  ): Promise<CommitInfo> {
    const dir = this.getRepoPath(workspaceId, repoName);
    this.ensureRepoExists(dir);

    // Conflict detection: check if baseVersion matches latest
    if (baseVersion) {
      const latestLog = await git.log({ fs, dir, depth: 1 });
      const latestOid = latestLog[0]?.oid;
      if (latestOid && latestOid !== baseVersion && !forceOverwrite) {
        throw new AppException(
          ErrorCode.VERSION_CONFLICT,
          HttpStatus.CONFLICT,
          {
            latestOid: latestOid.substring(0, 8),
            baseVersion: baseVersion.substring(0, 8),
          },
        );
      }
    }

    // Write files
    for (const file of files) {
      const fullPath = path.join(dir, file.filePath);
      const fileDir = path.dirname(fullPath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      const buffer =
        file.encoding === 'base64'
          ? Buffer.from(file.content, 'base64')
          : Buffer.from(file.content, 'utf-8');
      fs.writeFileSync(fullPath, buffer);
      await git.add({ fs, dir, filepath: file.filePath });
    }

    const oid = await git.commit({
      fs,
      dir,
      message,
      author: { name: author, email: `${author}@aidochub.local` },
    });

    const log = await git.log({ fs, dir, depth: 1 });
    const version = log.length;

    return {
      oid,
      version,
      message,
      author,
      timestamp: Date.now(),
    };
  }

  async getLatestVersion(
    workspaceId: string,
    repoName: string,
  ): Promise<CommitInfo | null> {
    const dir = this.getRepoPath(workspaceId, repoName);
    this.ensureRepoExists(dir);

    const log = await git.log({ fs, dir, depth: 1 });
    if (log.length === 0) return null;

    const entry = log[0];
    return {
      oid: entry.oid,
      version: 1,
      message: entry.commit.message,
      author: entry.commit.author.name,
      timestamp: entry.commit.author.timestamp * 1000,
    };
  }

  async getHistory(
    workspaceId: string,
    repoName: string,
  ): Promise<CommitInfo[]> {
    const dir = this.getRepoPath(workspaceId, repoName);
    this.ensureRepoExists(dir);

    const log = await git.log({ fs, dir });
    return log.map((entry, index) => ({
      oid: entry.oid,
      version: log.length - index,
      message: entry.commit.message,
      author: entry.commit.author.name,
      timestamp: entry.commit.author.timestamp * 1000,
    }));
  }

  async readFileAtVersion(
    workspaceId: string,
    repoName: string,
    filePath: string,
    version?: string,
  ): Promise<string> {
    const buffer = await this.readFileBufferAtVersion(
      workspaceId,
      repoName,
      filePath,
      version,
    );
    return buffer.toString('utf-8');
  }

  async readFileBufferAtVersion(
    workspaceId: string,
    repoName: string,
    filePath: string,
    version?: string,
  ): Promise<Buffer> {
    const dir = this.getRepoPath(workspaceId, repoName);
    this.ensureRepoExists(dir);

    if (!version) {
      const fullPath = path.join(dir, filePath);
      if (!fs.existsSync(fullPath)) {
        throw new AppException(ErrorCode.FILE_NOT_FOUND, HttpStatus.NOT_FOUND, {
          path: filePath,
        });
      }
      return fs.readFileSync(fullPath);
    }

    try {
      const { blob } = await git.readBlob({
        fs,
        dir,
        oid: version,
        filepath: filePath,
      });
      return Buffer.from(blob);
    } catch {
      throw new AppException(
        ErrorCode.FILE_NOT_FOUND_AT_VERSION,
        HttpStatus.NOT_FOUND,
        { path: filePath, version: version.substring(0, 8) },
      );
    }
  }

  async restoreVersion(
    workspaceId: string,
    repoName: string,
    targetVersion: string,
    author: string,
  ): Promise<CommitInfo> {
    const dir = this.getRepoPath(workspaceId, repoName);
    this.ensureRepoExists(dir);

    const log = await git.log({ fs, dir, depth: 1 });
    const headOid = log[0]?.oid;
    const currentFiles = headOid
      ? await this.listFilesInTree(dir, headOid)
      : [];
    const targetFiles = await this.listFilesInTree(dir, targetVersion);
    const targetSet = new Set(targetFiles);

    for (const filePath of currentFiles) {
      if (targetSet.has(filePath)) {
        continue;
      }
      const fullPath = path.join(dir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      try {
        await git.remove({ fs, dir, filepath: filePath });
      } catch {
        // file may not be tracked in index
      }
    }

    for (const filePath of targetFiles) {
      const { blob } = await git.readBlob({
        fs,
        dir,
        oid: targetVersion,
        filepath: filePath,
      });
      const fullPath = path.join(dir, filePath);
      const fileDir = path.dirname(fullPath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, Buffer.from(blob));
      await git.add({ fs, dir, filepath: filePath });
    }

    const oid = await git.commit({
      fs,
      dir,
      message: `Restore to version ${targetVersion.substring(0, 8)}`,
      author: { name: author, email: `${author}@aidochub.local` },
    });

    return {
      oid,
      version: 0,
      message: `Restore to version ${targetVersion.substring(0, 8)}`,
      author,
      timestamp: Date.now(),
    };
  }

  async listFiles(
    workspaceId: string,
    repoName: string,
    version?: string,
  ): Promise<string[]> {
    const dir = this.getRepoPath(workspaceId, repoName);
    this.ensureRepoExists(dir);

    let oid = version;
    if (!oid) {
      const log = await git.log({ fs, dir, depth: 1 });
      oid = log[0]?.oid;
    }
    if (!oid) return [];

    const files = await this.listFilesInTree(dir, oid);
    return files.filter((f) => f !== 'README.md');
  }

  private async listFilesInTree(dir: string, oid: string): Promise<string[]> {
    const files: string[] = [];
    const tree = await git.readTree({ fs, dir, oid });

    const walkTree = async (
      entries: typeof tree.tree,
      prefix: string,
    ): Promise<void> => {
      for (const entry of entries) {
        const entryPath = prefix ? `${prefix}/${entry.path}` : entry.path;
        if (entry.type === 'blob') {
          files.push(entryPath);
        } else if (entry.type === 'tree') {
          try {
            const subTree = await git.readTree({ fs, dir, oid: entry.oid });
            await walkTree(subTree.tree, entryPath);
          } catch {
            // skip
          }
        }
      }
    };

    await walkTree(tree.tree, '');
    return files;
  }

  private ensureRepoExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      throw new AppException(ErrorCode.REPO_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }
}
