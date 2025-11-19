import { doc, setDoc, collection, Firestore, Timestamp } from "firebase/firestore";
import type { Notification } from "@/lib/types";

type NotificationPayload = Omit<Notification, 'id' | 'createdAt' | 'isRead'>;

/**
 * Creates or overwrites a notification for a specific user.
 * Using setDoc with a predictable ID prevents duplicate "welcome" messages.
 * This is a fire-and-forget operation.
 * @param firestore - The Firestore instance.
 * @param userId - The ID of the user to notify.
 * @param payload - The notification content.
 * @param notificationId - An optional ID for the notification. If not provided, a random one will be generated.
 */
export function createNotification(
    firestore: Firestore, 
    userId: string, 
    payload: NotificationPayload,
    notificationId?: string
): void {
    if (!userId) {
        console.error("No userId provided for notification.");
        return;
    }

    const notificationsCollection = collection(firestore, 'users', userId, 'notifications');
    const docRef = notificationId ? doc(notificationsCollection, notificationId) : doc(notificationsCollection);
    
    const newNotification: Omit<Notification, 'id'> = {
        ...payload,
        createdAt: Timestamp.now(),
        isRead: false,
    };

    setDoc(docRef, newNotification, { merge: true }).catch(error => {
        // We log the error but don't block the UI or show a toast,
        // as notifications are a background process.
        console.error("Error creating notification:", error);
    });
}
