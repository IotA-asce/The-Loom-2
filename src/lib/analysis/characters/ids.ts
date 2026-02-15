/**
 * Descriptive ID system for unnamed characters
 * Generates meaningful IDs based on visual characteristics
 */

export interface CharacterDescriptor {
  gender?: 'male' | 'female' | 'unknown'
  ageEstimate?: 'child' | 'teen' | 'young-adult' | 'adult' | 'elderly'
  hairColor?: string
  hairStyle?: string
  clothing?: string
  distinguishingFeatures?: string[]
  role?: string
}

export interface DescriptiveIdResult {
  id: string
  displayName: string
  descriptor: CharacterDescriptor
  confidence: number
}

/**
 * Generate descriptive ID for unnamed character
 */
export function generateDescriptiveId(
  descriptor: CharacterDescriptor,
  index: number = 0
): DescriptiveIdResult {
  const parts: string[] = []
  const nameParts: string[] = []
  
  // Build ID from available descriptors
  if (descriptor.gender && descriptor.gender !== 'unknown') {
    parts.push(descriptor.gender.charAt(0))
  }
  
  if (descriptor.ageEstimate) {
    parts.push(descriptor.ageEstimate.replace('-', ''))
  }
  
  if (descriptor.hairColor) {
    parts.push(descriptor.hairColor)
    nameParts.push(capitalize(descriptor.hairColor))
  }
  
  if (descriptor.clothing) {
    const clothingAdj = descriptor.clothing.split(' ')[0]
    parts.push(clothingAdj)
  }
  
  // Add distinguishing feature if available
  if (descriptor.distinguishingFeatures?.length) {
    const feature = descriptor.distinguishingFeatures[0]
      .toLowerCase()
      .replace(/\s+/g, '-')
    parts.push(feature)
  }
  
  // Generate ID
  const baseId = parts.join('-')
  const id = index > 0 ? `${baseId}-${index}` : baseId
  
  // Generate display name
  const displayName = generateDisplayName(descriptor, nameParts)
  
  // Calculate confidence based on descriptor completeness
  const confidence = calculateDescriptorConfidence(descriptor)
  
  return {
    id: `char-${id}`,
    displayName,
    descriptor,
    confidence,
  }
}

/**
 * Generate human-readable display name
 */
function generateDisplayName(
  descriptor: CharacterDescriptor,
  nameParts: string[]
): string {
  const parts: string[] = []
  
  // Start with descriptors
  if (descriptor.ageEstimate) {
    parts.push(capitalize(descriptor.ageEstimate.replace('-', ' ')))
  }
  
  if (descriptor.hairColor) {
    parts.push(capitalize(descriptor.hairColor))
  }
  
  if (descriptor.gender && descriptor.gender !== 'unknown') {
    parts.push(capitalize(descriptor.gender))
  }
  
  // Add role or generic term
  if (descriptor.role) {
    parts.push(capitalize(descriptor.role))
  } else {
    parts.push('Character')
  }
  
  return parts.join(' ') || 'Unknown Character'
}

/**
 * Calculate confidence based on descriptor completeness
 */
function calculateDescriptorConfidence(descriptor: CharacterDescriptor): number {
  let score = 0
  let maxScore = 0
  
  // Gender (20%)
  maxScore += 0.2
  if (descriptor.gender && descriptor.gender !== 'unknown') {
    score += 0.2
  }
  
  // Age (20%)
  maxScore += 0.2
  if (descriptor.ageEstimate) {
    score += 0.2
  }
  
  // Hair color (15%)
  maxScore += 0.15
  if (descriptor.hairColor) {
    score += 0.15
  }
  
  // Clothing (15%)
  maxScore += 0.15
  if (descriptor.clothing) {
    score += 0.15
  }
  
  // Distinguishing features (20%)
  maxScore += 0.2
  if (descriptor.distinguishingFeatures?.length) {
    score += Math.min(0.2, descriptor.distinguishingFeatures.length * 0.1)
  }
  
  // Role (10%)
  maxScore += 0.1
  if (descriptor.role) {
    score += 0.1
  }
  
  return maxScore > 0 ? Math.round((score / maxScore) * 100) / 100 : 0.3
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Parse visual description into descriptor
 */
export function parseVisualDescription(description: string): CharacterDescriptor {
  const descriptor: CharacterDescriptor = {}
  const lower = description.toLowerCase()
  
  // Gender detection
  if (lower.includes('female') || lower.includes('woman') || lower.includes('girl')) {
    descriptor.gender = 'female'
  } else if (lower.includes('male') || lower.includes('man') || lower.includes('boy')) {
    descriptor.gender = 'male'
  } else {
    descriptor.gender = 'unknown'
  }
  
  // Age detection
  if (lower.includes('child') || lower.includes('young child')) {
    descriptor.ageEstimate = 'child'
  } else if (lower.includes('teen') || lower.includes('teenager')) {
    descriptor.ageEstimate = 'teen'
  } else if (lower.includes('young adult')) {
    descriptor.ageEstimate = 'young-adult'
  } else if (lower.includes('elderly') || lower.includes('old')) {
    descriptor.ageEstimate = 'elderly'
  } else if (lower.includes('adult')) {
    descriptor.ageEstimate = 'adult'
  }
  
  // Hair color detection
  const hairColors = ['black', 'brown', 'blonde', 'blond', 'red', 'silver', 'white', 'blue', 'green', 'purple']
  for (const color of hairColors) {
    if (lower.includes(`${color} hair`) || lower.includes(`${color}-haired`)) {
      descriptor.hairColor = color === 'blond' ? 'blonde' : color
      break
    }
  }
  
  // Extract distinguishing features
  const features: string[] = []
  if (lower.includes('glasses')) features.push('glasses')
  if (lower.includes('scar')) features.push('scar')
  if (lower.includes('tattoo')) features.push('tattoo')
  if (lower.includes('freckles')) features.push('freckles')
  if (lower.includes('beard')) features.push('beard')
  if (lower.includes('glasses')) features.push('glasses')
  descriptor.distinguishingFeatures = features
  
  return descriptor
}

/**
 * ID generator for batch processing
 */
export class DescriptiveIdGenerator {
  private usedIds = new Set<string>()
  private counter = 0
  
  /**
   * Generate unique descriptive ID
   */
  generate(descriptor: CharacterDescriptor): DescriptiveIdResult {
    let result: DescriptiveIdResult
    let attempts = 0
    
    do {
      result = generateDescriptiveId(descriptor, this.counter)
      this.counter++
      attempts++
    } while (this.usedIds.has(result.id) && attempts < 100)
    
    this.usedIds.add(result.id)
    return result
  }
  
  /**
   * Reset generator state
   */
  reset(): void {
    this.usedIds.clear()
    this.counter = 0
  }
  
  /**
   * Check if ID is already used
   */
  isUsed(id: string): boolean {
    return this.usedIds.has(id)
  }
}
