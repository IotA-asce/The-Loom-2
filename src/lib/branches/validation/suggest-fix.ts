/**
 * Suggest-fix workflow for consistency issues
 */

import type { TieredValidationResult } from './tiered-validation'
import type { WorldRulesValidation, RuleViolation } from './world-rules'

export interface SuggestedFix {
  issue: string
  severity: 'minor' | 'major' | 'critical'
  fixType: 'automatic' | 'semi-automatic' | 'manual'
  suggestion: string
  automaticFix?: string
  alternatives?: string[]
}

export interface FixWorkflow {
  issues: SuggestedFix[]
  autoFixable: SuggestedFix[]
  needsManual: SuggestedFix[]
  appliedFixes: string[]
  remainingIssues: string[]
}

/**
 * Generate suggested fixes for validation issues
 */
export function generateSuggestedFixes(
  traitValidation: TieredValidationResult[],
  worldValidation: WorldRulesValidation
): FixWorkflow {
  const issues: SuggestedFix[] = []
  
  // Process trait validation issues
  for (const result of traitValidation) {
    for (const violation of result.coreViolations) {
      issues.push({
        issue: `Core trait violation: ${result.characterName}'s ${violation.trait}`,
        severity: 'critical',
        fixType: 'manual',
        suggestion: `Either change the branch direction to respect ${result.characterName}'s core ${violation.trait}, or provide extensive justification for why this fundamental trait changes`,
        alternatives: [
          `Maintain ${violation.trait} and adjust branch consequences`,
          `Add formative event that justifies change`,
          `Consider if this is truly the same character`,
        ],
      })
    }
    
    for (const violation of result.secondaryViolations) {
      issues.push({
        issue: `Secondary trait change: ${result.characterName}'s ${violation.trait}`,
        severity: 'major',
        fixType: 'semi-automatic',
        suggestion: `Add character development scenes showing gradual change in ${violation.trait}`,
        automaticFix: `Add a scene before the anchor where ${result.characterName} begins questioning their ${violation.trait}`,
      })
    }
  }
  
  // Process world rule violations
  for (const violation of worldValidation.hardRules.violations) {
    issues.push({
      issue: `Hard rule violation: ${violation.rule.name}`,
      severity: violation.severity === 'critical' ? 'critical' : 'major',
      fixType: 'manual',
      suggestion: violation.suggestedFix || `Address violation of ${violation.rule.name}`,
      alternatives: [
        `Remove the violating element`,
        `Reframe within existing rules`,
        `Establish exception earlier in story`,
      ],
    })
  }
  
  for (const violation of worldValidation.softRules.violations) {
    issues.push({
      issue: `Soft rule ${violation.severity === 'error' ? 'break' : 'bend'}: ${violation.rule.name}`,
      severity: violation.severity === 'error' ? 'major' : 'minor',
      fixType: violation.severity === 'warning' ? 'automatic' : 'semi-automatic',
      suggestion: violation.suggestedFix || `Justify the ${violation.rule.name} deviation`,
      automaticFix: violation.severity === 'warning' 
        ? `Add narrative acknowledgment of unusual ${violation.rule.name} situation`
        : undefined,
    })
  }
  
  // Categorize fixes
  const autoFixable = issues.filter(i => i.fixType === 'automatic')
  const needsManual = issues.filter(i => i.fixType === 'manual')
  const semiAutomatic = issues.filter(i => i.fixType === 'semi-automatic')
  
  return {
    issues,
    autoFixable,
    needsManual: [...needsManual, ...semiAutomatic],
    appliedFixes: [],
    remainingIssues: issues.map(i => i.issue),
  }
}

/**
 * Apply automatic fixes
 */
export function applyAutomaticFixes(
  workflow: FixWorkflow
): { workflow: FixWorkflow; applied: string[] } {
  const applied: string[] = []
  const remaining: SuggestedFix[] = []
  
  for (const fix of workflow.issues) {
    if (fix.fixType === 'automatic' && fix.automaticFix) {
      applied.push(`${fix.issue}: ${fix.automaticFix}`)
    } else {
      remaining.push(fix)
    }
  }
  
  const updatedWorkflow: FixWorkflow = {
    ...workflow,
    issues: remaining,
    autoFixable: [],
    appliedFixes: [...workflow.appliedFixes, ...applied],
    remainingIssues: remaining.map(i => i.issue),
  }
  
  return { workflow: updatedWorkflow, applied }
}

