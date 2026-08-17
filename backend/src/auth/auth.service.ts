import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { salon: true },
    });

    // Mensagem genérica em ambos os casos — evita revelar se o email existe.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      salonId: user.salonId,
      email: user.email,
    });

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
      salon: { id: user.salon.id, name: user.salon.name, slug: user.salon.slug, logoUrl: user.salon.logoUrl, whatsappNumber: user.salon.whatsappNumber },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { salon: true },
    });
    if (!user) {
      throw new UnauthorizedException('Sessão inválida.');
    }

    return {
      user: { id: user.id, name: user.name, email: user.email },
      salon: { id: user.salon.id, name: user.salon.name, slug: user.salon.slug, logoUrl: user.salon.logoUrl, whatsappNumber: user.salon.whatsappNumber },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.name, email: dto.email },
        include: { salon: true },
      });

      return {
        user: { id: user.id, name: user.name, email: user.email },
        salon: { id: user.salon.id, name: user.salon.name, slug: user.salon.slug, logoUrl: user.salon.logoUrl, whatsappNumber: user.salon.whatsappNumber },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Já existe uma conta com esse email.');
      }
      throw err;
    }
  }
}
