import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>) {}

  /**
   * 创建评论
   * @param createCommentDto 评论数据
   * @param postId 文章ID
   * @param authorId 作者ID
   * @returns 创建的评论
   */
  async create(
    createCommentDto: CreateCommentDto,
    postId: string,
    authorId: string,
  ): Promise<CommentDocument> {
    const comment = new this.commentModel({
      ...createCommentDto,
      postId: new Types.ObjectId(postId),
      author: new Types.ObjectId(authorId),
      parentId: createCommentDto.parentId ? new Types.ObjectId(createCommentDto.parentId) : null,
      replyTo: createCommentDto.replyTo ? new Types.ObjectId(createCommentDto.replyTo) : null,
    });
    return comment.save();
  }

  /**
   * 获取文章的所有评论（树形结构）
   * @param postId 文章ID
   * @returns 评论列表（按时间正序，回复嵌套）
   */
  async findByPostId(postId: string): Promise<CommentDocument[]> {
    const comments = await this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('author', 'username avatar')
      .populate('replyTo', 'username')
      .sort({ createdAt: 1 })
      .exec();

    return this.buildCommentTree(comments);
  }

  /**
   * 构建评论树形结构
   * @param comments 扁平评论列表
   * @returns 树形结构评论列表
   */
  private buildCommentTree(comments: CommentDocument[]): CommentDocument[] {
    const commentMap = new Map<string, CommentDocument & { replies?: CommentDocument[] }>();
    const rootComments: (CommentDocument & { replies?: CommentDocument[] })[] = [];

    comments.forEach((comment) => {
      const commentWithReplies = comment.toObject() as CommentDocument & { replies?: CommentDocument[] };
      commentWithReplies.replies = [];
      commentMap.set(comment._id.toString(), commentWithReplies);
    });

    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment._id.toString())!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments as unknown as CommentDocument[];
  }

  /**
   * 获取文章评论数量
   * @param postId 文章ID
   * @returns 评论数量
   */
  async countByPostId(postId: string): Promise<number> {
    return this.commentModel.countDocuments({ postId: new Types.ObjectId(postId) }).exec();
  }

  /**
   * 批量获取文章评论数
   * @param postIds 文章ID列表
   * @returns 文章ID到评论数的映射
   */
  async countByPostIds(postIds: string[]): Promise<Map<string, number>> {
    const result = await this.commentModel.aggregate([
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
   * 删除评论
   * @param id 评论ID
   * @param userId 用户ID
   */
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(id).exec();

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.commentModel.deleteMany({ parentId: new Types.ObjectId(id) }).exec();
    await this.commentModel.findByIdAndDelete(id).exec();
  }
}
