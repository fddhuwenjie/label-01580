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

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.create(createPostDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('all') all?: string,
    @Request() req?: { user?: { userId: string } },
  ) {
    const onlyPublished = all !== 'true';
    const userId = req?.user?.userId;
    return this.postsService.findAll(onlyPublished, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyPosts(@Request() req: { user: { userId: string } }) {
    return this.postsService.findByAuthor(req.user.userId, req.user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req?: { user?: { userId: string } },
  ) {
    const userId = req?.user?.userId;
    const post = await this.postsService.findOne(id, userId);
    // Increment view count
    await this.postsService.incrementViewCount(id);
    return post;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.update(id, updatePostDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.remove(id, req.user.userId);
  }
}
