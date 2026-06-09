export interface User {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  author: User;
  published: boolean;
  viewCount: number;
  /** 评论总数（含回复） */
  commentCount: number;
  /** 点赞总数 */
  likeCount: number;
  /** 当前登录用户是否已点赞 */
  liked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: User;
  content: string;
  /** 父评论 ID；null 表示一级评论 */
  parent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parent?: string;
}

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  summary?: string;
  published?: boolean;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  summary?: string;
  published?: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  timestamp: string;
}
