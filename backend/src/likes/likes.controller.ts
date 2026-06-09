import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts/:postId/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * 点赞文章（幂等）。重复调用不会产生重复记录。
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  like(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.likesService.like(postId, req.user.userId);
  }

  /**
   * 取消点赞（幂等）。
   */
  @UseGuards(JwtAuthGuard)
  @Delete()
  unlike(
    @Param('postId') postId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.likesService.unlike(postId, req.user.userId);
  }

  /**
   * 查询当前用户对文章的点赞状态及文章总点赞数。
   * 未登录访问也可获取 likeCount，liked 始终为 false。
   */
  @Get()
  status(
    @Param('postId') postId: string,
    @Request() req: { user?: { userId: string } },
  ) {
    return this.likesService.getStatus(postId, req.user?.userId);
  }
}
