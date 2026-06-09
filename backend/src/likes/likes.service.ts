import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
  ) {}

  /**
   * 对文章进行点赞。
   *
   * 通过 `findOneAndUpdate` + `upsert: true` 实现幂等：无论调用多少次，
   * 同一 (post, user) 仅会产生一条点赞记录。
   * @param postId 文章 ID
   * @param userId 用户 ID
   * @returns 当前点赞状态及该文章的最新点赞总数
   */
  async like(postId: string, userId: string): Promise<{ liked: true; likeCount: number }> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('文章 ID 无效');
    }

    const post = new Types.ObjectId(postId);
    const user = new Types.ObjectId(userId);

    await this.likeModel
      .findOneAndUpdate(
        { post, user },
        { $setOnInsert: { post, user } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    const likeCount = await this.likeModel.countDocuments({ post }).exec();
    return { liked: true, likeCount };
  }

  /**
   * 取消点赞。
   *
   * 删除操作天然幂等：若不存在记录，删除结果为 0 行同样视为成功。
   * @param postId 文章 ID
   * @param userId 用户 ID
   * @returns 当前点赞状态及该文章的最新点赞总数
   */
  async unlike(
    postId: string,
    userId: string,
  ): Promise<{ liked: false; likeCount: number }> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('文章 ID 无效');
    }

    const post = new Types.ObjectId(postId);
    const user = new Types.ObjectId(userId);

    await this.likeModel.deleteOne({ post, user }).exec();
    const likeCount = await this.likeModel.countDocuments({ post }).exec();
    return { liked: false, likeCount };
  }

  /**
   * 查询指定用户对某文章的点赞状态及该文章的点赞总数。
   * @param postId 文章 ID
   * @param userId 用户 ID（可选，未登录时传 undefined）
   * @returns liked: 当前用户是否点赞；likeCount: 文章总点赞数
   */
  async getStatus(
    postId: string,
    userId?: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('文章 ID 无效');
    }
    const post = new Types.ObjectId(postId);

    const [likeCount, liked] = await Promise.all([
      this.likeModel.countDocuments({ post }).exec(),
      userId && Types.ObjectId.isValid(userId)
        ? this.likeModel
            .exists({ post, user: new Types.ObjectId(userId) })
            .then((doc) => !!doc)
        : Promise.resolve(false),
    ]);

    return { liked, likeCount };
  }

  /**
   * 统计指定文章的点赞数。
   * @param postId 文章 ID
   * @returns 点赞数
   */
  async countByPost(postId: string): Promise<number> {
    if (!Types.ObjectId.isValid(postId)) return 0;
    return this.likeModel
      .countDocuments({ post: new Types.ObjectId(postId) })
      .exec();
  }

  /**
   * 批量统计多篇文章的点赞数。
   * @param postIds 文章 ID 列表
   * @returns 以文章 ID 为键、点赞数为值的映射对象
   */
  async countByPosts(postIds: string[]): Promise<Record<string, number>> {
    const objectIds = postIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return {};

    const rows = await this.likeModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { post: { $in: objectIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row._id.toString()] = row.count;
    }
    return result;
  }

  /**
   * 查询当前用户已点赞的文章 ID 集合（用于列表页批量回填 liked 状态）。
   * @param userId 用户 ID
   * @param postIds 候选文章 ID 列表
   * @returns 已点赞文章 ID 的 Set
   */
  async getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
    if (!Types.ObjectId.isValid(userId)) return new Set();
    const objectIds = postIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return new Set();

    const rows = await this.likeModel
      .find({ user: new Types.ObjectId(userId), post: { $in: objectIds } }, { post: 1 })
      .lean()
      .exec();
    return new Set(rows.map((r) => r.post.toString()));
  }
}
