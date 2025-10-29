import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Get,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import {
  ForgotResetDto,
  ForgotStartDto,
  ForgotVerifyDto,
  LoginDto,
  RegisterDto,
  RegisterSendCodeDto,
  RegisterVerifyCodeDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 попытки в 5 минут
  @Post('register/send-code')
  @HttpCode(HttpStatus.OK)
  async sendRegistrationCode(@Body() dto: RegisterSendCodeDto) {
    const devCode = await this.authService.sendRegistrationCode(dto);
    return {
      success: true,
      message: 'Код подтверждения отправлен',
      ...(process.env.NODE_ENV === 'development' && devCode ? { devCode } : {}),
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 600000 } }) // 10 попыток в 10 минут
  @Post('register/verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyRegistrationCode(@Body() dto: RegisterVerifyCodeDto) {
    await this.authService.verifyRegistrationCode(dto);
    return {
      success: true,
      message: 'Код подтвержден',
    };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 попытки в 5 минут
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Устанавливаем cookies с токенами
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      user: result.user,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 попыток в 15 минут
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Устанавливаем cookies с токенами
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      success: true,
      message: 'Вход выполнен успешно',
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Пользователь не найден или пароль неверный');
    }

    const result = await this.authService.refreshTokens(refreshToken);

    // Обновляем cookies с новыми токенами
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      success: true,
      message: 'Токены обновлены',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.['refresh_token'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Удаляем cookies
    this.clearAuthCookies(response);

    return {
      success: true,
      message: 'Выход выполнен успешно',
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(user.id);

    // Удаляем cookies
    this.clearAuthCookies(response);

    return {
      success: true,
      message: 'Выход со всех устройств выполнен успешно',
    };
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    const currentUser = await this.authService.getCurrentUser(user.id);

    return {
      success: true,
      user: currentUser,
    };
  }

  @Get('validate')
  async validateToken(@CurrentUser() user: any) {
    return {
      success: true,
      valid: true,
      user: {
        id: user.id,
        phone: user.phone,
      },
    };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } }) // 3 раза за 15 минут
  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  async forgot(@Body() dto: ForgotStartDto) {
    return this.authService.sendPasswordResetCode(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @Post('forgot/verify')
  @HttpCode(HttpStatus.OK)
  async verifyForgot(@Body() dto: ForgotVerifyDto) {
    const { password } = await this.authService.generateNewPasswordByCode(dto);
    return {
      success: true,
      message: 'Новый пароль сгенерирован',
      password, // ⚠️ В проде лучше отправлять по SMS/e-mail и не отдавать в ответе
    };
  }

  /**
   * Устанавливает secure cookies с токенами
   */
  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // Access token cookie (короткоживущий)
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS в production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 минут
      path: '/',
    });

    // Refresh token cookie (долгоживущий)
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS в production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      path: '/',
    });
  }

  /**
   * Удаляет cookies с токенами
   */
  private clearAuthCookies(response: Response): void {
    response.clearCookie('access_token', {
      httpOnly: true,
      path: '/',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      path: '/',
    });
  }
}
