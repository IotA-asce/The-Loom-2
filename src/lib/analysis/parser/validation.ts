/**
 * Zod schema validation for analysis responses
 * Type-safe validation with detailed error reporting
 */

import { z, ZodSchema, ZodError } from 'zod'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  path: string
  message: string
  code: string
  received?: unknown
}

export interface ValidationWarning {
  path: string
  message: string
  suggestion?: string
}

/**
 * Convert Zod error to validation errors
 */
function zodErrorToValidationErrors(error: ZodError): ValidationError[] {
  // @ts-ignore - Zod error type issue
  return (error as any).issues?.map((err: any) => ({
    path: err.path?.join('.') || '',
    message: err.message,
    code: err.code,
    received: err.received,
  })) || []
}

/**
 * Validate data against Zod schema
 */
export function validateWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options?: { strict?: boolean }
): ValidationResult<T> {
  try {
    let result: T
    
    if (options?.strict) {
      result = schema.parse(data)
    } else {
      result = schema.parse(data)
    }
    
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: zodErrorToValidationErrors(error),
      }
    }
    
    return {
      success: false,
      errors: [{
        path: '',
        message: String(error),
        code: 'UNKNOWN_ERROR',
      }],
    }
  }
}

/**
 * Safe parse with warnings
 */
export function safeValidateWithWarnings<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)
  const warnings: ValidationWarning[] = []
  
  if (result.success) {
    // Check for common issues that aren't validation errors
    checkForWarnings(data, warnings)
    
    return {
      success: true,
      data: result.data,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }
  
  return {
    success: false,
    errors: zodErrorToValidationErrors(result.error),
  }
}

/**
 * Check for common data quality issues
 */
function checkForWarnings(data: unknown, warnings: ValidationWarning[]): void {
  if (typeof data !== 'object' || data === null) return
  
  const obj = data as Record<string, unknown>
  
  // Check for empty arrays
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length === 0) {
      warnings.push({
        path: key,
        message: `Empty array for ${key}`,
        suggestion: 'Verify this field should be empty',
      })
    }
    
    // Check for very short strings
    if (typeof value === 'string' && value.length < 3) {
      warnings.push({
        path: key,
        message: `Very short value for ${key}: "${value}"`,
        suggestion: 'Consider providing more detail',
      })
    }
    
    // Check for null values
    if (value === null) {
      warnings.push({
        path: key,
        message: `Null value for ${key}`,
      })
    }
  }
}

// ============================================================================
// Analysis Response Schemas
// ============================================================================

/**
 * Character schema
 */
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  description: z.string(),
  firstAppearance: z.number().int().min(0),
  importance: z.enum(['major', 'supporting', 'minor']),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
})

export type ParsedCharacter = z.infer<typeof CharacterSchema>

/**
 * Timeline event schema
 */
export const TimelineEventSchema = z.object({
  id: z.string(),
  pageNumber: z.number().int().min(0),
  chapterNumber: z.number().int().optional(),
  title: z.string().min(1),
  description: z.string(),
  characters: z.array(z.string()),
  significance: z.enum(['minor', 'moderate', 'major', 'critical']),
  isFlashback: z.boolean().default(false),
  chronologicalOrder: z.number().int().optional(),
  confidence: z.number().min(0).max(1).optional(),
})

export type ParsedTimelineEvent = z.infer<typeof TimelineEventSchema>

/**
 * Theme schema
 */
export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  keywords: z.array(z.string()),
  prevalence: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1).optional(),
})

export type ParsedTheme = z.infer<typeof ThemeSchema>

/**
 * Relationship schema
 */
export const RelationshipSchema = z.object({
  id: z.string(),
  characterA: z.string(),
  characterB: z.string(),
  type: z.string(),
  description: z.string(),
  evolution: z.array(z.object({
    pageNumber: z.number().int(),
    state: z.string(),
  })).default([]),
  confidence: z.number().min(0).max(1).optional(),
})

export type ParsedRelationship = z.infer<typeof RelationshipSchema>

/**
 * Complete analysis response schema
 */
export const AnalysisResponseSchema = z.object({
  characters: z.array(CharacterSchema).default([]),
  timeline: z.array(TimelineEventSchema).default([]),
  themes: z.array(ThemeSchema).default([]),
  relationships: z.array(RelationshipSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  metadata: z.object({
    processedAt: z.string().optional(),
    model: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
})

export type ParsedAnalysisResponse = z.infer<typeof AnalysisResponseSchema>

/**
 * Strict validation with no defaults
 */
export const StrictAnalysisResponseSchema = z.object({
  characters: z.array(CharacterSchema),
  timeline: z.array(TimelineEventSchema),
  themes: z.array(ThemeSchema),
  relationships: z.array(RelationshipSchema),
  confidence: z.number().min(0).max(1),
})

export type StrictParsedAnalysisResponse = z.infer<typeof StrictAnalysisResponseSchema>
