import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Crop, PesticideLog } from './types';

// Check if running inside Expo Go client where expo-notifications module init throws errors in SDK 53+
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

// Dynamically acquire Notifications module only on native standalone builds
let NotificationsModule: typeof import('expo-notifications') | null = null;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    NotificationsModule = require('expo-notifications');
    if (NotificationsModule && NotificationsModule.setNotificationHandler) {
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        } as any),
      });
    }
  } catch (e) {
    console.warn('Skipped expo-notifications initialization:', e);
  }
}

// Request permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' || isExpoGo || !NotificationsModule) return false;
  try {
    if (Platform.OS === 'android') {
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: NotificationsModule.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
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
  if (Platform.OS === 'web' || isExpoGo || !NotificationsModule) return;
  try {
    const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content.data as { cropId?: string } | undefined;
      if (data && data.cropId === cropId) {
        await NotificationsModule.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn('Error cancelling notification:', error);
  }
}

// Sync Cardamom spraying notifications (Consolidated: Max 1 notification per day)
export async function syncCardamomNotifications(crops: Crop[], pesticideLogs: PesticideLog[]) {
  if (Platform.OS === 'web' || isExpoGo || !NotificationsModule) return;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Always cancel existing single cardamom notification first to avoid duplicates
    try {
      await NotificationsModule.cancelScheduledNotificationAsync('cardamom-daily-spray');
    } catch {}

    // Filter active cardamom crops
    const cardamomCrops = crops.filter(c => 
      c.stage !== 'Archived' && 
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
        .filter(p => (p.cropIds || []).includes(crop.id))
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

      await NotificationsModule.scheduleNotificationAsync({
        identifier: 'cardamom-daily-spray',
        content: {
          title: 'Cardamom Spraying Reminder 🧪',
          body: bodyText,
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          type: NotificationsModule.SchedulableTriggerInputTypes.DAILY,
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
          await NotificationsModule.scheduleNotificationAsync({
            identifier: 'cardamom-daily-spray',
            content: {
              title: 'Cardamom Spraying Reminder 🧪',
              body: `Cardamom plot "${nextDue.crop.name}" needs chemical spraying today.`,
              sound: true,
              vibrate: [0, 250, 250, 250],
            },
            trigger: {
              type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
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
  if (Platform.OS === 'web' || isExpoGo || !NotificationsModule) return false;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    // Cancel existing one first to avoid duplicates
    await cancelFishFeedingNotification();

    const triggerInput = {
      type: NotificationsModule.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'default',
    };

    await NotificationsModule.scheduleNotificationAsync({
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
  if (Platform.OS === 'web' || isExpoGo || !NotificationsModule) return;
  try {
    await NotificationsModule.cancelScheduledNotificationAsync('fish-feeding-daily');
  } catch (error) {
    console.warn('Error cancelling daily fish feeding notification:', error);
  }
}

// Immediate Test Notification (5 seconds delay)
export async function testFishFeedingNotification(): Promise<boolean> {
  if (Platform.OS === 'web' || isExpoGo || !NotificationsModule) return false;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title: 'Time to Feed the Fish! 🐟',
        body: 'This is a test alert for your fish feeding schedule.',
        sound: true,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.TIME_INTERVAL,
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

