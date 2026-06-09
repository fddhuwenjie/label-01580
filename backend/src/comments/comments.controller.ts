import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 创建评论
   * @param postId 文章ID
   * @param createCommentDto 评论数据
   * @param req 请求对象
   * @returns 创建的评论
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.create(createCommentDto, postId, req.user.userId);
  }

  /**
   * 获取文章的所有评论
   * @param postId 文章ID
   * @returns 评论列表
   */
  @Get()
  findAll(@Param('postId') postId: string) {
    return this.commentsService.findByPostId(postId);
  }

  /**
   * 删除评论
   * @param postId 文章ID
   * @param id 评论ID
   * @param req 请求对象
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('postId') postId: string,
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.remove(id, req.user.userId);
  }
}
