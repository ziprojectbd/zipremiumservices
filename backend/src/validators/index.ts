import { z } from 'zod';

export const emailSchema = z.string().email().trim().toLowerCase();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const mongoIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ObjectId');

export type PaginationInput = z.infer<typeof paginationSchema>;
