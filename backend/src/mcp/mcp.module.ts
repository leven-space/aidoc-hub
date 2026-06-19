import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpServer } from './mcp.server';
import { WorkspaceModule } from '../workspace/workspace.module';
import { RepoModule } from '../repo/repo.module';
import { GitModule } from '../git/git.module';

@Module({
  imports: [WorkspaceModule, RepoModule, GitModule],
  controllers: [McpController],
  providers: [McpServer],
})
export class McpModule {}