/**
 * Apply a specific fix
 */
export function applyFix(
  workflow: FixWorkflow,
  issueIndex: number,
  fixOption?: string
): FixWorkflow {
  if (issueIndex < 0 || issueIndex >= workflow.issues.length) {
    return workflow
  }
  
  const fix = workflow.issues[issueIndex]
  const applied = fixOption || fix.suggestion
  
  const remaining = workflow.issues.filter((_, i) => i !== issueIndex)
  
  return {
    ...workflow,
    issues: remaining,
    needsManual: remaining.filter(i => i.fixType !== 'automatic'),
    appliedFixes: [...workflow.appliedFixes, `${fix.issue}: ${applied}`],
    remainingIssues: remaining.map(i => i.issue),
  }
}

/**
 * Dismiss an issue (accept as-is)
 */
export function dismissIssue(
  workflow: FixWorkflow,
  issueIndex: number,
  reason?: string
): FixWorkflow {
  if (issueIndex < 0 || issueIndex >= workflow.issues.length) {
    return workflow
  }
  
  const fix = workflow.issues[issueIndex]
  const remaining = workflow.issues.filter((_, i) => i !== issueIndex)
  
  return {
    ...workflow,
    issues: remaining,
    needsManual: remaining.filter(i => i.fixType !== 'automatic'),
    appliedFixes: [
      ...workflow.appliedFixes, 
      `${fix.issue}: ACCEPTED${reason ? ` (${reason})` : ''}`
    ],
    remainingIssues: remaining.map(i => i.issue),
  }
}

/**
 * Get workflow status
 */
export function getWorkflowStatus(workflow: FixWorkflow): {
  complete: boolean
  hasCritical: boolean
  canProceed: boolean
  summary: string
} {
  const hasCritical = workflow.issues.some(i => i.severity === 'critical')
  const hasManual = workflow.needsManual.length > 0
  
  return {
    complete: workflow.issues.length === 0,
    hasCritical,
    canProceed: !hasCritical,
    summary: `${workflow.appliedFixes.length} fixes applied, ${workflow.issues.length} issues remaining (${workflow.needsManual.length} need attention)`,
  }
}

/**
 * Generate fix report
 */
export function generateFixReport(workflow: FixWorkflow): string {
  const lines: string[] = []
  
  lines.push('# Consistency Fix Report')
  lines.push('')
  
  if (workflow.appliedFixes.length > 0) {
    lines.push('## Applied Fixes')
    for (const fix of workflow.appliedFixes) {
      lines.push(`- ${fix}`)
    }
    lines.push('')
  }
  
  if (workflow.issues.length > 0) {
    lines.push('## Remaining Issues')
    
    const critical = workflow.issues.filter(i => i.severity === 'critical')
    const major = workflow.issues.filter(i => i.severity === 'major')
    const minor = workflow.issues.filter(i => i.severity === 'minor')
    
    if (critical.length > 0) {
      lines.push('### Critical (Must Fix)')
      for (const issue of critical) {
        lines.push(`- **${issue.issue}**`)
        lines.push(`  - Suggestion: ${issue.suggestion}`)
        if (issue.alternatives) {
          lines.push(`  - Alternatives:`)
          for (const alt of issue.alternatives) {
            lines.push(`    - ${alt}`)
          }
        }
      }
      lines.push('')
    }
    
    if (major.length > 0) {
      lines.push('### Major (Should Fix)')
      for (const issue of major) {
        lines.push(`- ${issue.issue}`)
        lines.push(`  - Suggestion: ${issue.suggestion}`)
      }
      lines.push('')
    }
    
    if (minor.length > 0) {
      lines.push('### Minor (Optional)')
      for (const issue of minor) {
        lines.push(`- ${issue.issue}`)
      }
    }
  } else {
    lines.push('All consistency issues resolved! ✓')
  }
  
  return lines.join('\n')
}
