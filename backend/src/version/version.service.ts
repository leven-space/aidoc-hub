import { Injectable } from '@nestjs/common';
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

  async getHistory(workspaceId: string, repoId: string, userId: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
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
    const diff: { type: 'add' | 'remove' | 'same'; line: string; lineNumber: number }[] = [];

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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const author = user?.name || userId;

    return this.gitService.restoreVersion(workspaceId, repoId, targetVersion, author);
  }
}
