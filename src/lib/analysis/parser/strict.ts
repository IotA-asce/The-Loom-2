/**
 * Strict validation mode
 * Enforces strict schema compliance with no defaults
 */

import { z, ZodSchema } from 'zod'
import { ValidationResult, ValidationError, ValidationWarning } from './validation'

export interface StrictValidationOptions {
  noExtraFields: boolean
  requiredAllFields: boolean
  minConfidence: number
  validateTypes: boolean
}

export const DEFAULT_STRICT_OPTIONS: StrictValidationOptions = {
  noExtraFields: true,
  requiredAllFields: true,
  minConfidence: 0.3,
  validateTypes: true,
}

/**
 * Strict validator that enforces complete compliance
 */
export class StrictValidator {
  private options: StrictValidationOptions

  constructor(options: Partial<StrictValidationOptions> = {}) {
    this.options = { ...DEFAULT_STRICT_OPTIONS, ...options }
  }

  /**
   * Validate with strict mode
   */
  validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check for extra fields
    if (this.options.noExtraFields && typeof data === 'object' && data !== null) {
      const extraFields = this.findExtraFields(schema, data)
      for (const field of extraFields) {
        errors.push({
          path: field,
          message: `Extra field not allowed in strict mode: ${field}`,
          code: 'EXTRA_FIELD',
        })
      }
    }

    // Parse with schema
    const result = schema.safeParse(data)
    
    if (!result.success) {
      // @ts-ignore - Zod error type issue
      for (const issue of result.error.errors) {
        errors.push({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          received: issue.received,
        })
      }
    }

    // Check confidence scores
    if (this.options.minConfidence > 0) {
      const confidenceErrors = this.validateConfidence(data)
      errors.push(...confidenceErrors)
    }

    // Check data quality
    const qualityWarnings = this.validateDataQuality(data)
    warnings.push(...qualityWarnings)

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      data: result.success ? result.data : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Find extra fields not in schema
   */
  private findExtraFields(schema: ZodSchema<unknown>, data: unknown): string[] {
    const extra: string[] = []
    
    if (typeof data !== 'object' || data === null) return extra
    
    const dataObj = data as Record<string, unknown>
    
    // This is a simplified check - for production, use Zod's shape
    const schemaShape = (schema as unknown as { shape?: Record<string, unknown> })?.shape
    
    if (schemaShape) {
      const allowedFields = new Set(Object.keys(schemaShape))
      
      for (const key of Object.keys(dataObj)) {
        if (!allowedFields.has(key)) {
          extra.push(key)
        }
      }
    }
    
    return extra
  }

  /**
   * Validate confidence scores meet minimum
   */
  private validateConfidence(data: unknown): ValidationError[] {
    const errors: ValidationError[] = []
    
    if (typeof data !== 'object' || data === null) return errors
    
    const checkConfidence = (obj: unknown, path: string): void => {
      if (typeof obj !== 'object' || obj === null) return
      
      const record = obj as Record<string, unknown>
      
      if ('confidence' in record && typeof record.confidence === 'number') {
        if (record.confidence < this.options.minConfidence) {
          errors.push({
            path: `${path}.confidence`,
            message: `Confidence ${record.confidence} below minimum ${this.options.minConfidence}`,
            code: 'LOW_CONFIDENCE',
            received: record.confidence,
          })
        }
      }
      
      // Recurse into arrays and objects
      for (const [key, value] of Object.entries(record)) {
        if (Array.isArray(value)) {
          value.forEach((item, i) => checkConfidence(item, `${path}.${key}[${i}]`))
        } else if (typeof value === 'object') {
          checkConfidence(value, `${path}.${key}`)
        }
      }
    }
    
    checkConfidence(data, '')
    return errors
  }

  /**
   * Validate data quality
   */
  private validateDataQuality(data: unknown): ValidationWarning[] {
    const warnings: ValidationWarning[] = []
    
    if (typeof data !== 'object' || data === null) return warnings
    
    const checkQuality = (obj: unknown, path: string): void => {
      if (typeof obj !== 'object' || obj === null) return
      
      const record = obj as Record<string, unknown>
      
      for (const [key, value] of Object.entries(record)) {
        const currentPath = path ? `${path}.${key}` : key
        
        // Check for empty strings
        if (typeof value === 'string' && value.trim().length === 0) {
          warnings.push({
            path: currentPath,
            message: 'Empty string value',
            suggestion: 'Provide meaningful content or omit field',
          })
        }
        
        // Check for suspiciously short descriptions
        if (typeof value === 'string' && 
            (key.includes('description') || key.includes('summary')) &&
            value.length < 10) {
          warnings.push({
            path: currentPath,
            message: 'Very short description',
            suggestion: 'Consider providing more detail',
          })
        }
        
        // Recurse
        if (Array.isArray(value)) {
          value.forEach((item, i) => checkQuality(item, `${currentPath}[${i}]`))
        } else if (typeof value === 'object') {
          checkQuality(value, currentPath)
        }
      }
    }
    
    checkQuality(data, '')
    return warnings
  }

  /**
   * Update validation options
   */
  updateOptions(options: Partial<StrictValidationOptions>): void {
    this.options = { ...this.options, ...options }
  }
}

/**
 * Create strict validation schema from regular schema
 */
export function makeStrict<T>(schema: ZodSchema<T>): ZodSchema<T> {
  if (schema instanceof z.ZodObject) {
    return schema.strict() as unknown as ZodSchema<T>
  }
  return schema
}

/**
 * Quick strict validation
 */
export function validateStrict<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options?: Partial<StrictValidationOptions>
): ValidationResult<T> {
  const validator = new StrictValidator(options)
  return validator.validate(schema, data)
}
