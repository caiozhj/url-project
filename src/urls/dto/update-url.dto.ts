import { IsUrl, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUrlDto {
  @ApiProperty({
    example: 'https://new-url.com',
    description: 'Nova URL de destino',
  })
  @IsUrl({}, { message: 'URL inválida' })
  @IsNotEmpty({ message: 'URL é obrigatória' })
  @Matches(/^https?:\/\//, { message: 'URL deve começar com http:// ou https://' })
  url: string;
}
