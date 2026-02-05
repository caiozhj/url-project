import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UrlService } from './url.service';
import { ShortenUrlDto } from './dto/shorten-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('urls')
@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('api/urls/shorten')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Encurtar URL (público ou autenticado)' })
  @ApiBody({ type: ShortenUrlDto })
  @ApiResponse({
    status: 201,
    description: 'URL encurtada com sucesso',
    schema: {
      example: {
        shortUrl: 'http://localhost:3000/aZbKq7',
        shortCode: 'aZbKq7',
        links: {
          self: '/api/urls/shorten',
          redirect: '/aZbKq7',
          list: '/api/urls',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida',
  })
  async shorten(
    @Body() shortenDto: ShortenUrlDto,
    @CurrentUser() user?: { userId: string },
  ) {
    return this.urlService.shorten(shortenDto.url, user?.userId);
  }

  @Get(':shortCode')
  @HttpCode(HttpStatus.FOUND)
  @ApiOperation({ summary: 'Redirecionar para URL original' })
  @ApiResponse({
    status: 302,
    description: 'Redirecionamento para URL original',
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
  })
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    const originalUrl = await this.urlService.redirect(shortCode);
    return res.redirect(302, originalUrl);
  }

  @Get('api/urls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar URLs do usuário autenticado' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de URLs do usuário',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            shortUrl: 'http://localhost:3000/aZbKq7',
            originalUrl: 'https://example.com',
            shortCode: 'aZbKq7',
            clickCount: 42,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
        links: {
          self: '/api/urls?page=1&limit=10',
          first: '/api/urls?page=1&limit=10',
          last: '/api/urls?page=1&limit=10',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.urlService.findAllByUser(user.userId, pageNum, limitNum);
  }

  @Put('api/urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar URL original' })
  @ApiBody({ type: UpdateUrlDto })
  @ApiResponse({
    status: 200,
    description: 'URL atualizada com sucesso',
    schema: {
      example: {
        data: {
          id: 'uuid',
          shortUrl: 'http://localhost:3000/aZbKq7',
          originalUrl: 'https://example.com',
          clickCount: 42,
        },
        links: {
          self: '/api/urls/uuid',
          update: '/api/urls/uuid',
          delete: '/api/urls/uuid',
          redirect: '/aZbKq7',
          list: '/api/urls',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para atualizar esta URL',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUrlDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.urlService.update(id, user.userId, updateDto);
  }

  @Delete('api/urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar URL (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'URL deletada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar esta URL',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    await this.urlService.remove(id, user.userId);
  }
}
