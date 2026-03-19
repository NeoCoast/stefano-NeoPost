import { Router } from 'express';

import FeedController from '@/controllers/feed';
import FeedService from '@/services/feed';
import passport from '@/middlewares/passport';

const router = Router();
const feedService = new FeedService();
const feedController = new FeedController(feedService);
const authenticate = passport.authenticate('jwt', { session: false });

router.get('/following', authenticate, feedController.getFollowing);
router.get('/for-you', authenticate, feedController.getForYou);

export default router;
