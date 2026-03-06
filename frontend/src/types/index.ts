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
