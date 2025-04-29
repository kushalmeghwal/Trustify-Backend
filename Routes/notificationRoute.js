import express from 'express';
import { getUserNotifications, markNotificationAsRead } from '../Controllers/notificationController.js';

const router = express.Router();

router.get('/notifications', getUserNotifications);
router.patch('/notifications/:notificationId/mark-read',markNotificationAsRead);

export default router;