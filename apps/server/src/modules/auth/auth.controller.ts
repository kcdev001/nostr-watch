import { Controller, Post, Body, HttpCode, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Post('verify')
  @HttpCode(200)
  verify(@Body('secretKey') secretKey: string) {
    const adminKey = this.configService.get<string>('ADMIN_SECRET_KEY', '');
    if (!adminKey || secretKey !== adminKey) {
      throw new UnauthorizedException('Invalid secret key');
    }
    return { ok: true };
  }
}
