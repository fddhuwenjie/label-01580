import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommentsService } from '../comments/comments.service';
import { LikesService } from '../likes/likes.service';

export interface PostWithStats extends PostDocument {
  commentCount: number;
  likeCount: number;
  isLiked?: boolean;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  /**
   * 创建新文章
   * @param createPostDto 文章创建数据
   * @param authorId 作者ID
   * @returns 创建的文章文档
   */
  async create(createPostDto: CreatePostDto, authorId: string): Promise<PostDocument> {
    const post = new this.postModel({
      ...createPostDto,
      author: new Types.ObjectId(authorId),
    });
    return post.save();
  }

  /**
   * 查询文章列表，附带评论数和点赞数
   * @param onlyPublished 是否只查询已发布文章
   * @param userId 当前用户ID（可选，用于查询点赞状态）
   * @returns 文章列表（包含统计信息）
   */
  async findAll(onlyPublished = true, userId?: string): Promise<PostWithStats[]> {
    const query = onlyPublished ? { published: true } : {};
    const posts = await this.postModel
      .find(query)
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 })
      .exec();

    return this.enrichPostsWithStats(posts, userId);
  }

  /**
   * 查询指定用户的文章列表，附带统计信息
   * @param authorId 作者ID
   * @param userId 当前用户ID（可选）
   * @returns 文章列表
   */
  async findByAuthor(authorId: string, userId?: string): Promise<PostWithStats[]> {
    const posts = await this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 })
      .exec();

    return this.enrichPostsWithStats(posts, userId);
  }

  /**
   * 查询单篇文章详情，附带评论数、点赞数和当前用户点赞状态
   * @param id 文章ID
   * @param userId 当前用户ID（可选）
   * @returns 文章（含统计信息）
   */
  async findOne(id: string, userId?: string): Promise<PostWithStats> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username email avatar')
      .exec();

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const [commentCount, likeCount, isLiked] = await Promise.all([
      this.commentsService.countByPostId(id),
      this.likesService.countByPostId(id),
      userId ? this.likesService.isLikedByUser(id, userId) : Promise.resolve(false),
    ]);

    const enriched = post.toObject() as unknown as PostWithStats;
    enriched.commentCount = commentCount;
    enriched.likeCount = likeCount;
    enriched.isLiked = isLiked;
    return enriched;
  }

  /**
   * 更新文章（仅作者可修改）
   * @param id 文章ID
   * @param updatePostDto 更新数据
   * @param userId 当前用户ID
   * @returns 更新后的文章
   */
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

  /**
   * 删除文章（仅作者可删除）
   * @param id 文章ID
   * @param userId 当前用户ID
   */
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

  /**
   * 增加文章浏览量
   * @param id 文章ID
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.postModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();
  }

  /**
   * 批量为文章列表添加评论数、点赞数和点赞状态
   * @param posts 文章文档数组
   * @param userId 当前用户ID（可选）
   * @returns 带统计信息的文章数组
   */
  private async enrichPostsWithStats(
    posts: PostDocument[],
    userId?: string,
  ): Promise<PostWithStats[]> {
    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p._id.toString());

    const [commentCounts, likeCounts, likedMap] = await Promise.all([
      this.commentsService.countByPostIds(postIds),
      this.likesService.countByPostIds(postIds),
      userId
        ? this.likesService.isLikedByUserForPosts(postIds, userId)
        : Promise.resolve(new Map<string, boolean>()),
    ]);

    return posts.map((post) => {
      const id = post._id.toString();
      const enriched = post.toObject() as unknown as PostWithStats;
      enriched.commentCount = commentCounts.get(id) || 0;
      enriched.likeCount = likeCounts.get(id) || 0;
      enriched.isLiked = likedMap.get(id) || false;
      return enriched;
    });
  }
}
