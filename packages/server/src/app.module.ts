import { Module } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';

const webDist = join(__dirname, '..', '..', 'web', 'dist');
const staticImports = existsSync(webDist)
  ? [
      ServeStaticModule.forRoot({
        rootPath: webDist,
        exclude: ['/api/(.*)'],
      }),
    ]
  : [];

@Module({
  imports: [...staticImports, AuthModule],
})
export class AppModule {}
