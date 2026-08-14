import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SEED_USERS } from './users';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    const user = SEED_USERS.find((u) => u.username === username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const payload = {
      sub: user.username,
      username: user.username,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { username: user.username, role: user.role },
    };
  }

  me(user: { username: string; role: string }) {
    return { username: user.username, role: user.role };
  }
}
