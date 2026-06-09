import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 获取指定文章的全部评论（按创建时间正序）。
   */
  @Get('posts/:postId/comments')
  findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  /**
   * 在指定文章下创建一条评论或回复（需要登录）。
   */
  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  create(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.create(postId, req.user.userId, dto);
  }

  /**
   * 删除一条评论（仅作者本人）。
   */
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.remove(id, req.user.userId);
  }
}
