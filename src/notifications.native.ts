import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Crop, PesticideLog } from './types';

// Configure notifications handler (only on native platforms)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    } as any),
  });
}

// Request permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

// Cancel spraying notifications for a specific crop
export async function cancelSprayingNotification(cropId: string) {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content.data as { cropId?: string } | undefined;
      if (data && data.cropId === cropId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn('Error cancelling notification:', error);
  }
}

// Sync all Cardamom spraying notifications
export async function syncCardamomNotifications(crops: Crop[], pesticideLogs: PesticideLog[]) {
  if (Platform.OS === 'web') return;

  try {
    // Request permission (non-intrusive check)
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Filter active cardamom crops
    const cardamomCrops = crops.filter(c => 
      c.stage !== 'Archived' && 
      (c.type.toLowerCase().includes('cardamom') || 
       c.type.toLowerCase().includes('cardomom') || 
       c.type.includes('ഏല'))
    );

    // Cancel notifications for crops that are no longer active cardamom
    const activeCardamomIds = new Set(cardamomCrops.map(c => c.id));
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content.data as { cropId?: string } | undefined;
      if (data && data.cropId && !activeCardamomIds.has(data.cropId)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Schedule/Reconcile for active cardamom crops
    for (const crop of cardamomCrops) {
      // Find last spray
      const cropSprays = pesticideLogs
        .filter(p => (p.cropIds || []).includes(crop.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let baseDate = new Date(crop.plantingDate);
      if (cropSprays.length > 0) {
        baseDate = new Date(cropSprays[0].date);
      }

      // Next due date = base date + 30 days
      const dueDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Let's see if we already have a scheduled notification for this crop on the due date
      const alreadyScheduled = scheduled.find(notif => {
        const data = notif.content.data as { cropId?: string } | undefined;
        if (data && data.cropId === crop.id) {
          const triggerDate = (notif.trigger as any)?.date;
          if (triggerDate) {
            const diff = Math.abs(new Date(triggerDate).getTime() - dueDate.getTime());
            return diff < 60 * 1000; // within 1 minute
          }
        }
        return false;
      });

      if (alreadyScheduled) {
        continue;
      }

      // Reschedule (first cancel any old scheduled notification for this crop)
      await cancelSprayingNotification(crop.id);

      const msUntilDue = dueDate.getTime() - Date.now();
      if (msUntilDue <= 0) {
        // Overdue! Send an immediate alert notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Cardamom Spraying Overdue! 🧪',
            body: `Crop "${crop.name}" is due for its monthly chemical spray.`,
            data: { cropId: crop.id },
          },
          trigger: null,
        });
      } else {
        // Schedule for the exact future due date
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time to Spray Cardamom! 🧪',
            body: `Crop "${crop.name}" needs its monthly chemical spray today.`,
            data: { cropId: crop.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dueDate,
          },
        });
      }
    }
  } catch (error) {
    console.warn('Error syncing cardamom notifications:', error);
  }
}
