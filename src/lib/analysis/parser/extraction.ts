/**
 * JSON extraction from LLM responses
 * Handles various JSON formats and embedded responses
 */

import { z } from 'zod'

export interface ExtractionResult<T> {
  success: boolean
  data?: T
  rawJson?: string
  error?: string
}

/**
 * Extract JSON from various response formats
 */
export function extractJson<T>(response: string): ExtractionResult<T> {
  if (!response || typeof response !== 'string') {
    return { success: false, error: 'Empty or invalid response' }
  }

  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(response)
    return { success: true, data: parsed as T, rawJson: response }
  } catch {
    // Continue to extraction methods
  }

  // Method 1: Extract from markdown code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim())
      return { success: true, data: parsed as T, rawJson: codeBlockMatch[1].trim() }
    } catch {
      // Continue to next method
    }
  }

  // Method 2: Extract JSON between brackets (find outermost braces)
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return { success: true, data: parsed as T, rawJson: jsonMatch[0] }
    } catch {
      // Continue to next method
    }
  }

  // Method 3: Extract array JSON
  const arrayMatch = response.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0])
      return { success: true, data: parsed as T, rawJson: arrayMatch[0] }
    } catch {
      // Continue to next method
    }
  }

  // Method 4: Look for JSON after common prefixes
  const prefixes = ['JSON:', 'Response:', 'Output:', 'Result:']
  for (const prefix of prefixes) {
    const prefixIndex = response.indexOf(prefix)
    if (prefixIndex !== -1) {
      const afterPrefix = response.substring(prefixIndex + prefix.length).trim()
      try {
        const parsed = JSON.parse(afterPrefix)
        return { success: true, data: parsed as T, rawJson: afterPrefix }
      } catch {
        // Try with code block extraction on the substring
        const subResult = extractJson<T>(afterPrefix)
        if (subResult.success) return subResult
      }
    }
  }

  return { success: false, error: 'Could not extract valid JSON from response' }
}

/**
 * Extract multiple JSON objects from response
 */
export function extractMultipleJson<T>(response: string): ExtractionResult<T>[] {
  const results: ExtractionResult<T>[] = []
  const jsonRegex = /\{[\s\S]*?\}(?=\s*(?:\{|\[|$))/g
  
  let match
  while ((match = jsonRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[0])
      results.push({ success: true, data: parsed as T, rawJson: match[0] })
    } catch {
      // Skip invalid JSON
    }
  }

  return results
}

/**
 * Clean and normalize JSON string
 */
export function cleanJsonString(json: string): string {
  return json
    // Remove BOM
    .replace(/^\uFEFF/, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix single quotes to double quotes (basic)
    .replace(/'([^']*?)'/g, '"$1"')
    // Remove line comments
    .replace(/\/\/.*$/gm, '')
    // Remove block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
}

/**
 * Safe JSON parse with detailed error
 */
export function safeJsonParse<T>(json: string): { 
  success: boolean
  data?: T
  error?: string
  line?: number
  column?: number
} {
  try {
    const cleaned = cleanJsonString(json)
    const parsed = JSON.parse(cleaned)
    return { success: true, data: parsed as T }
  } catch (error) {
    if (error instanceof SyntaxError) {
      const match = error.message.match(/position\s+(\d+)/)
      const position = match ? parseInt(match[1]) : 0
      
      // Calculate line and column
      const lines = json.substring(0, position).split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length + 1
      
      return {
        success: false,
        error: error.message,
        line,
        column,
      }
    }
    
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * Extract specific fields from unstructured text
 */
export function extractFields(
  text: string,
  fields: string[]
): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const field of fields) {
    // Try various patterns
    const patterns = [
      new RegExp(`${field}[:\s]+(.+?)(?=\n\w|$)`, 'i'),
      new RegExp(`${field}[:\s]+"([^"]+)"`, 'i'),
      new RegExp(`"${field}"[:\s]+"([^"]+)"`, 'i'),
      new RegExp(`"${field}"[:\s]+([^,\}]+)`, 'i'),
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        result[field] = match[1].trim()
        break
      }
    }
  }
  
  return result
}
