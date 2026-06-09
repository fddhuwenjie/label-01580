import { IsNotEmpty, IsOptional, IsString, MaxLength, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: '评论内容不能为空' })
  @MaxLength(1000, { message: '评论内容最多1000个字符' })
  content: string;

  @IsMongoId({ message: '父评论ID格式不正确' })
  @IsOptional()
  parentId?: string;

  @IsMongoId({ message: '回复用户ID格式不正确' })
  @IsOptional()
  replyTo?: string;
}
