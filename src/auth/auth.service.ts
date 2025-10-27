import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library'; 
import axios from 'axios'; 
@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

private async verifyRecaptcha(token: string): Promise<void> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) throw new BadRequestException('reCAPTCHA не налаштовано на сервері');

    const body = new URLSearchParams();
    body.append('secret', secretKey);
    body.append('response', token);

    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const allowed = new Set(['localhost', '127.0.0.1', '::1', ]);
    if (!data?.success) {
      throw new BadRequestException(`Валідація reCAPTCHA не пройдена: ${data?.['error-codes']?.join(', ') || 'unknown'}`);
    }
    if (data?.hostname && !allowed.has(data.hostname)) {
      throw new BadRequestException(`Несанкціонований hostname: ${data.hostname}`);
    }
  }
  async register(email: string, password: string, firstName: string, lastName: string, invitationCode: string, phone: string | undefined, recaptchaToken: string) {
    
    await this.verifyRecaptcha(recaptchaToken);
    const osbb = await this.prisma.oSBB.findUnique({ where: { invitationCode } });
    if (!osbb) throw new BadRequestException('Неправильний код-запрошення ОСББ');
    
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Користувач з таким email вже існує');
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        osbbId: osbb.id,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async googleRegister(googleToken: string, invitationCode: string, phone: string | undefined, recaptchaToken: string) {
  await this.verifyRecaptcha(recaptchaToken);

    const osbb = await this.prisma.oSBB.findUnique({ where: { invitationCode } });
    if (!osbb) throw new BadRequestException('Неправильний код-запрошення ОСББ');

    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      throw new UnauthorizedException('Невалідний Google-токен');
    }
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.given_name || !payload.family_name) {
      throw new BadRequestException('Не вдалося отримати дані з Google-токену');
    }

    const { email, given_name: firstName, family_name: lastName } = payload;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Користувач з таким email вже існує');

    const user = await this.prisma.user.create({
      data: {
        email,
        password: `google_user_${(123)}`,
        firstName,
        lastName,
        phone,
        osbbId: osbb.id,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Неправильний email або пароль');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}

