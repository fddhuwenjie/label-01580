import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  /**
   * 创建新评论或回复
   * @param createCommentDto 评论创建数据传输对象
   * @param postId 文章ID
   * @param authorId 评论作者ID
   * @returns 创建的评论文档
   */
  async create(
    createCommentDto: CreateCommentDto,
    postId: string,
    authorId: string,
  ): Promise<CommentDocument> {
    const commentData: Record<string, unknown> = {
      postId: new Types.ObjectId(postId),
      author: new Types.ObjectId(authorId),
      content: createCommentDto.content,
      parentId: null,
      replyTo: null,
    };

    if (createCommentDto.parentId) {
      const parentComment = await this.commentModel
        .findById(createCommentDto.parentId)
        .exec();

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      if (parentComment.postId.toString() !== postId) {
        throw new ForbiddenException('父评论不属于该文章');
      }

      commentData.parentId = new Types.ObjectId(createCommentDto.parentId);
      commentData.replyTo = createCommentDto.replyTo
        ? new Types.ObjectId(createCommentDto.replyTo)
        : parentComment.author;
    }

    const comment = new this.commentModel(commentData);
    return comment.save();
  }

  /**
   * 获取指定文章的所有评论，按时间正序排列，并包含作者和回复用户信息
   * @param postId 文章ID
   * @returns 评论列表（包含populate后的用户信息）
   */
  async findByPostId(postId: string): Promise<CommentDocument[]> {
    return this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('author', 'username avatar')
      .populate('replyTo', 'username avatar')
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * 获取指定文章的评论总数
   * @param postId 文章ID
   * @returns 评论数量
   */
  async countByPostId(postId: string): Promise<number> {
    return this.commentModel
      .countDocuments({ postId: new Types.ObjectId(postId) })
      .exec();
  }

  /**
   * 批量获取多篇文章的评论数
   * @param postIds 文章ID数组
   * @returns 文章ID到评论数的映射
   */
  async countByPostIds(postIds: string[]): Promise<Map<string, number>> {
    const objectIds = postIds.map((id) => new Types.ObjectId(id));
    const results = await this.commentModel.aggregate([
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
   * 删除评论（仅作者本人可删除）
   * @param commentId 评论ID
   * @param userId 当前用户ID
   */
  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.commentModel.findByIdAndDelete(commentId).exec();
  }
}
