export interface User {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export interface Post {
  id: string;
  _id?: string;
  title: string;
  content: string;
  summary?: string;
  author: User;
  published: boolean;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  _id?: string;
  postId: string;
  author: User;
  content: string;
  parentId: string | null;
  replyTo: User | null;
  createdAt: string;
  updatedAt: string;
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

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
  replyTo?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  timestamp: string;
}
