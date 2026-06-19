import { Module } from '@nestjs/common';
import { VersionService } from './version.service';
import { VersionController } from './version.controller';
import { GitModule } from '../git/git.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [GitModule, WorkspaceModule],
  controllers: [VersionController],
  providers: [VersionService],
})
export class VersionModule {}
