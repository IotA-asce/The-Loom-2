/**
 * User-configurable preprocessing options
 */

export interface PreprocessingConfig {
  // Quality settings
  minQualityThreshold: number
  targetFormat: 'webp' | 'jpeg' | 'original'
  compressionQuality: number

  // Size settings
  maxWidth: number
  maxHeight: number
  maintainAspectRatio: boolean

  // Spread handling
  splitDoublePages: boolean
  detectSpreads: boolean

  // Enhancement
  enableUpscaling: boolean
  upscalingFactor: 1.5 | 2 | 4
  cropMargins: boolean
  marginPixels: number

  // Rotation
  autoRotate: boolean
  rotationThreshold: number
}

export const defaultPreprocessingConfig: PreprocessingConfig = {
  minQualityThreshold: 50,
  targetFormat: 'webp',
  compressionQuality: 0.85,

  maxWidth: 1920,
  maxHeight: 1080,
  maintainAspectRatio: true,

  splitDoublePages: false,
  detectSpreads: true,

  enableUpscaling: false,
  upscalingFactor: 2,
  cropMargins: false,
  marginPixels: 10,

  autoRotate: false,
  rotationThreshold: 5,
}

/**
 * Validate preprocessing configuration
 */
export function validateConfig(config: Partial<PreprocessingConfig>): PreprocessingConfig {
  return {
    ...defaultPreprocessingConfig,
    ...config,
  }
}

/**
 * Get config presets
 */
export function getConfigPreset(
  preset: 'fast' | 'balanced' | 'quality'
): Partial<PreprocessingConfig> {
  const presets = {
    fast: {
      compressionQuality: 0.7,
      maxWidth: 1280,
      enableUpscaling: false,
    },
    balanced: {
      compressionQuality: 0.85,
      maxWidth: 1920,
      enableUpscaling: false,
    },
    quality: {
      compressionQuality: 0.95,
      maxWidth: 2560,
      enableUpscaling: true,
      upscalingFactor: 2 as const,
    },
  }

  return presets[preset]
}
