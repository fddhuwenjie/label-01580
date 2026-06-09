import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

/**
 * 文章评论 Schema。
 *
 * 支持楼中楼回复：当 parent 为 null 时表示一级评论，
 * 否则表示对另一条评论的回复。
 */
@Schema({ timestamps: true })
export class Comment {
  /** 评论所属文章 */
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  post: Types.ObjectId;

  /** 评论作者 */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  /** 评论内容 */
  @Prop({ required: true, trim: true, maxlength: 1000 })
  content: string;

  /** 父评论。null 表示一级评论；否则为被回复的评论 ID */
  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
  parent: Types.ObjectId | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
