import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: '评论内容不能为空' })
  @MaxLength(1000, { message: '评论最多1000个字符' })
  content: string;

  /** 被回复的评论 ID，可选；不传则为一级评论 */
  @IsOptional()
  @IsMongoId({ message: '父评论 ID 无效' })
  parent?: string;
}
