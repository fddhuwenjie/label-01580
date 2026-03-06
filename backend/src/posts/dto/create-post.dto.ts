import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @MinLength(1, { message: '标题至少1个字符' })
  @MaxLength(200, { message: '标题最多200个字符' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '摘要最多500个字符' })
  summary?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
