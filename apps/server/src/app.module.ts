import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NostrModule } from './modules/nostr/nostr.module';
import { EventsModule } from './modules/events/events.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { TrendingModule } from './modules/trending/trending.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.get('ORM_HOST', '127.0.0.1'),
        port: config.get<number>('ORM_PORT', 3306),
        username: config.get('ORM_USERNAME', 'root'),
        password: config.get('ORM_PASSWORD', ''),
        database: config.get('ORM_DATABASE', 'nostr_watch'),
        autoLoadEntities: true,
        synchronize: true, // Dev only - use migrations in production
      }),
    }),
    ScheduleModule.forRoot(),
    NostrModule,
    EventsModule,
    KeywordsModule,
    TrendingModule,
    AuthModule,
  ],
})
export class AppModule {}
