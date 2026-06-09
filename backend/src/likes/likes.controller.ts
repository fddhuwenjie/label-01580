import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts/:postId/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * 切换点赞状态（点赞/取消点赞）
   * @param postId 文章ID
   * @param req 请求对象
   * @returns 点赞状态和点赞数
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  toggleLike(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.likesService.toggleLike(postId, req.user.userId);
  }

  /**
   * 获取文章点赞数
   * @param postId 文章ID
   * @returns 点赞数
   */
  @Get('count')
  getLikeCount(@Param('postId') postId: string) {
    return this.likesService.countByPostId(postId).then((count) => ({ count }));
  }

  /**
   * 检查当前用户是否已点赞
   * @param postId 文章ID
   * @param req 请求对象
   * @returns 是否已点赞
   */
  @UseGuards(JwtAuthGuard)
  @Get('status')
  getLikeStatus(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.likesService.hasLiked(postId, req.user.userId).then((liked) => ({ liked }));
  }
}
