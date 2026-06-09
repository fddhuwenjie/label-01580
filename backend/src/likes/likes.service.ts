import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';

export interface ToggleResult {
  liked: boolean;
  likeCount: number;
}

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  /**
   * 切换点赞状态（幂等操作）
   * 使用 findOneAndUpdate + upsert 保证幂等性：
   * - 若已存在点赞记录，则删除（取消点赞）
   * - 若不存在，则创建（点赞）
   * 整个操作是原子的，并发请求不会导致重复数据
   * @param postId 文章ID
   * @param userId 用户ID
   * @returns 包含当前是否已点赞和点赞总数的对象
   */
  async toggle(postId: string, userId: string): Promise<ToggleResult> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const existingLike = await this.likeModel.findOneAndDelete({
      postId: postObjectId,
      userId: userObjectId,
    });

    if (existingLike) {
      const likeCount = await this.likeModel
        .countDocuments({ postId: postObjectId })
        .exec();
      return { liked: false, likeCount };
    }

    await this.likeModel.findOneAndUpdate(
      { postId: postObjectId, userId: userObjectId },
      { $setOnInsert: { postId: postObjectId, userId: userObjectId } },
      { upsert: true, new: true },
    );

    const likeCount = await this.likeModel
      .countDocuments({ postId: postObjectId })
      .exec();
    return { liked: true, likeCount };
  }

  /**
   * 获取指定文章的点赞总数
   * @param postId 文章ID
   * @returns 点赞数量
   */
  async countByPostId(postId: string): Promise<number> {
    return this.likeModel
      .countDocuments({ postId: new Types.ObjectId(postId) })
      .exec();
  }

  /**
   * 批量获取多篇文章的点赞数
   * @param postIds 文章ID数组
   * @returns 文章ID到点赞数的映射
   */
  async countByPostIds(postIds: string[]): Promise<Map<string, number>> {
    const objectIds = postIds.map((id) => new Types.ObjectId(id));
    const results = await this.likeModel.aggregate([
      { $match: { postId: { $in: objectIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const r of results) {
      countMap.set(r._id.toString(), r.count);
    }
    return countMap;
  }

  /**
   * 检查当前用户是否已点赞指定文章
   * @param postId 文章ID
   * @param userId 用户ID
   * @returns 是否已点赞
   */
  async isLikedByUser(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeModel
      .findOne({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return !!like;
  }

  /**
   * 批量检查当前用户对多篇文章的点赞状态
   * @param postIds 文章ID数组
   * @param userId 用户ID
   * @returns 文章ID到点赞状态的映射
   */
  async isLikedByUserForPosts(
    postIds: string[],
    userId: string,
  ): Promise<Map<string, boolean>> {
    const objectIds = postIds.map((id) => new Types.ObjectId(id));
    const likes = await this.likeModel
      .find({
        postId: { $in: objectIds },
        userId: new Types.ObjectId(userId),
      })
      .exec();

    const likedMap = new Map<string, boolean>();
    for (const like of likes) {
      likedMap.set(like.postId.toString(), true);
    }
    return likedMap;
  }
}
