import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 为指定文章创建评论，需要登录认证。
   * @param postId - 文章ID
   * @param createCommentDto - 创建评论的数据
   * @param req - 请求对象，包含当前登录用户信息
   * @returns 创建的评论
   */
  @UseGuards(JwtAuthGuard)
  @Post('post/:postId')
  create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.create(createCommentDto, postId, req.user.userId);
  }

  /**
   * 获取指定文章的所有评论，公开接口无需认证。
   * @param postId - 文章ID
   * @returns 该文章的评论列表
   */
  @Get('post/:postId')
  findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  /**
   * 删除指定评论，需要登录认证且仅评论作者可删除。
   * @param id - 评论ID
   * @param req - 请求对象，包含当前登录用户信息
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.remove(id, req.user.userId);
  }
}
