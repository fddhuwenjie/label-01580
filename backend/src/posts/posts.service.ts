import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Like, LikeDocument } from '../likes/schemas/like.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<PostDocument> {
    const post = new this.postModel({
      ...createPostDto,
      author: new Types.ObjectId(authorId),
    });
    return post.save();
  }

  async findAll(onlyPublished = true): Promise<PostDocument[]> {
    const query = onlyPublished ? { published: true } : {};
    return this.postModel
      .find(query)
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByAuthor(authorId: string): Promise<PostDocument[]> {
    return this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username email avatar')
      .exec();

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.author.toString() !== userId) {
      throw new ForbiddenException('无权修改此文章');
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .populate('author', 'username email avatar')
      .exec();

    return updatedPost!;
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.author.toString() !== userId) {
      throw new ForbiddenException('无权删除此文章');
    }

    await this.postModel.findByIdAndDelete(id).exec();
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.postModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();
  }

  /**
   * 查找所有文章并附带评论数和点赞数统计。
   * @param onlyPublished - 是否只查询已发布的文章，默认为 true
   * @returns 包含 commentCount 和 likeCount 的文章列表
   */
  async findAllWithStats(onlyPublished = true): Promise<any[]> {
    const query = onlyPublished ? { published: true } : {};
    const posts = await this.postModel
      .find(query)
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const postsWithStats = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await this.commentModel
          .countDocuments({ post: post._id })
          .exec();
        const likeCount = await this.likeModel
          .countDocuments({ post: post._id })
          .exec();
        return { ...post, commentCount, likeCount };
      }),
    );

    return postsWithStats;
  }

  /**
   * 查找单篇文章并附带评论数和点赞数统计。
   * @param id - 文章ID
   * @returns 包含 commentCount 和 likeCount 的文章对象
   */
  async findOneWithStats(id: string): Promise<any> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username email avatar')
      .lean()
      .exec();

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const commentCount = await this.commentModel
      .countDocuments({ post: post._id })
      .exec();
    const likeCount = await this.likeModel
      .countDocuments({ post: post._id })
      .exec();

    return { ...post, commentCount, likeCount };
  }

  /**
   * 查找指定作者的所有文章并附带评论数和点赞数统计。
   * @param authorId - 作者用户ID
   * @returns 包含 commentCount 和 likeCount 的文章列表
   */
  async findByAuthorWithStats(authorId: string): Promise<any[]> {
    const posts = await this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const postsWithStats = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await this.commentModel
          .countDocuments({ post: post._id })
          .exec();
        const likeCount = await this.likeModel
          .countDocuments({ post: post._id })
          .exec();
        return { ...post, commentCount, likeCount };
      }),
    );

    return postsWithStats;
  }
}
