import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import { AppConfig } from '@src/config.module';

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_PREFIX = 'otp:';

@Injectable()
export class OtpService {
  private redis: Redis;
  private ses: SESClient;
  private fromEmail: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.redis = new Redis(config.get('REDIS_URL'));
    this.ses = new SESClient({
      region: config.get('AWS_REGION'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.fromEmail = config.get('OTP_FROM_EMAIL');
  }

  async sendOtp(email: string): Promise<void> {
    const code = this.generateCode();
    await this.redis.set(`${OTP_PREFIX}${email}`, code, 'EX', OTP_TTL_SECONDS);
    await this.sendEmail(email, code);
  }

  async verifyOtp(email: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`${OTP_PREFIX}${email}`);
    if (!stored || stored !== code) {
      throw new BadRequestException('Invalid or expired code.');
    }
    // One-time use — delete after verification
    await this.redis.del(`${OTP_PREFIX}${email}`);
    return true;
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendEmail(to: string, code: string): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: `${code} is your zivodoc verification code` },
        Body: {
          Html: {
            Data: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 0;">
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Sign in to zivodoc</h2>
                <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Enter this code to verify your email:</p>
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 24px; background: #f5f5f5; text-align: center; margin-bottom: 24px;">${code}</div>
                <p style="font-size: 12px; color: #999;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
              </div>
            `,
          },
          Text: {
            Data: `Your zivodoc verification code is: ${code}\n\nThis code expires in 5 minutes.`,
          },
        },
      },
    });

    await this.ses.send(command);
  }
}
