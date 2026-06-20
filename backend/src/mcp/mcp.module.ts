import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpServer } from './mcp.server';
import { McpHttpService } from './mcp-http.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { RepoModule } from '../repo/repo.module';
import { GitModule } from '../git/git.module';
import { AuthModule } from '../auth/auth.module';
import { SystemModule } from '../system/system.module';
import { McpAuthGuard } from '../common/guards/mcp-auth.guard';

@Module({
  imports: [WorkspaceModule, RepoModule, GitModule, AuthModule, SystemModule],
  controllers: [McpController],
  providers: [McpServer, McpHttpService, McpAuthGuard],
})
export class McpModule {}
