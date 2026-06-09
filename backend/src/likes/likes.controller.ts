import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * 切换指定文章的点赞状态，需要登录认证。
   * @param postId - 文章ID
   * @param req - 请求对象，包含当前登录用户信息
   * @returns 包含 liked 布尔值的对象
   */
  @UseGuards(JwtAuthGuard)
  @Post('post/:postId')
  toggle(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.likesService.toggle(postId, req.user.userId);
  }

  /**
   * 获取指定文章的点赞数量，公开接口无需认证。
   * @param postId - 文章ID
   * @returns 包含 count 数值的对象
   */
  @Get('post/:postId')
  async countByPost(@Param('postId') postId: string) {
    const count = await this.likesService.countByPost(postId);
    return { count };
  }

  /**
   * 检查当前用户是否已对指定文章点赞，并返回点赞数，需要登录认证。
   * @param postId - 文章ID
   * @param req - 请求对象，包含当前登录用户信息
   * @returns 包含 liked 布尔值和 likeCount 数值的对象
   */
  @UseGuards(JwtAuthGuard)
  @Get('post/:postId/status')
  async isLiked(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ) {
    const [liked, likeCount] = await Promise.all([
      this.likesService.isLiked(postId, req.user.userId),
      this.likesService.countByPost(postId),
    ]);
    return { liked, likeCount };
  }
}
