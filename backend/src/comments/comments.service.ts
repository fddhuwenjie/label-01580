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
   * 创建评论。如果提供了 parentComment，则为回复评论。
   * @param createCommentDto - 创建评论的数据传输对象
   * @param postId - 文章ID
   * @param userId - 评论者用户ID
   * @returns 创建的评论文档
   */
  async create(
    createCommentDto: CreateCommentDto,
    postId: string,
    userId: string,
  ): Promise<CommentDocument> {
    const comment = new this.commentModel({
      content: createCommentDto.content,
      post: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
      parentComment: createCommentDto.parentComment
        ? new Types.ObjectId(createCommentDto.parentComment)
        : null,
    });
    return comment.save();
  }

  /**
   * 查找指定文章的所有评论，按创建时间升序排列，并填充作者信息。
   * @param postId - 文章ID
   * @returns 该文章的评论列表
   */
  async findByPost(postId: string): Promise<CommentDocument[]> {
    return this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * 统计指定文章的评论数量。
   * @param postId - 文章ID
   * @returns 评论数量
   */
  async countByPost(postId: string): Promise<number> {
    return this.commentModel
      .countDocuments({ post: new Types.ObjectId(postId) })
      .exec();
  }

  /**
   * 删除评论，仅评论作者可以删除自己的评论。
   * @param id - 评论ID
   * @param userId - 当前用户ID
   */
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(id).exec();

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.commentModel.findByIdAndDelete(id).exec();
  }
}
