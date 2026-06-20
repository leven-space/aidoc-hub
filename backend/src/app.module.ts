import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { GitModule } from './git/git.module';
import { RepoModule } from './repo/repo.module';
import { VersionModule } from './version/version.module';
import { ShareModule } from './share/share.module';
import { McpModule } from './mcp/mcp.module';
import { AuditModule } from './audit/audit.module';
import { SystemModule } from './system/system.module';
import { AuditMiddleware } from './common/middlewares/audit.middleware';
import { HttpLoggerMiddleware } from './common/middlewares/http-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    SystemModule,
    WorkspaceModule,
    GitModule,
    RepoModule,
    VersionModule,
    ShareModule,
    McpModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware, AuditMiddleware).forRoutes('*');
  }
}
