import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpsertCompanyDto } from '../auth/dto/auth.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async getCompany(@CurrentUser() user: any) {
    const company = await this.companyService.getCompany(user.id);
    return {
      success: true,
      company,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @CurrentUser() user: any,
    @Body() dto: UpsertCompanyDto,
  ) {
    const company = await this.companyService.upsertCompany(user.id, dto);
    return {
      success: true,
      message: 'Компания успешно создана',
      company,
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateCompany(
    @CurrentUser() user: any,
    @Body() dto: UpsertCompanyDto,
  ) {
    const company = await this.companyService.upsertCompany(user.id, dto);
    return {
      success: true,
      message: 'Компания успешно обновлена',
      company,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteCompany(@CurrentUser() user: any) {
    await this.companyService.deleteCompany(user.id);
    return {
      success: true,
      message: 'Компания успешно удалена',
    };
  }
}
