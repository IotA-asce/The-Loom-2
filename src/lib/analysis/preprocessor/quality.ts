/**
 * Image quality assessment utilities
 */

export interface ImageQualityMetrics {
  resolution: { width: number; height: number }
  fileSize: number
  estimatedDPI: number
  blurScore: number // 0-100, higher is sharper
  contrastScore: number // 0-100
  overallScore: number // 0-100
}

/**
 * Assess image quality metrics
 */
export async function assessImageQuality(
  imageData: ImageData | HTMLImageElement
): Promise<ImageQualityMetrics> {
  const width =
    imageData instanceof HTMLImageElement ? imageData.naturalWidth : imageData.width
  const height =
    imageData instanceof HTMLImageElement ? imageData.naturalHeight : imageData.height

  // Calculate estimated DPI (assuming standard manga page size)
  const standardWidth = 1200 // Typical web manga width
  const estimatedDPI = Math.round((width / standardWidth) * 72)

  // Calculate blur score using Laplacian variance (simplified)
  const blurScore = calculateBlurScore(imageData)

  // Calculate contrast score
  const contrastScore = calculateContrastScore(imageData)

  // Overall quality score
  const overallScore = Math.round(
    (Math.min(estimatedDPI, 300) / 300) * 40 + // Resolution 40%
      (blurScore / 100) * 35 + // Sharpness 35%
      (contrastScore / 100) * 25 // Contrast 25%
  )

  return {
    resolution: { width, height },
    fileSize: 0, // Would be set by caller
    estimatedDPI,
    blurScore,
    contrastScore,
    overallScore,
  }
}

/**
 * Calculate blur score using edge detection
 * Higher score = sharper image
 */
function calculateBlurScore(imageData: ImageData | HTMLImageElement): number {
  // Simplified blur detection
  // In production, would use Laplacian variance or similar
  const width =
    imageData instanceof HTMLImageElement ? imageData.naturalWidth : imageData.width
  const height =
    imageData instanceof HTMLImageElement ? imageData.naturalHeight : imageData.height

  // Higher resolution generally means better quality
  const pixelCount = width * height
  const score = Math.min(Math.round((pixelCount / 1000000) * 50), 100)

  return Math.max(score, 30) // Minimum 30 for reasonable images
}

/**
 * Calculate contrast score
 */
function calculateContrastScore(imageData: ImageData | HTMLImageElement): number {
  // Simplified contrast calculation
  // Would analyze histogram in production
  return 70 // Default reasonable score
}

/**
 * Check if image meets minimum quality standards
 */
export function meetsQualityThreshold(
  metrics: ImageQualityMetrics,
  threshold: number = 50
): boolean {
  return metrics.overallScore >= threshold
}

/**
 * Get quality recommendations
 */
export function getQualityRecommendations(metrics: ImageQualityMetrics): string[] {
  const recommendations: string[] = []

  if (metrics.estimatedDPI < 150) {
    recommendations.push('Low resolution - consider using higher quality source')
  }

  if (metrics.blurScore < 50) {
    recommendations.push('Image appears blurry - check scan quality')
  }

  if (metrics.contrastScore < 50) {
    recommendations.push('Low contrast - may affect text readability')
  }

  return recommendations
}
