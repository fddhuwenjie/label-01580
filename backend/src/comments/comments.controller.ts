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
   * 对指定文章发表评论（需要登录）
   * @param postId 文章ID（URL参数）
   * @param createCommentDto 评论数据
   * @param req 请求对象，包含当前登录用户信息
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
   * 获取指定文章的所有评论（公开接口）
   * @param postId 文章ID
   * @returns 评论列表
   */
  @Get()
  findByPostId(@Param('postId') postId: string) {
    return this.commentsService.findByPostId(postId);
  }

  /**
   * 删除指定评论（仅作者可删除，需要登录）
   * @param postId 文章ID（URL参数）
   * @param commentId 评论ID
   * @param req 请求对象，包含当前登录用户信息
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  remove(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.remove(commentId, req.user.userId);
  }
}
