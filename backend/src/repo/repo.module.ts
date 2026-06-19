import { Module } from '@nestjs/common';
import { RepoService } from './repo.service';
import { RepoController } from './repo.controller';
import { GitModule } from '../git/git.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [GitModule, WorkspaceModule],
  controllers: [RepoController],
  providers: [RepoService],
  exports: [RepoService],
})
export class RepoModule {}
