/**
 * A/B testing framework for prompts
 */

export interface ABTestVariant {
  id: string
  name: string
  promptModifier: string
  weight: number // 0-1, determines traffic split
}

export interface ABTest {
  id: string
  name: string
  promptType: string
  variants: ABTestVariant[]
  startDate: Date
  endDate?: Date
  metrics: {
    totalCalls: number
    variantCalls: Map<string, number>
  }
}

export class ABTestFramework {
  private tests: Map<string, ABTest> = new Map()

  /**
   * Create a new A/B test
   */
  createTest(test: Omit<ABTest, 'metrics'>): ABTest {
    const fullTest: ABTest = {
      ...test,
      metrics: {
        totalCalls: 0,
        variantCalls: new Map(),
      },
    }
    this.tests.set(test.id, fullTest)
    return fullTest
  }

  /**
   * Select variant for a test
   */
  selectVariant(testId: string): ABTestVariant | undefined {
    const test = this.tests.get(testId)
    if (!test) return undefined

    // Weighted random selection
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0)
    let random = Math.random() * totalWeight

    for (const variant of test.variants) {
      random -= variant.weight
      if (random <= 0) {
        // Track selection
        test.metrics.totalCalls++
        test.metrics.variantCalls.set(
          variant.id,
          (test.metrics.variantCalls.get(variant.id) || 0) + 1
        )
        return variant
      }
    }

    return test.variants[test.variants.length - 1]
  }

  /**
   * Get test results
   */
  getResults(testId: string): { variant: string; calls: number; percentage: number }[] {
    const test = this.tests.get(testId)
    if (!test) return []

    const total = test.metrics.totalCalls
    if (total === 0) return []

    return test.variants.map(variant => ({
      variant: variant.name,
      calls: test.metrics.variantCalls.get(variant.id) || 0,
      percentage: ((test.metrics.variantCalls.get(variant.id) || 0) / total) * 100,
    }))
  }
}

export const abTestFramework = new ABTestFramework()
