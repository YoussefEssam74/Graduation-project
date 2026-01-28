import { apiFetch, ApiResponse } from './client';

// ============ Types ============

export interface MuscleDto {
  muscleId: number;
  name: string;
  nameEn?: string;
  isFront: boolean;
  imageUrlMain?: string;
  imageUrlSecondary?: string;
}

export interface ExerciseCategoryDto {
  categoryId: number;
  name: string;
  exerciseCount: number;
}

export interface EquipmentInfoDto {
  equipmentId: number;
  name: string;
}

export interface ExerciseDetailDto {
  exerciseId: number;
  name: string;
  description?: string;
  category?: string;
  muscleGroup?: string;
  difficultyLevel?: string;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  primaryMuscles: MuscleDto[];
  secondaryMuscles: MuscleDto[];
  equipment: EquipmentInfoDto[];
}

export interface ExerciseFilterDto {
  categoryId?: number;
  muscleId?: number;
  equipmentId?: number;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface ExerciseListResponseDto {
  exercises: ExerciseDetailDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WgerImportResult {
  categoriesImported: number;
  musclesImported: number;
  equipmentImported: number;
  exercisesImported: number;
  translationsImported: number;
  exerciseMuscleLinksCreated: number;
  exerciseEquipmentLinksCreated: number;
  errors: string[];
  message: string;
  success: boolean;
}

// ============ API Functions ============

export const exerciseApi = {
  /**
   * Get all exercises with optional filtering
   */
  async getExercisesFiltered(
    filter: ExerciseFilterDto = {}
  ): Promise<ApiResponse<ExerciseListResponseDto>> {
    const params = new URLSearchParams();
    if (filter.categoryId !== undefined && filter.categoryId !== null) params.append('categoryId', filter.categoryId.toString());
    if (filter.muscleId !== undefined && filter.muscleId !== null) params.append('muscleId', filter.muscleId.toString());
    if (filter.equipmentId !== undefined && filter.equipmentId !== null) params.append('equipmentId', filter.equipmentId.toString());
    if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
    if (filter.page !== undefined && filter.page !== null) params.append('page', filter.page.toString());
    if (filter.pageSize !== undefined && filter.pageSize !== null) params.append('pageSize', filter.pageSize.toString());

    const queryString = params.toString();
    return apiFetch<ExerciseListResponseDto>(
      `/exercise/filter${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get exercise detail by ID
   */
  async getExerciseDetail(exerciseId: number): Promise<ApiResponse<ExerciseDetailDto>> {
    return apiFetch<ExerciseDetailDto>(`/exercise/${exerciseId}/detail`);
  },

  /**
   * Get all exercise categories
   */
  async getCategories(): Promise<ApiResponse<ExerciseCategoryDto[]>> {
    return apiFetch<ExerciseCategoryDto[]>('/exercise/categories');
  },

  /**
   * Get all muscles
   */
  async getMuscles(): Promise<ApiResponse<MuscleDto[]>> {
    return apiFetch<MuscleDto[]>('/exercise/muscles');
  },

  /**
   * Get exercises by category
   */
  async getExercisesByCategory(
    categoryId: number
  ): Promise<ApiResponse<ExerciseDetailDto[]>> {
    return apiFetch<ExerciseDetailDto[]>(`/exercise/category/${categoryId}`);
  },

  /**
   * Get exercises by muscle
   */
  async getExercisesByMuscle(
    muscleId: number
  ): Promise<ApiResponse<ExerciseDetailDto[]>> {
    return apiFetch<ExerciseDetailDto[]>(`/exercise/muscle/${muscleId}`);
  },

  /**
   * Get exercises by equipment
   */
  async getExercisesByEquipment(
    equipmentId: number
  ): Promise<ApiResponse<ExerciseDetailDto[]>> {
    return apiFetch<ExerciseDetailDto[]>(`/exercise/equipment/${equipmentId}`);
  },

  /**
   * Import data from wger (Admin only)
   */
  async importWgerData(): Promise<ApiResponse<WgerImportResult>> {
    return apiFetch<WgerImportResult>('/exercise/import-wger', {
      method: 'POST',
    });
  },
};
