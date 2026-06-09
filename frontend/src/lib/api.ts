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
   * 获取指定文章的评论列表
   * @param postId 文章ID
   * @returns 评论列表（按时间正序）
   */
  async getComments(postId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/posts/${postId}/comments`);
  }

  /**
   * 对文章发表评论或回复
   * @param postId 文章ID
   * @param data 评论数据（支持楼中楼回复）
   * @returns 创建的评论
   */
  async createComment(postId: string, data: CreateCommentRequest): Promise<Comment> {
    return this.request<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 删除评论
   * @param postId 文章ID
   * @param commentId 评论ID
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    await this.request<void>(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Likes
  /**
   * 切换点赞状态（幂等接口：点赞/取消点赞）
   * @param postId 文章ID
   * @returns 点赞后的状态（是否已点赞和点赞总数）
   */
  async toggleLike(postId: string): Promise<LikeStatus> {
    return this.request<LikeStatus>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  /**
   * 获取指定文章的点赞状态和数量
   * @param postId 文章ID
   * @returns 点赞状态和总数
   */
  async getLikeStatus(postId: string): Promise<LikeStatus> {
    return this.request<LikeStatus>(`/posts/${postId}/like/status`);
  }
}

export const api = new ApiClient();
