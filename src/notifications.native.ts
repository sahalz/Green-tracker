import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Crop, PesticideLog } from './types';

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Skipped expo-notifications initialization:', e);
  }
}

// Request permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16a34a',
      });
    }
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

// Sync Cardamom spraying notifications (Consolidated: Max 1 notification per day)
export async function syncCardamomNotifications(crops: Crop[], pesticideLogs: PesticideLog[]) {
  if (Platform.OS === 'web') return;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Always cancel existing single cardamom notification first to avoid duplicates
    try {
      await Notifications.cancelScheduledNotificationAsync('cardamom-daily-spray');
    } catch {}

    // Filter active cardamom crops with reminders enabled
    const cardamomCrops = crops.filter(c => 
      c.stage !== 'Archived' && 
      c.sprayReminderEnabled !== false &&
      (c.type.toLowerCase().includes('cardamom') || 
       c.type.toLowerCase().includes('cardomom') || 
       c.type.includes('ഏല'))
    );

    if (cardamomCrops.length === 0) return;

    // Calculate next due date for each active cardamom plot
    const dueInfo: { crop: Crop; dueDate: Date; isOverdue: boolean }[] = [];
    const now = new Date();

    for (const crop of cardamomCrops) {
      const cropSprays = pesticideLogs
        .filter(p => (p.cropIds || []).includes(crop.id) && p.requiresReminder !== false)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let baseDate = new Date(crop.plantingDate);
      if (cropSprays.length > 0) {
        baseDate = new Date(cropSprays[0].date);
      }

      const dueDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const isOverdue = dueDate.getTime() <= now.getTime();
      dueInfo.push({ crop, dueDate, isOverdue });
    }

    // Check if any crops are currently due/overdue
    const overdueCrops = dueInfo.filter(d => d.isOverdue);

    if (overdueCrops.length > 0) {
      // Schedule EXACTLY 1 daily summary notification at 9:00 AM for all due/overdue plots
      const names = overdueCrops.map(d => d.crop.name).join(', ');
      const bodyText = overdueCrops.length === 1
        ? `Cardamom plot "${names}" is due for chemical spraying.`
        : `${overdueCrops.length} Cardamom plots (${names}) are due for chemical spraying.`;

      await Notifications.scheduleNotificationAsync({
        identifier: 'cardamom-daily-spray',
        content: {
          title: 'Cardamom Spraying Reminder 🧪',
          body: bodyText,
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
          channelId: 'default',
        } as any,
      });
    } else {
      // Find nearest upcoming due date among all cardamom plots
      dueInfo.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      const nextDue = dueInfo[0];
      if (nextDue) {
        const triggerDate = new Date(nextDue.dueDate);
        triggerDate.setHours(9, 0, 0, 0);

        if (triggerDate.getTime() > now.getTime()) {
          await Notifications.scheduleNotificationAsync({
            identifier: 'cardamom-daily-spray',
            content: {
              title: 'Cardamom Spraying Reminder 🧪',
              body: `Cardamom plot "${nextDue.crop.name}" needs chemical spraying today.`,
              sound: true,
              vibrate: [0, 250, 250, 250],
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
              channelId: 'default',
            } as any,
          });
        }
      }
    }
  } catch (error) {
    console.warn('Error syncing cardamom notifications:', error);
  }
}

// Schedule daily fish feeding notification
export async function scheduleDailyFishFeedingNotification(hour: number, minute: number): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    // Cancel existing one first to avoid duplicates
    await cancelFishFeedingNotification();

    const triggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'default',
    };

    await Notifications.scheduleNotificationAsync({
      identifier: 'fish-feeding-daily',
      content: {
        title: 'Time to Feed the Fish! 🐟',
        body: 'Please feed your fish as scheduled.',
        sound: true,
        vibrate: [0, 250, 250, 250],
      },
      trigger: triggerInput as any,
    });
    return true;
  } catch (error) {
    console.warn('Error scheduling daily fish feeding notification:', error);
    return false;
  }
}

// Cancel daily fish feeding notification
export async function cancelFishFeedingNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync('fish-feeding-daily');
  } catch (error) {
    console.warn('Error cancelling daily fish feeding notification:', error);
  }
}

// Immediate Test Notification (5 seconds delay)
export async function testFishFeedingNotification(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Feed the Fish! 🐟',
        body: 'This is a test alert for your fish feeding schedule.',
        sound: true,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
        channelId: 'default',
      } as any,
    });
    return true;
  } catch (error) {
    console.warn('Error scheduling test notification:', error);
    return false;
  }
}


