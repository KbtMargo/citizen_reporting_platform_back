// import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
// import { AuthService } from './auth.service';

// @Controller('api/auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//  @Post('register')
//   register(@Body() body: { email: string; password: string; firstName: string; lastName: string; invitationCode: string; phone?: string; recaptchaToken: string }) {
//     return this.authService.register(body.email, body.password, body.firstName, body.lastName, body.invitationCode, body.phone, body.recaptchaToken);
//   }

//   @HttpCode(HttpStatus.OK)
//   @Post('login')
//   login(@Body() body: { email: string; password: string }) {
//     return this.authService.login(body.email, body.password);
//   }

//   @Post('google-register')
//   googleRegister(@Body() body: { 
//     googleToken: string; invitationCode: string; phone?: string, recaptchaToken: string 
//   }) {
//     return this.authService.googleRegister(body.googleToken, body.invitationCode, body.phone, body.recaptchaToken);
//   }
// }


import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: { 
    email: string; password: string; firstName: string; lastName: string; 
    invitationCode: string; phone?: string 
  }) {
    return this.authService.register(body.email, body.password, body.firstName, body.lastName, body.invitationCode, body.phone);
  }

  @Post('google-register')
  googleRegister(@Body() body: { 
    googleToken: string; invitationCode: string; phone?: string 
  }) {
    return this.authService.googleRegister(body.googleToken, body.invitationCode, body.phone);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}