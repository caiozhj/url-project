import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('deve chamar authService.register e retornar resultado', async () => {
      const expectedResult = {
        id: 'user-uuid',
        email: registerDto.email,
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar ConflictException do service', async () => {
      const error = new ConflictException('Email já cadastrado');

      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Email já cadastrado',
      );

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('deve chamar authService.login e retornar token', async () => {
      const expectedResult = {
        token: 'jwt-token-123',
        expiresIn: '24h',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar UnauthorizedException do service', async () => {
      const error = new UnauthorizedException('Credenciais inválidas');

      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
