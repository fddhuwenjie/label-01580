import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

const transformFn = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = (ret._id as string).toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform: transformFn },
  toObject: { virtuals: true, transform: transformFn },
})
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ default: false })
  published: boolean;

  @Prop({ default: 0 })
  viewCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
