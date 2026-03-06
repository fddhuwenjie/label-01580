import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MinLength(1, { message: '标题至少1个字符' })
  @MaxLength(200, { message: '标题最多200个字符' })
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '摘要最多500个字符' })
  summary?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
