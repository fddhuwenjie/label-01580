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
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 创建文章。
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
   * 文章列表。已登录用户会附带 liked 字段。
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(
    @Query('all') all: string | undefined,
    @Request() req: { user?: { userId: string } },
  ) {
    const onlyPublished = all !== 'true';
    return this.postsService.findAll(onlyPublished, req.user?.userId);
  }

  /**
   * 当前用户自己发表的文章。
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyPosts(@Request() req: { user: { userId: string } }) {
    return this.postsService.findByAuthor(req.user.userId, req.user.userId);
  }

  /**
   * 文章详情。已登录用户会附带 liked 字段。
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user?: { userId: string } },
  ) {
    const post = await this.postsService.findOne(id, req.user?.userId);
    // Increment view count
    await this.postsService.incrementViewCount(id);
    return post;
  }

  /**
   * 更新文章（仅作者本人）。
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
   * 删除文章（仅作者本人）。
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
