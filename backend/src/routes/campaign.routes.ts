import { Router } from 'express';
import { listCampaigns, createCampaign } from '@controllers/campaign.controller';

const router = Router();

router.get('/', listCampaigns);
router.post('/', createCampaign);

export default router;
