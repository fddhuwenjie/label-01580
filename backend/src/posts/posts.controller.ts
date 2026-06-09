import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 创建新文章（需要登录）
   * @param createPostDto 文章数据
   * @param req 请求对象，包含当前登录用户信息
   * @returns 创建的文章
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.create(createPostDto, req.user.userId);
  }

  /**
   * 获取文章列表（需要登录，包含评论数、点赞数和当前用户点赞状态）
   * @param all 是否包含未发布文章（仅作兼容保留）
   * @param req 请求对象
   * @returns 文章列表
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('all') all: string | undefined,
    @Request() req: { user: { userId: string } },
  ) {
    const onlyPublished = all !== 'true';
    return this.postsService.findAll(onlyPublished, req.user?.userId);
  }

  /**
   * 获取当前用户的文章列表（需要登录）
   * @param req 请求对象
   * @returns 当前用户的文章列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyPosts(@Request() req: { user: { userId: string } }) {
    return this.postsService.findByAuthor(req.user.userId, req.user.userId);
  }

  /**
   * 获取单篇文章详情（需要登录，包含评论数、点赞数和点赞状态）
   * @param id 文章ID
   * @param req 请求对象
   * @returns 文章详情
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const post = await this.postsService.findOne(id, req.user?.userId);
    await this.postsService.incrementViewCount(id);
    return post;
  }

  /**
   * 更新文章（需要登录，仅作者可操作）
   * @param id 文章ID
   * @param updatePostDto 更新数据
   * @param req 请求对象
   * @returns 更新后的文章
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.update(id, updatePostDto, req.user.userId);
  }

  /**
   * 删除文章（需要登录，仅作者可操作）
   * @param id 文章ID
   * @param req 请求对象
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.remove(id, req.user.userId);
  }
}
