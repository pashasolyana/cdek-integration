import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCompanyDto } from '../auth/dto/auth.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить информацию о компании пользователя
   */
  async getCompany(userId: number) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    return company;
  }

  /**
   * Создать или обновить компанию пользователя
   */
  async upsertCompany(userId: number, dto: UpsertCompanyDto) {
    // Нормализация телефона компании если есть
    const normalizedCompanyPhone = dto.phone ? this.normalizePhone(dto.phone) : null;

    try {
      const company = await this.prisma.company.upsert({
        where: { userId },
        create: {
          userId,
          companyType: dto.companyType,
          companyName: dto.companyName,
          inn: dto.inn,
          kpp: dto.kpp,
          ogrn: dto.ogrn,
          email: dto.email,
          phone: normalizedCompanyPhone,
          bik: dto.bik,
          settlementAccount: dto.settlementAccount,
          correspondentAccount: dto.correspondentAccount,
          actualAddress: dto.actualAddress,
          legalIndex: dto.legalIndex,
          legalCity: dto.legalCity,
          legalAddress: dto.legalAddress,
        },
        update: {
          companyType: dto.companyType,
          companyName: dto.companyName,
          inn: dto.inn,
          kpp: dto.kpp,
          ogrn: dto.ogrn,
          email: dto.email,
          phone: normalizedCompanyPhone,
          bik: dto.bik,
          settlementAccount: dto.settlementAccount,
          correspondentAccount: dto.correspondentAccount,
          actualAddress: dto.actualAddress,
          legalIndex: dto.legalIndex,
          legalCity: dto.legalCity,
          legalAddress: dto.legalAddress,
        },
      });

      return company;
    } catch (e: any) {
      if (e.code === 'P2002') {
        const target = e.meta?.target;
        if (Array.isArray(target) && target.includes('inn')) {
          throw new ConflictException('Компания с таким ИНН уже зарегистрирована');
        }
      }
      throw e;
    }
  }

  /**
   * Удалить компанию пользователя
   */
  async deleteCompany(userId: number) {
    try {
      await this.prisma.company.delete({
        where: { userId },
      });
      return { success: true, message: 'Компания удалена' };
    } catch (e: any) {
      if (e.code === 'P2025') {
        throw new NotFoundException('Компания не найдена');
      }
      throw e;
    }
  }

  /**
   * Нормализация номера телефона к формату 8XXXXXXXXXX
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/[^\d]/g, '');

    if (normalized.startsWith('7') && normalized.length === 11) {
      normalized = '8' + normalized.slice(1);
    }

    if (normalized.length === 10) {
      normalized = '8' + normalized;
    }

    if (!normalized.match(/^8\d{10}$/)) {
      throw new Error('Некорректный формат номера телефона');
    }

    return normalized;
  }
}
