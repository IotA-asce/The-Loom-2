/**
 * Malformed JSON repair
 * Attempts to fix common JSON syntax errors
 */

import { extractJson } from './extraction'

export interface RepairResult {
  success: boolean
  repaired?: string
  error?: string
  repairs: string[]
}

/**
 * Attempt to repair malformed JSON
 */
export function repairJson(malformed: string): RepairResult {
  const repairs: string[] = []
  let repaired = malformed

  // Try 1: Basic cleaning
  repaired = basicRepair(repaired)
  repairs.push('basic_cleaning')

  // Try parsing
  try {
    JSON.parse(repaired)
    return { success: true, repaired, repairs }
  } catch {
    // Continue with more repairs
  }

  // Try 2: Fix quotes
  repaired = fixQuotes(repaired)
  repairs.push('quote_fixing')
  
  try {
    JSON.parse(repaired)
    return { success: true, repaired, repairs }
  } catch {
    // Continue
  }

  // Try 3: Fix trailing commas
  repaired = fixTrailingCommas(repaired)
  repairs.push('trailing_comma_removal')
  
  try {
    JSON.parse(repaired)
    return { success: true, repaired, repairs }
  } catch {
    // Continue
  }

  // Try 4: Fix brackets
  repaired = fixBrackets(repaired)
  repairs.push('bracket_balancing')
  
  try {
    JSON.parse(repaired)
    return { success: true, repaired, repairs }
  } catch {
    // Continue
  }

  // Try 5: Extract valid subset
  const extracted = extractValidSubset(repaired)
  if (extracted) {
    repairs.push('valid_subset_extraction')
    return { success: true, repaired: extracted, repairs }
  }

  return {
    success: false,
    error: 'Could not repair JSON - too malformed',
    repairs,
  }
}

/**
 * Basic cleaning operations
 */
function basicRepair(json: string): string {
  return json
    // Remove BOM
    .replace(/^\uFEFF/, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .trim()
}

/**
 * Fix quote issues
 */
function fixQuotes(json: string): string {
  let result = json
  
  // Replace single quotes with double (carefully)
  // Only replace if it looks like JSON key/value
  result = result.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
  result = result.replace(/:\s*'([^']*)'\s*([,}])/g, ': "$1"$2')
  
  // Fix unescaped quotes in strings (naive approach)
  // This is a best-effort fix
  result = result.replace(/"([^"]*)"([^,:}\]])/g, (match, content, after) => {
    // If followed by what looks like JSON, the quote should end
    if (/^[\s,}\]]/.test(after)) {
      return match
    }
    return `"${content}\\"${after}`
  })
  
  return result
}

/**
 * Fix trailing commas
 */
function fixTrailingCommas(json: string): string {
  return json
    // Remove trailing commas before closing braces
    .replace(/,(\s*\})/g, '$1')
    // Remove trailing commas before closing brackets
    .replace(/,(\s*\])/g, '$1')
    // Remove trailing commas at end of arrays/objects with whitespace
    .replace(/,\s*([}\]])/g, '$1')
}

/**
 * Fix bracket balancing
 */
function fixBrackets(json: string): string {
  const stack: string[] = []
  
  for (const char of json) {
    if (char === '{' || char === '[') {
      stack.push(char === '{' ? '}' : ']')
    } else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop()
      }
    }
  }
  
  // Add missing closing brackets
  return json + stack.reverse().join('')
}

/**
 * Extract valid JSON subset
 */
function extractValidSubset(json: string): string | null {
  // Try to find the longest valid JSON prefix
  for (let i = json.length; i > 0; i--) {
    const subset = json.substring(0, i)
    try {
      JSON.parse(subset)
      return subset
    } catch {
      // Continue
    }
  }
  
  // Try extracting just the first complete object
  const objectMatch = json.match(/(\{[^{}]*\})/)
  if (objectMatch) {
    try {
      JSON.parse(objectMatch[1])
      return objectMatch[1]
    } catch {
      // Continue
    }
  }
  
  return null
}

/**
 * Repair with LLM assistance
 */
export async function repairWithLLM(
  malformed: string,
  repairFn: (broken: string) => Promise<string>
): Promise<RepairResult> {
  const repairs: string[] = ['llm_assisted_repair']
  
  try {
    const repaired = await repairFn(malformed)
    
    // Validate the repair
    try {
      JSON.parse(repaired)
      return { success: true, repaired, repairs }
    } catch {
      return {
        success: false,
        error: 'LLM repair did not produce valid JSON',
        repairs,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `LLM repair failed: ${error}`,
      repairs,
    }
  }
}

/**
 * Repair result metadata
 */
export interface RepairMetadata {
  originalLength: number
  repairedLength: number
  repairsApplied: string[]
  confidence: number
}

/**
 * Get repair metadata
 */
export function getRepairMetadata(
  original: string,
  result: RepairResult
): RepairMetadata {
  const repairedLength = result.repaired?.length || 0
  const lengthRatio = repairedLength / original.length
  
  // Confidence based on how much was preserved and what repairs were made
  let confidence = lengthRatio
  if (result.repairs.includes('valid_subset_extraction')) {
    confidence *= 0.7 // Lower confidence if we had to extract subset
  }
  if (result.repairs.includes('llm_assisted_repair')) {
    confidence = Math.min(confidence, 0.9) // Cap at 0.9 for LLM repairs
  }
  
  return {
    originalLength: original.length,
    repairedLength,
    repairsApplied: result.repairs,
    confidence: Math.round(confidence * 100) / 100,
  }
}
