import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    schema: {
      example: {
        id: 'uuid',
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email já cadastrado',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário e obter token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: '24h',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
    schema: {
      example: {
        statusCode: 401,
        message: 'Credenciais inválidas',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
