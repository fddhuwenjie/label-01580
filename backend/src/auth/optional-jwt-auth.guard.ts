import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 可选 JWT 认证守卫。
 *
 * 若请求携带有效 token，会将解析后的用户挂载到 `req.user`；
 * 若未携带或 token 无效，则放行但 `req.user` 为 undefined，
 * 不会抛出 401。常用于点赞状态、文章列表等"登录可见更多信息"的接口。
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 始终允许通过；只在 token 有效时填充 user。
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // 忽略未授权错误，按未登录处理
    }
    return true;
  }

  /**
   * 重写 handleRequest：即使无 user 也不抛错。
   */
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user as TUser;
  }
}
