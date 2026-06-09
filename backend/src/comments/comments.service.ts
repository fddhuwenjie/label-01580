import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
  ) {}

  /**
   * 在指定文章下创建一条评论。
   * @param postId 文章 ID
   * @param authorId 评论者用户 ID
   * @param dto 评论内容及可选的父评论 ID
   * @returns 创建后的评论文档（已 populate 作者基本信息）
   */
  async create(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('文章 ID 无效');
    }

    let parentId: Types.ObjectId | null = null;
    if (dto.parent) {
      const parent = await this.commentModel.findById(dto.parent).exec();
      if (!parent) {
        throw new NotFoundException('父评论不存在');
      }
      if (parent.post.toString() !== postId) {
        throw new BadRequestException('父评论不属于该文章');
      }
      parentId = parent._id as Types.ObjectId;
    }

    const created = await this.commentModel.create({
      post: new Types.ObjectId(postId),
      author: new Types.ObjectId(authorId),
      content: dto.content,
      parent: parentId,
    });

    return created.populate('author', 'username avatar');
  }

  /**
   * 查询指定文章下的所有评论，按创建时间正序返回。
   * 前端可基于 parent 字段自行构建楼中楼结构。
   * @param postId 文章 ID
   * @returns 该文章的全部评论列表（含作者基本信息）
   */
  async findByPost(postId: string): Promise<CommentDocument[]> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('文章 ID 无效');
    }
    return this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * 统计指定文章的评论总数。
   * @param postId 文章 ID
   * @returns 评论数量
   */
  async countByPost(postId: string): Promise<number> {
    if (!Types.ObjectId.isValid(postId)) {
      return 0;
    }
    return this.commentModel.countDocuments({ post: new Types.ObjectId(postId) }).exec();
  }

  /**
   * 批量统计多篇文章的评论数。
   * @param postIds 文章 ID 列表
   * @returns 以文章 ID 为键、评论数为值的映射对象
   */
  async countByPosts(postIds: string[]): Promise<Record<string, number>> {
    const objectIds = postIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) return {};

    const rows = await this.commentModel.aggregate<{ _id: Types.ObjectId; count: number }>([
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
   * 删除一条评论。仅评论作者本人可执行。
   * 同时会一并删除以该评论为父的所有回复。
   * @param commentId 评论 ID
   * @param userId 当前操作用户 ID
   */
  async remove(commentId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('评论 ID 无效');
    }
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }
    await this.commentModel.deleteMany({
      $or: [{ _id: comment._id }, { parent: comment._id }],
    });
  }
}
