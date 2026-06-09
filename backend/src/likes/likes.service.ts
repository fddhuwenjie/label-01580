import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

@Injectable()
export class LikesService {
  constructor(@InjectModel(Like.name) private likeModel: Model<LikeDocument>) {}

  /**
   * 切换点赞状态（点赞/取消点赞）
   * 点赞操作使用 findOneAndUpdate + upsert 保证幂等性，
   * 即使并发请求也不会重复创建点赞记录
   * @param postId 文章ID
   * @param userId 用户ID
   * @returns 点赞状态和点赞数
   */
  async toggleLike(postId: string, userId: string): Promise<LikeResult> {
    const existingLike = await this.likeModel.findOne({
      postId,
      userId,
    }).exec();

    if (existingLike) {
      await this.likeModel.findByIdAndDelete(existingLike._id).exec();
      const likeCount = await this.countByPostId(postId);
      return { liked: false, likeCount };
    } else {
      await this.likeModel.findOneAndUpdate(
        { postId, userId },
        { $setOnInsert: { postId, userId } },
        { upsert: true, returnDocument: 'after' },
      ).exec();
      const likeCount = await this.countByPostId(postId);
      return { liked: true, likeCount };
    }
  }

  /**
   * 检查用户是否已点赞文章
   * @param postId 文章ID
   * @param userId 用户ID
   * @returns 是否已点赞
   */
  async hasLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeModel.findOne({
      postId,
      userId,
    }).exec();
    return !!like;
  }

  /**
   * 获取文章点赞数
   * @param postId 文章ID
   * @returns 点赞数
   */
  async countByPostId(postId: string): Promise<number> {
    return this.likeModel.countDocuments({ postId }).exec();
  }

  /**
   * 批量获取文章点赞数
   * @param postIds 文章ID列表
   * @returns 文章ID到点赞数的映射
   */
  async countByPostIds(postIds: string[]): Promise<Map<string, number>> {
    const result = await this.likeModel.aggregate([
      {
        $match: {
          postId: { $in: postIds.map((id) => new Types.ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: '$postId',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map<string, number>();
    postIds.forEach((id) => countMap.set(id, 0));
    result.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    return countMap;
  }

  /**
   * 批量检查用户是否已点赞多篇文章
   * @param postIds 文章ID列表
   * @param userId 用户ID
   * @returns 文章ID到点赞状态的映射
   */
  async hasLikedPosts(postIds: string[], userId: string): Promise<Map<string, boolean>> {
    const likes = await this.likeModel.find({
      postId: { $in: postIds },
      userId,
    }).exec();

    const likedMap = new Map<string, boolean>();
    postIds.forEach((id) => likedMap.set(id, false));
    likes.forEach((like) => {
      likedMap.set(like.postId.toString(), true);
    });

    return likedMap;
  }
}
