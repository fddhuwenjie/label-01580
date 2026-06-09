import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  User,
  Comment,
  CreateCommentRequest,
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

  // Comments
  /**
   * 获取指定文章下的全部评论（按创建时间正序）。
   */
  async getComments(postId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/posts/${postId}/comments`);
  }

  /**
   * 在指定文章下创建评论或回复。
   */
  async createComment(postId: string, data: CreateCommentRequest): Promise<Comment> {
    return this.request<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 删除一条评论（仅作者本人可调用）。
   */
  async deleteComment(commentId: string): Promise<void> {
    await this.request<void>(`/comments/${commentId}`, { method: 'DELETE' });
  }

  // Likes
  /**
   * 获取文章点赞状态及总点赞数。
   */
  async getLikeStatus(postId: string): Promise<LikeStatus> {
    return this.request<LikeStatus>(`/posts/${postId}/like`);
  }

  /**
   * 点赞文章（幂等）。
   */
  async likePost(postId: string): Promise<LikeStatus> {
    return this.request<LikeStatus>(`/posts/${postId}/like`, { method: 'POST' });
  }

  /**
   * 取消点赞（幂等）。
   */
  async unlikePost(postId: string): Promise<LikeStatus> {
    return this.request<LikeStatus>(`/posts/${postId}/like`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
