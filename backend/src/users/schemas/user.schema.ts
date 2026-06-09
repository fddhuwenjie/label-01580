import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

const transformFn = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = (ret._id as string).toString();
  delete ret._id;
  delete ret.__v;
  delete ret.password;
  return ret;
};

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform: transformFn },
  toObject: { virtuals: true, transform: transformFn },
})
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: '' })
  bio: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
