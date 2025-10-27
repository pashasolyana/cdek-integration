import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsAuthHeader: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const email = this.configService.get<string>('SMS_API_EMAIL');
    const apiKey = this.configService.get<string>('SMS_API_KEY');
    
    if (!email || !apiKey) {
      this.logger.warn('SMS credentials not configured');
    }
    
    this.smsAuthHeader = `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;
  }

  /** Authenticate with SMS provider */
  private async authSMSApi(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `https://${this.configService.get<string>('SMS_API_URL')}/auth`,
          { headers: { Authorization: this.smsAuthHeader } },
        ),
      );
      
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Authentication failed');
      }
    } catch (err) {
      this.logger.error('SMS API auth error', err);
      throw new HttpException(
        'SMS service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Check SMS service balance and ensure it meets the threshold.
   * @param threshold Minimum required balance.
   */
  private async checkBalance(threshold = 10): Promise<number> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `https://${this.configService.get<string>('SMS_API_URL')}/balance`,
          { headers: { Authorization: this.smsAuthHeader } },
        ),
      );
      
      this.logger.debug('Balance response:', JSON.stringify(res.data));
      
      // SMS Aero возвращает { success: true, data: { balance: number } }
      const balance = Number(res?.data?.data?.balance ?? res?.data?.balance);
      
      if (isNaN(balance)) {
        this.logger.error('Invalid balance response structure:', res.data);
        throw new Error('Invalid balance response');
      }
      if (balance < threshold) {
        this.logger.warn(`Low SMS balance: ${balance}`);
        throw new HttpException(
          `Insufficient SMS balance: ${balance}`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      return balance;
    } catch (err) {
      this.logger.error('Balance check error', err);
      throw new HttpException(
        'SMS balance service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /** Send SMS with a code via SMS provider */
  async sendSms(phone: string, code: string): Promise<void> {
    await this.authSMSApi();
    await this.checkBalance();
    
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `https://${this.configService.get<string>('SMS_API_URL')}/sms/send`,
          {
            headers: { Authorization: this.smsAuthHeader },
            params: { 
              number: phone, 
              text: `Ваш код подтверждения: ${code}`, 
              sign: 'SMS Aero' 
            },
          },
        ),
      );
      
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'SMS send failed');
      }
      
      this.logger.log(`SMS sent successfully to ${phone}`);
    } catch (err) {
      this.logger.error('SMS send error', err);
      throw new HttpException(
        'Failed to send SMS',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
