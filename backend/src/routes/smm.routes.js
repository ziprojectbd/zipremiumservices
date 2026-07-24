import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { getSmmServices, getSmmSettings, updateSmmSettings, syncSmmServices, deleteSmmProducts, fetchSmmPlatforms } from '../controllers/smm.controller.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/services', getSmmServices);
router.get('/settings', getSmmSettings);
router.put('/settings', updateSmmSettings);
router.post('/sync', syncSmmServices);
router.delete('/products', deleteSmmProducts);
router.post('/fetch-platforms', fetchSmmPlatforms);

export default router;
