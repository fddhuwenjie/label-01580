import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  User,
  Comment,
  LikeStatus,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '请求失败');
    }

    // 处理空响应（如 DELETE 请求）
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text);
  }

  // Auth
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    return this.request<Post[]>('/posts');
  }

  async getMyPosts(): Promise<Post[]> {
    return this.request<Post[]>('/posts/my');
  }

  async getPost(id: string): Promise<Post> {
    return this.request<Post>(`/posts/${id}`);
  }

  async createPost(data: CreatePostRequest): Promise<Post> {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(id: string, data: UpdatePostRequest): Promise<Post> {
    return this.request<Post>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string): Promise<void> {
    await this.request<void>(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async getComments(postId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/comments/post/${postId}`);
  }

  async createComment(postId: string, data: { content: string; parentComment?: string }): Promise<Comment> {
    return this.request<Comment>(`/comments/post/${postId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: string): Promise<void> {
    await this.request<void>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleLike(postId: string): Promise<{ liked: boolean }> {
    return this.request<{ liked: boolean }>(`/likes/post/${postId}`, {
      method: 'POST',
    });
  }

  async getLikeCount(postId: string): Promise<number> {
    const result = await this.request<{ count: number }>(`/likes/post/${postId}`);
    return result.count;
  }

  async getLikeStatus(postId: string): Promise<LikeStatus> {
    return this.request<LikeStatus>(`/likes/post/${postId}/status`);
  }
}

export const api = new ApiClient();
