import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommentsService } from '../comments/comments.service';
import { LikesService } from '../likes/likes.service';

export interface PostWithStats extends PostDocument {
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private commentsService: CommentsService,
    private likesService: LikesService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<PostDocument> {
    const post = new this.postModel({
      ...createPostDto,
      author: new Types.ObjectId(authorId),
    });
    return post.save();
  }

  /**
   * 获取所有文章列表（包含点赞数和评论数）
   * @param onlyPublished 是否只获取已发布的文章
   * @param userId 用户ID（用于检查点赞状态）
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
   * 获取作者的所有文章（包含点赞数和评论数）
   * @param authorId 作者ID
   * @param userId 用户ID（用于检查点赞状态）
   * @returns 文章列表（包含统计信息）
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
   * 获取单篇文章详情（包含点赞数和评论数）
   * @param id 文章ID
   * @param userId 用户ID（用于检查点赞状态）
   * @returns 文章详情（包含统计信息）
   */
  async findOne(id: string, userId?: string): Promise<PostWithStats> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username email avatar')
      .exec();

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const enriched = await this.enrichPostsWithStats([post], userId);
    return enriched[0];
  }

  /**
   * 为文章列表添加统计信息（点赞数、评论数、点赞状态）
   * @param posts 文章列表
   * @param userId 用户ID（用于检查点赞状态）
   * @returns 带有统计信息的文章列表
   */
  private async enrichPostsWithStats(
    posts: PostDocument[],
    userId?: string,
  ): Promise<PostWithStats[]> {
    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((post) => post._id.toString());

    const [likeCountMap, commentCountMap] = await Promise.all([
      this.likesService.countByPostIds(postIds),
      this.commentsService.countByPostIds(postIds),
    ]);

    let likedMap: Map<string, boolean> | null = null;
    if (userId) {
      likedMap = await this.likesService.hasLikedPosts(postIds, userId);
    }

    return posts.map((post) => {
      const postId = post._id.toString();
      const postWithStats = post.toObject() as PostWithStats;
      postWithStats.likeCount = likeCountMap.get(postId) || 0;
      postWithStats.commentCount = commentCountMap.get(postId) || 0;
      if (likedMap) {
        postWithStats.isLiked = likedMap.get(postId) || false;
      }
      return postWithStats;
    });
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
}
