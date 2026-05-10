import { apiFetch, type ApiResponse } from './client';

export interface AchievementDto {
  achievementId: number;
  code: string;
  name: string;
  description: string;
  category: string;
  iconUrl?: string;
  tokenReward: number;
  xpReward: number;
  thresholdValue?: number;
  isSecret: boolean;
  rarity: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UserAchievementDto {
  userAchievementId: number;
  userId: number;
  achievementId: number;
  currentProgress: number;
  isEarned: boolean;
  earnedAt?: string;
  rewardClaimed: boolean;
  achievement: AchievementDto;
}

export const achievementsApi = {
  async getAllAchievements(): Promise<ApiResponse<AchievementDto[]>> {
    return apiFetch<AchievementDto[]>('/achievements');
  },

  async getMyAchievements(): Promise<ApiResponse<UserAchievementDto[]>> {
    return apiFetch<UserAchievementDto[]>('/achievements/my');
  },

  async getUserAchievements(userId: number): Promise<ApiResponse<UserAchievementDto[]>> {
    return apiFetch<UserAchievementDto[]>(`/achievements/user/${userId}`);
  },

  async checkAndAward(): Promise<ApiResponse<UserAchievementDto[]>> {
    return apiFetch<UserAchievementDto[]>('/achievements/check', { method: 'POST' });
  },
};
