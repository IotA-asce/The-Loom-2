/**
 * Genre-specific prompt variants
 */

import { PromptContext } from './index'

export type Genre =
  | 'shonen'
  | 'shojo'
  | 'seinen'
  | 'josei'
  | 'action'
  | 'romance'
  | 'mystery'
  | 'horror'
  | 'fantasy'
  | 'scifi'
  | 'slice-of-life'
  | 'sports'
  | 'isekai'

export function getGenreSpecificInstructions(genre: Genre): string {
  const instructions: Record<Genre, string> = {
    shonen:
      'Focus on: power progression, rivalries, friendship themes, action sequences, determination/never-give-up moments',

    shojo:
      'Focus on: emotional development, romantic tension, relationships, character growth, aesthetic details',

    seinen:
      'Focus on: complex motivations, moral ambiguity, realistic consequences, psychological depth, mature themes',

    josei:
      'Focus on: realistic relationships, career/personal balance, emotional nuance, adult challenges',

    action:
      'Focus on: fight choreography, power systems, strategic thinking, physical feats, combat dynamics',

    romance:
      'Focus on: romantic development, emotional beats, relationship obstacles, chemistry between characters',

    mystery:
      'Focus on: clues and evidence, red herrings, detective reasoning, revelations, plot twists',

    horror:
      'Focus on: atmospheric tension, psychological fear, supernatural elements, survival elements, dread',

    fantasy:
      'Focus on: world-building, magic systems, lore, mythical creatures, epic scope',

    scifi:
      'Focus on: technology, futuristic elements, scientific concepts, speculative ideas, world-building',

    'slice-of-life':
      'Focus on: everyday moments, character interactions, subtle emotions, atmospheric details, realism',

    sports:
      'Focus on: athletic techniques, training sequences, team dynamics, competition, strategy',

    isekai:
      'Focus on: world adaptation, new world mechanics, power progression, former world knowledge advantages',
  }

  return instructions[genre] || ''
}

/**
 * Enhance prompt with genre-specific instructions
 */
export function enhancePromptForGenre(basePrompt: string, genre: Genre): string {
  const genreInstructions = getGenreSpecificInstructions(genre)
  if (!genreInstructions) return basePrompt

  return `${basePrompt}\n\nGenre-Specific Focus (${genre}):\n${genreInstructions}`
}
