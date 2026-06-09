import {
  Controller,
  Post,
  Param,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { ToggleResult } from './likes.service';

@Controller('posts/:postId/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * 切换文章点赞状态（需要登录，幂等接口）
   * - 重复调用此接口可在点赞/取消点赞之间切换
   * - 不会产生重复点赞记录
   * @param postId 文章ID
   * @param req 请求对象，包含当前登录用户信息
   * @returns 当前点赞状态和点赞总数
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  toggle(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ): Promise<ToggleResult> {
    return this.likesService.toggle(postId, req.user.userId);
  }

  /**
   * 获取指定文章的点赞状态（当前用户是否已点赞）和点赞数
   * 需要登录以获取个人点赞状态
   * @param postId 文章ID
   * @param req 请求对象，包含当前登录用户信息
   */
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ) {
    const [liked, likeCount] = await Promise.all([
      this.likesService.isLikedByUser(postId, req.user.userId),
      this.likesService.countByPostId(postId),
    ]);
    return { liked, likeCount };
  }
}
