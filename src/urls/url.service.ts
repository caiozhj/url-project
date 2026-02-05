import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { ShortUrl } from '../entities/short-url.entity';
import { Sequence } from '../entities/sequence.entity';
import { ShortCodeGenerator } from './utils/short-code-generator';
import { ShortenUrlDto } from './dto/shorten-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(ShortUrl)
    private shortUrlRepository: Repository<ShortUrl>,
    @InjectRepository(Sequence)
    private sequenceRepository: Repository<Sequence>,
    private dataSource: DataSource,
  ) {}

  async shorten(url: string, userId?: string): Promise<{ shortUrl: string; shortCode: string; links: any }> {
    const sequence = await this.getNextSequence();
    const shortCode = ShortCodeGenerator.generate(sequence);

    const shortUrl = this.shortUrlRepository.create({
      originalUrl: url,
      shortCode,
      userId: userId || undefined,
      clickCount: 0,
    });

    const saved = await this.shortUrlRepository.save(shortUrl);

    const domain = process.env.SHORT_URL_DOMAIN || 'http://localhost:3000';
    const fullShortUrl = `${domain}/${saved.shortCode}`;

    const links: any = {
      self: `/api/urls/shorten`,
      redirect: `/${saved.shortCode}`,
    };

    if (userId) {
      links.list = '/api/urls';
      links.update = `/api/urls/${saved.id}`;
      links.delete = `/api/urls/${saved.id}`;
    }

    return {
      shortUrl: fullShortUrl,
      shortCode: saved.shortCode,
      links,
    };
  }

  async redirect(shortCode: string): Promise<string> {
    const shortUrl = await this.shortUrlRepository.findOne({
      where: { shortCode, deletedAt: IsNull() },
    });

    if (!shortUrl) {
      throw new NotFoundException('URL não encontrada');
    }

    await this.shortUrlRepository.increment({ id: shortUrl.id }, 'clickCount', 1);

    return shortUrl.originalUrl;
  }

  async findAllByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.shortUrlRepository.findAndCount({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const domain = process.env.SHORT_URL_DOMAIN || 'http://localhost:3000';
    const totalPages = Math.ceil(total / limit);

    const links: any = {
      self: `/api/urls?page=${page}&limit=${limit}`,
      first: `/api/urls?page=1&limit=${limit}`,
      last: `/api/urls?page=${totalPages}&limit=${limit}`,
    };

    if (page < totalPages) {
      links.next = `/api/urls?page=${page + 1}&limit=${limit}`;
    }

    if (page > 1) {
      links.prev = `/api/urls?page=${page - 1}&limit=${limit}`;
    }

    return {
      data: data.map((url) => ({
        id: url.id,
        shortUrl: `${domain}/${url.shortCode}`,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        clickCount: url.clickCount,
        createdAt: url.createdAt,
        updatedAt: url.updatedAt,
        links: {
          self: `/api/urls/${url.id}`,
          update: `/api/urls/${url.id}`,
          delete: `/api/urls/${url.id}`,
          redirect: `/${url.shortCode}`,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      links,
    };
  }

  async update(id: string, userId: string, updateDto: UpdateUrlDto): Promise<any> {
    const shortUrl = await this.shortUrlRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!shortUrl) {
      throw new NotFoundException('URL não encontrada');
    }

    if (shortUrl.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para atualizar esta URL');
    }

    shortUrl.originalUrl = updateDto.url;
    const updated = await this.shortUrlRepository.save(shortUrl);

    const domain = process.env.SHORT_URL_DOMAIN || 'http://localhost:3000';

    return {
      data: {
        id: updated.id,
        shortUrl: `${domain}/${updated.shortCode}`,
        originalUrl: updated.originalUrl,
        shortCode: updated.shortCode,
        clickCount: updated.clickCount,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      links: {
        self: `/api/urls/${updated.id}`,
        update: `/api/urls/${updated.id}`,
        delete: `/api/urls/${updated.id}`,
        redirect: `/${updated.shortCode}`,
        list: '/api/urls',
      },
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const shortUrl = await this.shortUrlRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!shortUrl) {
      throw new NotFoundException('URL não encontrada');
    }

    if (shortUrl.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para deletar esta URL');
    }

    await this.shortUrlRepository.softDelete(id);
  }

  private async getNextSequence(): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let sequence = await queryRunner.manager.findOne(Sequence, {
        where: { name: 'short_url' },
      });

      if (!sequence) {
        sequence = queryRunner.manager.create(Sequence, {
          name: 'short_url',
          value: 1,
        });
        await queryRunner.manager.save(sequence);
      } else {
        sequence.value += 1;
        await queryRunner.manager.save(sequence);
      }

      await queryRunner.commitTransaction();
      return sequence.value;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
