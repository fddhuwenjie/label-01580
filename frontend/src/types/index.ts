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
  commentCount?: number;
  likeCount?: number;
  createdAt: string;
  updatedAt: string;
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

export interface Comment {
  _id: string;
  content: string;
  post: string;
  author: User;
  parentComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

export interface PostWithStats extends Post {
  commentCount: number;
  likeCount: number;
}
