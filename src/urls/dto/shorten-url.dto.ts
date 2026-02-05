import { IsUrl, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShortenUrlDto {
  @ApiProperty({
    example: 'https://example.com/very/long/url',
    description: 'URL original a ser encurtada',
  })
  @IsUrl({}, { message: 'URL inválida' })
  @IsNotEmpty({ message: 'URL é obrigatória' })
  @Matches(/^https?:\/\//, { message: 'URL deve começar com http:// ou https://' })
  url: string;
}
