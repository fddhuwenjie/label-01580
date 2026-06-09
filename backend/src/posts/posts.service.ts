import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommentsService } from '../comments/comments.service';
import { LikesService } from '../likes/likes.service';

/**
 * 文章在响应中附带的统计信息及当前用户点赞状态。
 */
export interface PostWithStats {
  _id: string;
  title: string;
  content: string;
  summary: string;
  author: unknown;
  published: boolean;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  liked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  /**
   * 创建文章。
   * @param createPostDto 文章字段
   * @param authorId 作者用户 ID
   * @returns 新创建的文章文档
   */
  async create(createPostDto: CreatePostDto, authorId: string): Promise<PostDocument> {
    const post = new this.postModel({
      ...createPostDto,
      author: new Types.ObjectId(authorId),
    });
    return post.save();
  }

  /**
   * 查询文章列表，并附带评论数 / 点赞数 / 当前用户是否点赞。
   * @param onlyPublished 是否仅返回已发布的文章
   * @param currentUserId 当前用户 ID（可选，用于回填 liked 状态）
   */
  async findAll(
    onlyPublished = true,
    currentUserId?: string,
  ): Promise<PostWithStats[]> {
    const query = onlyPublished ? { published: true } : {};
    const posts = await this.postModel
      .find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .exec();
    return this.attachStats(posts, currentUserId);
  }

  /**
   * 查询指定作者的全部文章（含统计字段）。
   * @param authorId 作者 ID
   * @param currentUserId 当前用户 ID（可选）
   */
  async findByAuthor(
    authorId: string,
    currentUserId?: string,
  ): Promise<PostWithStats[]> {
    const posts = await this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .exec();
    return this.attachStats(posts, currentUserId);
  }

  /**
   * 查询单篇文章详情（含统计字段）。
   * @param id 文章 ID
   * @param currentUserId 当前用户 ID（可选）
   */
  async findOne(id: string, currentUserId?: string): Promise<PostWithStats> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username avatar')
      .exec();

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const [commentCount, { liked, likeCount }] = await Promise.all([
      this.commentsService.countByPost(id),
      this.likesService.getStatus(id, currentUserId),
    ]);

    return this.toPostWithStats(post, commentCount, likeCount, liked);
  }

  /**
   * 更新文章。仅作者本人可执行。
   * @param id 文章 ID
   * @param updatePostDto 更新字段
   * @param userId 当前用户 ID
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
      .populate('author', 'username avatar')
      .exec();

    return updatedPost!;
  }

  /**
   * 删除文章。仅作者本人可执行。
   * @param id 文章 ID
   * @param userId 当前用户 ID
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
   * 文章浏览数 +1。
   * @param id 文章 ID
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.postModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();
  }

  /**
   * 给一组文章批量附加 commentCount / likeCount / liked 字段。
   */
  private async attachStats(
    posts: PostDocument[],
    currentUserId?: string,
  ): Promise<PostWithStats[]> {
    if (posts.length === 0) return [];
    const ids = posts.map((p) => (p._id as Types.ObjectId).toString());

    const [commentCounts, likeCounts, likedSet] = await Promise.all([
      this.commentsService.countByPosts(ids),
      this.likesService.countByPosts(ids),
      currentUserId
        ? this.likesService.getLikedPostIds(currentUserId, ids)
        : Promise.resolve(new Set<string>()),
    ]);

    return posts.map((p) => {
      const id = (p._id as Types.ObjectId).toString();
      return this.toPostWithStats(
        p,
        commentCounts[id] || 0,
        likeCounts[id] || 0,
        likedSet.has(id),
      );
    });
  }

  /**
   * 将 PostDocument 转换为带统计信息的明文对象。
   */
  private toPostWithStats(
    post: PostDocument,
    commentCount: number,
    likeCount: number,
    liked: boolean,
  ): PostWithStats {
    const obj = post.toObject({ versionKey: false });
    return {
      ...(obj as Omit<PostWithStats, 'commentCount' | 'likeCount' | 'liked'>),
      commentCount,
      likeCount,
      liked,
    };
  }
}
