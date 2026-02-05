import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { ShortenUrlDto } from './dto/shorten-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';

describe('UrlController', () => {
  let controller: UrlController;
  let urlService: UrlService;

  const mockUrlService = {
    shorten: jest.fn(),
    redirect: jest.fn(),
    findAllByUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService,
        },
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    urlService = module.get<UrlService>(UrlService);

    jest.clearAllMocks();
  });

  describe('shorten', () => {
    const shortenDto: ShortenUrlDto = {
      url: 'https://example.com',
    };

    it('deve chamar urlService.shorten e retornar resultado', async () => {
      const expectedResult = {
        shortUrl: 'http://localhost:3000/aZbKq7',
        shortCode: 'aZbKq7',
      };

      mockUrlService.shorten.mockResolvedValue(expectedResult);

      const result = await controller.shorten(shortenDto);

      expect(urlService.shorten).toHaveBeenCalledWith(shortenDto.url, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('deve passar userId se usuário estiver autenticado', async () => {
      const user = { userId: 'user-uuid' };
      const expectedResult = {
        shortUrl: 'http://localhost:3000/aZbKq7',
        shortCode: 'aZbKq7',
      };

      mockUrlService.shorten.mockResolvedValue(expectedResult);

      await controller.shorten(shortenDto, user);

      expect(urlService.shorten).toHaveBeenCalledWith(shortenDto.url, user.userId);
    });
  });

  describe('redirect', () => {
    it('deve chamar urlService.redirect e redirecionar', async () => {
      const shortCode = 'aZbKq7';
      const originalUrl = 'https://example.com';
      const mockResponse = {
        redirect: jest.fn(),
      };

      mockUrlService.redirect.mockResolvedValue(originalUrl);

      await controller.redirect(shortCode, mockResponse as any);

      expect(urlService.redirect).toHaveBeenCalledWith(shortCode);
      expect(mockResponse.redirect).toHaveBeenCalledWith(302, originalUrl);
    });
  });

  describe('findAll', () => {
    it('deve chamar urlService.findAllByUser com paginação', async () => {
      const user = { userId: 'user-uuid' };
      const expectedResult = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      mockUrlService.findAllByUser.mockResolvedValue(expectedResult);

      const result = await controller.findAll(user, '1', '10');

      expect(urlService.findAllByUser).toHaveBeenCalledWith(user.userId, 1, 10);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUrlDto = {
      url: 'https://new-url.com',
    };

    it('deve chamar urlService.update e retornar resultado', async () => {
      const id = 'url-uuid';
      const user = { userId: 'user-uuid' };
      const expectedResult = {
        id,
        originalUrl: updateDto.url,
      };

      mockUrlService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto, user);

      expect(urlService.update).toHaveBeenCalledWith(id, user.userId, updateDto);
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar NotFoundException do service', async () => {
      const error = new NotFoundException('URL não encontrada');
      mockUrlService.update.mockRejectedValue(error);

      await expect(
        controller.update('invalid', updateDto, { userId: 'user-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve chamar urlService.remove', async () => {
      const id = 'url-uuid';
      const user = { userId: 'user-uuid' };

      mockUrlService.remove.mockResolvedValue(undefined);

      await controller.remove(id, user);

      expect(urlService.remove).toHaveBeenCalledWith(id, user.userId);
    });

    it('deve propagar ForbiddenException do service', async () => {
      const error = new ForbiddenException('Sem permissão');
      mockUrlService.remove.mockRejectedValue(error);

      await expect(controller.remove('url-uuid', { userId: 'user-uuid' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
