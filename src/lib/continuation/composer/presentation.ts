/**
 * Complete polished chapter presentation
 */

import type { Chapter } from '@/lib/db/schema'

export interface ChapterPresentation {
  chapter: Chapter
  formatted: string
  html: string
  metadata: {
    readingTime: number
    difficulty: 'easy' | 'medium' | 'hard'
    emotionalIntensity: number
  }
  navigation: {
    hasPrevious: boolean
    hasNext: boolean
    previousTitle?: string
    nextTitle?: string
  }
}

/**
 * Create complete chapter presentation
 */
export function createChapterPresentation(
  chapter: Chapter,
  previousChapter?: Chapter,
  nextChapter?: Chapter
): ChapterPresentation {
  const formatted = formatChapterContent(chapter)
  const html = convertToHtml(chapter)
  
  return {
    chapter,
    formatted,
    html,
    metadata: {
      readingTime: calculateReadingTime(chapter.wordCount),
      difficulty: assessDifficulty(chapter.content),
      emotionalIntensity: assessEmotionalIntensity(chapter),
    },
    navigation: {
      hasPrevious: !!previousChapter,
      hasNext: !!nextChapter,
      previousTitle: previousChapter?.title,
      nextTitle: nextChapter?.title,
    },
  }
}

function formatChapterContent(chapter: Chapter): string {
  const parts: string[] = []
  
  // Title
  parts.push(`# Chapter ${chapter.order}: ${chapter.title}`)
  parts.push('')
  
  // Scenes
  for (const scene of chapter.scenes) {
    parts.push(`## ${scene.title}`)
    parts.push('')
    
    if (scene.setting) {
      parts.push(`*${scene.setting}*`)
      parts.push('')
    }
    
    parts.push(scene.summary)
    parts.push('')
  }
  
  // Full content
  parts.push(chapter.content)
  
  return parts.join('\n')
}

function convertToHtml(chapter: Chapter): string {
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
  
  const parts: string[] = []
  
  parts.push('<article class="chapter">')
  parts.push(`<h1 class="chapter-title">Chapter ${chapter.order}: ${escapeHtml(chapter.title)}</h1>`)
  
  // Content with paragraph wrapping
  const paragraphs = chapter.content.split(/\n\n+/)
  for (const para of paragraphs) {
    if (para.trim()) {
      parts.push(`<p>${escapeHtml(para.trim())}</p>`)
    }
  }
  
  parts.push('</article>')
  
  return parts.join('\n')
}

function calculateReadingTime(wordCount: number): number {
  // Average reading speed: 250 words per minute
  return Math.ceil(wordCount / 250)
}

function assessDifficulty(content: string): 'easy' | 'medium' | 'hard' {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 'easy'
  
  const avgWordsPerSentence = content.split(/\s+/).length / sentences.length
  
  if (avgWordsPerSentence > 20) return 'hard'
  if (avgWordsPerSentence > 15) return 'medium'
  return 'easy'
}

function assessEmotionalIntensity(chapter: Chapter): number {
  let intensity = 5
  
  // Check scenes
  for (const scene of chapter.scenes) {
    const emotionalArc = scene.emotionalArc.toLowerCase()
    if (emotionalArc.includes('intense') || emotionalArc.includes('climax')) {
      intensity += 1
    }
    if (emotionalArc.includes('fear') || emotionalArc.includes('anger')) {
      intensity += 1
    }
  }
  
  // Check content for emotional keywords
  const contentLower = chapter.content.toLowerCase()
  const highIntensity = ['death', 'kill', 'scream', 'cry', 'laugh', 'shout']
  for (const word of highIntensity) {
    if (contentLower.includes(word)) {
      intensity += 0.5
    }
  }
  
  return Math.min(10, intensity)
}

/**
 * Create chapter preview (first portion)
 */
export function createChapterPreview(
  chapter: Chapter,
  wordLimit: number = 300
): string {
  const words = chapter.content.split(/\s+/)
  const preview = words.slice(0, wordLimit).join(' ')
  
  return preview + (words.length > wordLimit ? '...' : '')
}

/**
 * Format chapter for export
 */
export function formatForExport(
  chapter: Chapter,
  format: 'txt' | 'md' | 'html' | 'epub' | 'docx'
): string {
  switch (format) {
    case 'txt':
      return formatChapterContent(chapter)
      
    case 'md':
      return formatChapterContent(chapter)
      
    case 'html':
      return convertToHtml(chapter)
      
    case 'epub':
      // Simplified EPUB HTML
      return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chapter ${chapter.order}</title>
</head>
<body>
  ${convertToHtml(chapter)}
</body>
</html>`
      
    case 'docx':
      // Return plain text for now (real DOCX would need library)
      return formatChapterContent(chapter)
      
    default:
      return formatChapterContent(chapter)
  }
}

/**
 * Get chapter statistics
 */
export function getChapterStatistics(chapter: Chapter): {
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  dialogueCount: number
  avgSentenceLength: number
} {
  const sentences = chapter.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = chapter.content.split(/\n\n+/).filter(p => p.trim().length > 0)
  const dialogueMatches = chapter.content.match(/"[^"]*"/g) || []
  
  return {
    wordCount: chapter.wordCount,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    dialogueCount: dialogueMatches.length,
    avgSentenceLength: sentences.length > 0 
      ? chapter.wordCount / sentences.length 
      : 0,
  }
}
