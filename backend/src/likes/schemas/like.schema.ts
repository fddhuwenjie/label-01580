import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

/**
 * 文章点赞 Schema。
 *
 * 通过 (post, user) 唯一复合索引保证一个用户对同一篇文章
 * 只能存在一条点赞记录，配合 upsert 即可实现幂等点赞。
 */
@Schema({ timestamps: true })
export class Like {
  /** 被点赞的文章 */
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  post: Types.ObjectId;

  /** 点赞的用户 */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// 唯一复合索引：同一用户对同一文章只允许一条点赞记录
LikeSchema.index({ post: 1, user: 1 }, { unique: true });
