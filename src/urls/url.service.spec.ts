import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UrlService } from './url.service';
import { ShortUrl } from '../entities/short-url.entity';
import { ShortCodeGenerator } from './utils/short-code-generator';
import { UpdateUrlDto } from './dto/update-url.dto';

jest.mock('./utils/short-code-generator');

describe('UrlService', () => {
  let service: UrlService;
  let shortUrlRepository: any;
  let dataSource: any;

  const mockShortUrlRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    increment: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: getRepositoryToken(ShortUrl),
          useValue: mockShortUrlRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    shortUrlRepository = module.get(getRepositoryToken(ShortUrl));
    dataSource = module.get<DataSource>(DataSource);

    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
    jest.clearAllMocks();
  });

  describe('shorten', () => {
    it('deve encurtar URL sem usuário', async () => {
      const url = 'https://example.com';
      const mockShortUrl = {
        id: 'uuid',
        originalUrl: url,
        shortCode: 'aZbKq7',
        userId: null,
        clickCount: 0,
      };

      mockQueryRunner.query.mockResolvedValue([{ value: '1' }]);
      (ShortCodeGenerator.generate as jest.Mock).mockReturnValue('aZbKq7');
      mockShortUrlRepository.create.mockReturnValue(mockShortUrl);
      mockShortUrlRepository.save.mockResolvedValue(mockShortUrl);

      const result = await service.shorten(url);

      expect(mockShortUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: url,
        shortCode: 'aZbKq7',
        userId: null,
        clickCount: 0,
      });
      expect(result.shortCode).toBe('aZbKq7');
      expect(result.shortUrl).toContain('aZbKq7');
    });

    it('deve encurtar URL com usuário autenticado', async () => {
      const url = 'https://example.com';
      const userId = 'user-uuid';
      const mockShortUrl = {
        id: 'uuid',
        originalUrl: url,
        shortCode: 'aZbKq7',
        userId,
        clickCount: 0,
      };

      mockQueryRunner.query.mockResolvedValue([{ value: '1' }]);
      (ShortCodeGenerator.generate as jest.Mock).mockReturnValue('aZbKq7');
      mockShortUrlRepository.create.mockReturnValue(mockShortUrl);
      mockShortUrlRepository.save.mockResolvedValue(mockShortUrl);

      const result = await service.shorten(url, userId);

      expect(mockShortUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: url,
        shortCode: 'aZbKq7',
        userId,
        clickCount: 0,
      });
      expect(result.shortCode).toBe('aZbKq7');
    });
  });

  describe('redirect', () => {
    it('deve redirecionar e incrementar clickCount', async () => {
      const shortCode = 'aZbKq7';
      const mockShortUrl = {
        id: 'uuid',
        originalUrl: 'https://example.com',
        shortCode,
        clickCount: 0,
      };

      mockShortUrlRepository.findOne.mockResolvedValue(mockShortUrl);
      mockShortUrlRepository.increment.mockResolvedValue(undefined);

      const result = await service.redirect(shortCode);

      expect(mockShortUrlRepository.findOne).toHaveBeenCalledWith({
        where: { shortCode, deletedAt: null },
      });
      expect(mockShortUrlRepository.increment).toHaveBeenCalledWith(
        { id: mockShortUrl.id },
        'clickCount',
        1,
      );
      expect(result).toBe('https://example.com');
    });

    it('deve lançar NotFoundException se URL não existe', async () => {
      mockShortUrlRepository.findOne.mockResolvedValue(null);

      await expect(service.redirect('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByUser', () => {
    it('deve listar URLs do usuário com paginação', async () => {
      const userId = 'user-uuid';
      const mockUrls = [
        {
          id: 'uuid1',
          shortCode: 'code1',
          originalUrl: 'https://example.com',
          clickCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockShortUrlRepository.findAndCount.mockResolvedValue([mockUrls, 1]);

      const result = await service.findAllByUser(userId, 1, 10);

      expect(mockShortUrlRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId, deletedAt: null },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('update', () => {
    it('deve atualizar URL do usuário', async () => {
      const id = 'url-uuid';
      const userId = 'user-uuid';
      const updateDto: UpdateUrlDto = { url: 'https://new-url.com' };
      const mockShortUrl = {
        id,
        userId,
        originalUrl: 'https://old-url.com',
        shortCode: 'code1',
      };

      mockShortUrlRepository.findOne.mockResolvedValue(mockShortUrl);
      mockShortUrlRepository.save.mockResolvedValue({
        ...mockShortUrl,
        originalUrl: updateDto.url,
      });

      const result = await service.update(id, userId, updateDto);

      expect(mockShortUrlRepository.findOne).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
      expect(result.originalUrl).toBe(updateDto.url);
    });

    it('deve lançar NotFoundException se URL não existe', async () => {
      mockShortUrlRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid', 'user-uuid', { url: 'https://example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException se URL não pertence ao usuário', async () => {
      const mockShortUrl = {
        id: 'url-uuid',
        userId: 'other-user',
      };

      mockShortUrlRepository.findOne.mockResolvedValue(mockShortUrl);

      await expect(
        service.update('url-uuid', 'user-uuid', { url: 'https://example.com' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete da URL', async () => {
      const id = 'url-uuid';
      const userId = 'user-uuid';
      const mockShortUrl = {
        id,
        userId,
      };

      mockShortUrlRepository.findOne.mockResolvedValue(mockShortUrl);
      mockShortUrlRepository.softDelete.mockResolvedValue(undefined);

      await service.remove(id, userId);

      expect(mockShortUrlRepository.findOne).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
      expect(mockShortUrlRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('deve lançar NotFoundException se URL não existe', async () => {
      mockShortUrlRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid', 'user-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException se URL não pertence ao usuário', async () => {
      const mockShortUrl = {
        id: 'url-uuid',
        userId: 'other-user',
      };

      mockShortUrlRepository.findOne.mockResolvedValue(mockShortUrl);

      await expect(service.remove('url-uuid', 'user-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
