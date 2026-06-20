import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import { GitService } from '../git/git.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class VersionService {
  constructor(
    private gitService: GitService,
    private workspaceService: WorkspaceService,
    private prisma: PrismaService,
  ) {}

  private async assertRepo(workspaceId: string, repoId: string) {
    const repo = await this.prisma.repository.findFirst({
      where: { id: repoId, workspaceId, isDeleted: false },
    });
    if (!repo) {
      throw new AppException(ErrorCode.REPO_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return repo;
  }

  async getHistory(workspaceId: string, repoId: string, userId: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    await this.assertRepo(workspaceId, repoId);
    return this.gitService.getHistory(workspaceId, repoId);
  }

  async getDiff(
    workspaceId: string,
    repoId: string,
    userId: string,
    filePath: string,
    fromVersion: string,
    toVersion: string,
  ) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    await this.assertRepo(workspaceId, repoId);

    if (!filePath?.trim()) {
      throw new AppException(ErrorCode.PATH_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (!fromVersion?.trim() || !toVersion?.trim()) {
      throw new AppException(
        ErrorCode.VERSION_RANGE_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const fromContent = await this.gitService.readFileAtVersion(
      workspaceId,
      repoId,
      filePath,
      fromVersion,
    );
    const toContent = await this.gitService.readFileAtVersion(
      workspaceId,
      repoId,
      filePath,
      toVersion,
    );

    // Simple line-based diff
    const fromLines = fromContent.split('\n');
    const toLines = toContent.split('\n');
    const diff: {
      type: 'add' | 'remove' | 'same';
      line: string;
      lineNumber: number;
    }[] = [];

    const maxLen = Math.max(fromLines.length, toLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < fromLines.length && i < toLines.length) {
        if (fromLines[i] === toLines[i]) {
          diff.push({ type: 'same', line: toLines[i], lineNumber: i + 1 });
        } else {
          diff.push({ type: 'remove', line: fromLines[i], lineNumber: i + 1 });
          diff.push({ type: 'add', line: toLines[i], lineNumber: i + 1 });
        }
      } else if (i < fromLines.length) {
        diff.push({ type: 'remove', line: fromLines[i], lineNumber: i + 1 });
      } else {
        diff.push({ type: 'add', line: toLines[i], lineNumber: i + 1 });
      }
    }

    return {
      filePath,
      fromVersion,
      toVersion,
      fromContent,
      toContent,
      diff,
    };
  }

  async restoreVersion(
    workspaceId: string,
    repoId: string,
    userId: string,
    targetVersion: string,
  ) {
    await this.workspaceService.checkEditor(workspaceId, userId);
    await this.assertRepo(workspaceId, repoId);

    if (!targetVersion?.trim()) {
      throw new AppException(
        ErrorCode.VERSION_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const author = user?.name || userId;

    return this.gitService.restoreVersion(
      workspaceId,
      repoId,
      targetVersion,
      author,
    );
  }
}
