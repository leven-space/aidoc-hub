import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { GitModule } from '../git/git.module';

@Module({
  imports: [WorkspaceModule, GitModule],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
