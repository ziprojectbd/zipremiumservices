import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import { getSmmServices, getSmmSettings, updateSmmSettings, syncSmmServices, deleteSmmProducts, fetchSmmPlatforms } from '@controllers/smm.controller';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/services', getSmmServices);
router.get('/settings', getSmmSettings);
router.put('/settings', updateSmmSettings);
router.post('/sync', syncSmmServices);
router.delete('/products', deleteSmmProducts);
router.post('/fetch-platforms', fetchSmmPlatforms);

export default router;
