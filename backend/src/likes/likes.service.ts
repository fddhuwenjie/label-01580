import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  /**
   * 切换点赞状态（幂等操作）。使用 findOneAndUpdate + upsert 实现幂等性。
   * 如果用户已点赞则取消点赞，如果未点赞则添加点赞。
   * @param postId - 文章ID
   * @param userId - 用户ID
   * @returns 包含 liked 布尔值的对象，表示当前点赞状态
   */
  async toggle(postId: string, userId: string): Promise<{ liked: boolean }> {
    const existing = await this.likeModel
      .findOneAndUpdate(
        { post: new Types.ObjectId(postId), user: new Types.ObjectId(userId) },
        { $setOnInsert: { post: new Types.ObjectId(postId), user: new Types.ObjectId(userId) } },
        { upsert: true, new: false },
      )
      .exec();

    if (existing) {
      await this.likeModel
        .deleteOne({ _id: existing._id })
        .exec();
      return { liked: false };
    }

    return { liked: true };
  }

  /**
   * 检查用户是否已对指定文章点赞。
   * @param postId - 文章ID
   * @param userId - 用户ID
   * @returns 是否已点赞
   */
  async isLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeModel
      .findOne({
        post: new Types.ObjectId(postId),
        user: new Types.ObjectId(userId),
      })
      .exec();
    return !!like;
  }

  /**
   * 统计指定文章的点赞数量。
   * @param postId - 文章ID
   * @returns 点赞数量
   */
  async countByPost(postId: string): Promise<number> {
    return this.likeModel
      .countDocuments({ post: new Types.ObjectId(postId) })
      .exec();
  }
}
