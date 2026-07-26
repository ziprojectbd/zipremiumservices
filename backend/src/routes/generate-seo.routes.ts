import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import env from '@config/env';

const router = Router();

router.use(authenticate, adminOnly);

// POST /api/admin/generate-seo
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { productName } = req.body;
    if (!productName || !productName.trim()) {
      return res.status(400).json(error('Product name is required'));
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json(error('Gemini API key not configured'));
    }

    const prompt = `You are an SEO and e-commerce expert. Based on the product name "${productName}", generate the following in STRICT JSON format (no markdown, no code fences, no extra text):

{
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "seoTitle": "SEO title max 60 chars",
  "seoSlug": "url-friendly-slug-without-spaces",
  "seoDescription": "SEO meta description max 160 chars",
  "seoKeywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}

Requirements:
- features: exactly 5 concise bullet-point features as an array of strings, each under 80 characters. Focus on key selling points.
- seoTitle: max 60 characters, include the product name, compelling for search engines.
- seoSlug: URL-friendly version of product name, lowercase, hyphens only, no special chars.
- seoDescription: max 160 characters, engaging meta description with relevant keywords.
- seoKeywords: 5-10 comma-separated keywords relevant to the product.
- Return ONLY valid JSON. No explanations, no markdown formatting.`;

    const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

    let lastError: unknown = null;

    for (const model of models) {
      try {
        const genAI = new GoogleGenAI({ apiKey });
        const result = await genAI.models.generateContent({
          model,
          contents: prompt,
        });

        const text = result.text || '';

        // Clean the response: remove markdown code fences if present
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```(?:json)?\n?/g, '').trim();
        }

        const data = JSON.parse(cleaned) as {
          features?: string[];
          seoTitle?: string;
          seoSlug?: string;
          seoDescription?: string;
          seoKeywords?: string;
        };

        // Validate and sanitize
        const features = Array.isArray(data.features)
          ? data.features.slice(0, 5).map((f: string) => String(f).trim())
          : [];

        // Pad features to ensure we always have 5
        while (features.length < 5) {
          features.push('');
        }

        return res.json(
          success({
            features,
            seoTitle: String(data.seoTitle || '').slice(0, 60),
            seoSlug: String(data.seoSlug || '')
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, ''),
            seoDescription: String(data.seoDescription || '').slice(0, 160),
            seoKeywords: String(data.seoKeywords || ''),
          })
        );
      } catch (err: unknown) {
        lastError = err;
        const apiErr = err as { message?: string };
        console.error(`Gemini API error (model: ${model}):`, apiErr.message);
        // If it's not a quota/rate-limit error, don't bother retrying
        if (!apiErr.message?.includes('429') && !apiErr.message?.includes('quota') && !apiErr.message?.includes('RESOURCE_EXHAUSTED')) {
          break;
        }
      }
    }

    console.error('All Gemini models failed:', (lastError as { message?: string })?.message);
    const lastErr = lastError as { message?: string } | null;
    const message = lastErr?.message?.includes('429') || lastErr?.message?.includes('quota') || lastErr?.message?.includes('RESOURCE_EXHAUSTED')
      ? 'Gemini API quota exceeded. The free tier has limited requests per minute/day. Try again later or use a new API key at https://aistudio.google.com/apikey'
      : `Gemini API error: ${lastErr?.message || 'Unknown error'}`;
    return res.status(500).json(error(message));
  })
);

export default router;
