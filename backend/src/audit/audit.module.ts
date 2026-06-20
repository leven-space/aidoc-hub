import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [WorkspaceModule, SystemModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
