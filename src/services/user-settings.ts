import type {
    ApiResponse,
    UpdateUserSettingsRequest,
    UserSettings
} from '../types/api';
import { apiClient } from './api';

class UserSettingsService {

    /**
     * Busca configurações do usuário
     */
    async getUserSettings(): Promise<UserSettings> {
        const response = await apiClient.get<ApiResponse<UserSettings>>(
            '/UserSettings'
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to fetch user settings');
    }

    /**
     * Cria ou atualiza configurações do usuário
     */
    async createOrUpdateUserSettings(settingsData: UpdateUserSettingsRequest): Promise<UserSettings> {
        const response = await apiClient.post<ApiResponse<UserSettings>>('/UserSettings', settingsData);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.message || 'Failed to create log');
    }
}

// Create and export singleton instance
export const userSettingsService = new UserSettingsService();

// Export class for testing
export default UserSettingsService;