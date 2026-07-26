import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { getListings, createListing, updateListing, deleteListing } from '@controllers/marketplace.controller';

const router = Router();

router.get('/', getListings);
router.post('/', authenticate, createListing);
router.put('/:id', authenticate, updateListing);
router.delete('/:id', authenticate, deleteListing);

export default router;
