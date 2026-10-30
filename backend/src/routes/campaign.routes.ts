import { Router } from 'express';
import { listCampaigns, createCampaign, getActiveCampaigns, getCampaignBySlug, updateCampaign } from '@controllers/campaign.controller';

const router = Router();

// Public routes (specific routes first, before parameterized routes)
router.get('/active', getActiveCampaigns);
router.get('/:slug', getCampaignBySlug);

// Generic CRUD
router.get('/', listCampaigns);
router.post('/', createCampaign);
router.put('/:id', updateCampaign);

export default router;
