import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

const transformFn = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = (ret._id as string).toString();
  delete ret._id;
  delete ret.__v;
  if (ret.postId) ret.postId = (ret.postId as Types.ObjectId).toString();
  if (ret.parentId) ret.parentId = (ret.parentId as Types.ObjectId).toString();
  return ret;
};

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform: transformFn },
  toObject: { virtuals: true, transform: transformFn },
})
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
  parentId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  replyTo: Types.ObjectId | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
