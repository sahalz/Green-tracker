import { Crop, PesticideLog } from './types';

// Request permissions (no-op on web)
export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

// Cancel spraying notifications (no-op on web)
export async function cancelSprayingNotification(cropId: string) {
  // No-op on web
}

// Sync all Cardamom spraying notifications (no-op on web)
export async function syncCardamomNotifications(crops: Crop[], pesticideLogs: PesticideLog[]) {
  // No-op on web
}

// Schedule daily fish feeding notification (no-op on web)
export async function scheduleDailyFishFeedingNotification(hour: number, minute: number): Promise<boolean> {
  return false;
}

// Cancel daily fish feeding notification (no-op on web)
export async function cancelFishFeedingNotification(): Promise<void> {
  // No-op on web
}

