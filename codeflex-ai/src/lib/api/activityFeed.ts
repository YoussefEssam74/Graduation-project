import { apiFetch, type ApiResponse } from './client';

export interface ActivityFeedDto {
  activityId: number;
  userId: number;
  userName: string;
  activityType: string;
  title: string;
  description: string;
  category: string;
  relatedEntityId?: number;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}

export interface ActivityFeedCommentDto {
  id: number;
  activityId: number;
  userId: number;
  userName?: string;
  comment: string;
  createdAt: string;
}

export interface CreateActivityFeedDto {
  activityType: string;
  title: string;
  description: string;
  category?: string;
  relatedEntityId?: number;
}

export const activityFeedApi = {
  async createActivity(data: CreateActivityFeedDto): Promise<ApiResponse<ActivityFeedDto>> {
    return apiFetch<ActivityFeedDto>('/activity-feed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getUserActivities(userId: number, limit: number = 50): Promise<ApiResponse<ActivityFeedDto[]>> {
    return apiFetch<ActivityFeedDto[]>(`/activity-feed/user/${userId}?limit=${limit}`);
  },

  async getRecentActivities(limit: number = 100): Promise<ApiResponse<ActivityFeedDto[]>> {
    return apiFetch<ActivityFeedDto[]>(`/activity-feed/recent?limit=${limit}`);
  },

  async deleteActivity(id: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/activity-feed/${id}`, { method: 'DELETE' });
  },

  async likeActivity(id: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/activity-feed/${id}/like`, { method: 'POST' });
  },

  async unlikeActivity(id: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/activity-feed/${id}/like`, { method: 'DELETE' });
  },

  async addComment(id: number, comment: string): Promise<ApiResponse<ActivityFeedCommentDto>> {
    return apiFetch<ActivityFeedCommentDto>(`/activity-feed/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  async getComments(id: number): Promise<ApiResponse<ActivityFeedCommentDto[]>> {
    return apiFetch<ActivityFeedCommentDto[]>(`/activity-feed/${id}/comments`);
  },
};
