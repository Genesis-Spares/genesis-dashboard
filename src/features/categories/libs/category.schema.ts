// src/features/categories/libs/category.schema.ts
import { z } from 'zod';

// Field limits mirror CreateCategoryDto's class-validator decorators
export const createCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    slug: z
        .string()
        .min(2, 'Slug must be at least 2 characters')
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only')
        .optional()
        .or(z.literal('')),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    icon: z.string().optional(),
    imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    parentId: z.string().uuid('Invalid parent category').optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;