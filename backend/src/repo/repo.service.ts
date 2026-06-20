import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { PrismaService } from '../common/prisma/prisma.service';
import { GitService } from '../git/git.service';
import { WorkspaceService } from '../workspace/workspace.service';

const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.msi'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_COMMIT = 50;

@Injectable()
export class RepoService {
  private purifier: any;

  constructor(
    private prisma: PrismaService,
    private gitService: GitService,
    private workspaceService: WorkspaceService,
  ) {
    const window = new JSDOM('').window;
    this.purifier = DOMPurify(window as any);
  }

  async createRepo(workspaceId: string, userId: string, name: string, description?: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);

    // Check duplicate
    const existing = await this.prisma.repository.findFirst({
      where: { workspaceId, name, isDeleted: false },
    });
    if (existing) {
      throw new BadRequestException('Repository with this name already exists');
    }

    // Create DB record
    const repo = await this.prisma.repository.create({
      data: { name, description: description || '', workspaceId },
    });

    // Initialize git repo
    await this.gitService.initRepo(workspaceId, repo.id);

    return repo;
  }

  async listRepos(workspaceId: string, userId: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    return this.prisma.repository.findMany({
      where: { workspaceId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getRepo(repoId: string, workspaceId: string, userId: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    const repo = await this.prisma.repository.findFirst({
      where: { id: repoId, workspaceId, isDeleted: false },
    });
    if (!repo) {
      throw new NotFoundException('Repository not found');
    }
    const latest = await this.gitService.getLatestVersion(workspaceId, repoId);
    return { ...repo, latestVersion: latest };
  }

  async softDeleteRepo(repoId: string, workspaceId: string, userId: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    await this.prisma.repository.update({
      where: { id: repoId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { success: true };
  }

  async commitFiles(
    repoId: string,
    workspaceId: string,
    userId: string,
    files: { filePath: string; content: string }[],
    message: string,
    baseVersion?: string,
    forceOverwrite?: boolean,
  ) {
    await this.workspaceService.checkEditor(workspaceId, userId);

    // Validate files
    this.validateFiles(files);

    // Sanitize HTML content only; pass through other file types as-is
    const processedFiles = files.map((f) => {
      const ext = f.filePath.substring(f.filePath.lastIndexOf('.')).toLowerCase();
      if (['.html', '.htm', '.svg', '.xml'].includes(ext)) {
        return { ...f, content: this.sanitizeHtml(f.content) };
      }
      return f;
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const author = user?.name || userId;

    const result = await this.gitService.commitFiles(
      workspaceId,
      repoId,
      processedFiles,
      message,
      author,
      baseVersion,
      forceOverwrite,
    );

    // Update repo updatedAt
    await this.prisma.repository.update({
      where: { id: repoId },
      data: { updatedAt: new Date() },
    });

    return result;
  }

  async getFiles(repoId: string, workspaceId: string, userId: string, version?: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    return this.gitService.listFiles(workspaceId, repoId, version);
  }

  async listDeletedRepos(workspaceId: string, userId: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.prisma.repository.findMany({
      where: {
        workspaceId,
        isDeleted: true,
        deletedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async restoreRepo(repoId: string, workspaceId: string, userId: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    const repo = await this.prisma.repository.findFirst({
      where: { id: repoId, workspaceId, isDeleted: true },
    });
    if (!repo) {
      throw new NotFoundException('Deleted repository not found');
    }
    return this.prisma.repository.update({
      where: { id: repoId },
      data: { isDeleted: false, deletedAt: null },
    });
  }

  async permanentDeleteRepo(repoId: string, workspaceId: string, userId: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    const repo = await this.prisma.repository.findFirst({
      where: { id: repoId, workspaceId, isDeleted: true },
    });
    if (!repo) {
      throw new NotFoundException('Deleted repository not found');
    }
    await this.prisma.repository.delete({ where: { id: repoId } });
    return { success: true };
  }

  async readFile(
    repoId: string,
    workspaceId: string,
    userId: string,
    filePath: string,
    version?: string,
  ) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    return this.gitService.readFileAtVersion(workspaceId, repoId, filePath, version);
  }

  private validateFiles(files: { filePath: string; content: string }[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    if (files.length > MAX_FILES_PER_COMMIT) {
      throw new BadRequestException(`Maximum ${MAX_FILES_PER_COMMIT} files per commit`);
    }
    for (const file of files) {
      const ext = file.filePath.substring(file.filePath.lastIndexOf('.')).toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        throw new BadRequestException(`File type ${ext} is not allowed for security reasons`);
      }
      // Prevent path traversal
      if (file.filePath.includes('..') || file.filePath.startsWith('/')) {
        throw new BadRequestException(`Invalid file path: ${file.filePath}`);
      }
      if (Buffer.byteLength(file.content) > MAX_FILE_SIZE) {
        throw new BadRequestException(`File ${file.filePath} exceeds maximum size of 10MB`);
      }
    }
  }

  private sanitizeHtml(content: string): string {
    return this.purifier.sanitize(content, {
      FORBID_TAGS: ['script', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  }
}

