import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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
}

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
    files: { filePath: string; content: string }[],
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
        throw new ConflictException(
          `当前最新版本为 ${latestOid.substring(0, 8)}，与您基于的版本 ${baseVersion.substring(0, 8)} 不一致。如需强制提交，请设置 forceOverwrite 为 true。`,
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
      fs.writeFileSync(fullPath, file.content);
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
    const dir = this.getRepoPath(workspaceId, repoName);
    this.ensureRepoExists(dir);

    if (!version) {
      // Read from latest (working directory)
      const fullPath = path.join(dir, filePath);
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException(`File not found: ${filePath}`);
      }
      return fs.readFileSync(fullPath, 'utf-8');
    }

    // Read from specific commit
    try {
      const { blob } = await git.readBlob({
        fs,
        dir,
        oid: version,
        filepath: filePath,
      });
      return Buffer.from(blob).toString('utf-8');
    } catch {
      throw new NotFoundException(
        `File not found: ${filePath} at version ${version.substring(0, 8)}`,
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

    // Get all files at target version
    const tree = await git.readTree({
      fs,
      dir,
      oid: targetVersion,
    });

    // Checkout files from target version to working directory
    const files = await this.listFilesInTree(dir, targetVersion);
    for (const filePath of files) {
      try {
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
      } catch {
        // skip files that can't be read
      }
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
      throw new NotFoundException('Repository not found');
    }
  }
}
