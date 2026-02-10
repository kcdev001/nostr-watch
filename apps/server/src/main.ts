import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { FileLogger } from './common/file-logger';

async function bootstrap() {
  const logger = new FileLogger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();

  const port = process.env.PORT || 3100;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
}
bootstrap();
