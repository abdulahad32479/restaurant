/**
 * Service to manage branch-specific settings that are not yet supported by the backend.
 * Uses localStorage as a temporary persistence layer.
 */

export interface ExtraBranchSettings {
  receipt_logo?: string;
  receipt_logo_bottom?: string;
  payment_account?: string;
}

const STORAGE_KEY_PREFIX = 'branch_extra_settings_';

export const localSettingsService = {
  getForBranch: (branchId: string): ExtraBranchSettings => {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${branchId}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse local branch settings', e);
      }
    }
    return {};
  },

  saveForBranch: (branchId: string, settings: ExtraBranchSettings): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${branchId}`, JSON.stringify(settings));
  }
};
