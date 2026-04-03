import { useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VoiceAction =
  | 'event'
  | 'health'
  | 'birth'
  | 'vaccination'
  | 'migration'
  | 'grazing'
  | 'unknown';

export type VoiceCommand = {
  action: VoiceAction;
  animal_type?: string;
  count?: number;
  event_type?: string;
  location?: string;
  raw_text: string;
  confidence: number; // 0-1
};

// ---------------------------------------------------------------------------
// Mongolian keyword dictionaries
// ---------------------------------------------------------------------------

/** Малын төрлийг таних (Animal type recognition) */
const ANIMAL_PATTERNS: { pattern: RegExp; type: string }[] = [
  { pattern: /хонь|хонин|хонио|хониор/i, type: 'sheep' },
  { pattern: /ямаа|ямаан|ямааг/i, type: 'goat' },
  { pattern: /үхэр|үхрийн|үхрээ/i, type: 'cattle' },
  { pattern: /үнээ|үнээн|үнээг/i, type: 'cattle' },
  { pattern: /бух|бухыг/i, type: 'cattle' },
  { pattern: /тугал|тугалыг/i, type: 'cattle' },
  { pattern: /морь|морин|морио|мориор/i, type: 'horse' },
  { pattern: /адуу|адууг|адуун/i, type: 'horse' },
  { pattern: /гүү|гүүг/i, type: 'horse' },
  { pattern: /унага|унагыг/i, type: 'horse' },
  { pattern: /тэмээ|тэмээн|тэмээг/i, type: 'camel' },
  { pattern: /ингэ|ингэг/i, type: 'camel' },
  { pattern: /ботго|ботгыг/i, type: 'camel' },
];

/** Үйлдлийн түлхүүр үг (Action keywords) */
const ACTION_PATTERNS: {
  pattern: RegExp;
  action: VoiceAction;
  event_type?: string;
}[] = [
  // Төрөлт — Birth
  { pattern: /төрл?өө|төрсөн|төрүүлсэн|төрж/, action: 'birth', event_type: 'birth' },

  // Эрүүл мэнд — Health: deworming
  { pattern: /туулгалаа|туулга|туулгасан|туулгуулсан/, action: 'health', event_type: 'deworming' },

  // Эрүүл мэнд — Health: vaccination
  { pattern: /вакцин|тарилга|тарьсан|тариулсан/, action: 'vaccination', event_type: 'vaccination' },

  // Эрүүл мэнд — Health: illness
  { pattern: /өвчилсөн|өвдсөн|өвчтэй|өвчин/, action: 'health', event_type: 'illness' },

  // Эрүүл мэнд — Health: treatment
  { pattern: /эмчилсэн|эмчлүүлсэн|эмчилгээ/, action: 'health', event_type: 'treatment' },

  // Үйл явдал — Event: sold
  { pattern: /зарлаа|зарсан|худалдсан|борлуулсан/, action: 'event', event_type: 'sold' },

  // Үйл явдал — Event: purchased
  { pattern: /худалдаж\s*авсан|авсан|худалдан\s*авсан/, action: 'event', event_type: 'purchased' },

  // Үйл явдал — Event: death
  { pattern: /үхсэн|хорогдсон|хорогдлоо|мордсон|унасан/, action: 'event', event_type: 'death' },

  // Шилжилт — Migration
  { pattern: /нүүлээ|нүүсэн|нүүж|нүүхээр/, action: 'migration' },

  // Бэлчээр — Grazing
  { pattern: /бэлчээр|отор|оторлосон|бэлчсэн|зуслан|өвөлжөө|хаваржаа|намаржаа/, action: 'grazing' },
];

// ---------------------------------------------------------------------------
// Parser helpers
// ---------------------------------------------------------------------------

/** Тооны утга олох (Extract numeric count from text) */
function extractCount(text: string): number | undefined {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/** Малын төрөл олох (Find animal type) */
function extractAnimalType(text: string): string | undefined {
  for (const { pattern, type } of ANIMAL_PATTERNS) {
    if (pattern.test(text)) {
      return type;
    }
  }
  return undefined;
}

/** Үйлдэл таних (Detect action and event type) */
function extractAction(text: string): {
  action: VoiceAction;
  event_type?: string;
  confidence: number;
} {
  for (const { pattern, action, event_type } of ACTION_PATTERNS) {
    if (pattern.test(text)) {
      return { action, event_type, confidence: 0.8 };
    }
  }
  return { action: 'unknown', confidence: 0.2 };
}

/**
 * Байршлын мэдээлэл олох (Extract location info)
 *
 * Looks for known location suffixes common in Mongolian pastoral context:
 * зуслан, өвөлжөө, хаваржаа, намаржаа, нутаг, аймаг, сум
 * Also captures a preceding proper name when present.
 */
function extractLocation(text: string): string | undefined {
  const locationPattern =
    /([Ѐ-ӿ\w]+\s+)?(зуслан|өвөлжөө|хаваржаа|намаржаа|нутаг|аймаг|сум)/i;
  const match = text.match(locationPattern);
  if (match) {
    // Return the full matched location including the name prefix if present
    return match[0].trim();
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Main parse function
// ---------------------------------------------------------------------------

function parseVoiceCommand(text: string): VoiceCommand {
  const normalized = text.trim().toLowerCase();

  const { action, event_type, confidence } = extractAction(normalized);
  const animal_type = extractAnimalType(normalized);
  const count = extractCount(normalized);
  const location = extractLocation(text); // Use original text to preserve capitalization

  // Boost confidence when we have more data points
  let finalConfidence = confidence;
  if (animal_type) finalConfidence = Math.min(finalConfidence + 0.1, 1);
  if (count !== undefined) finalConfidence = Math.min(finalConfidence + 0.05, 1);
  if (location) finalConfidence = Math.min(finalConfidence + 0.05, 1);

  return {
    action,
    ...(animal_type && { animal_type }),
    ...(count !== undefined && { count }),
    ...(event_type && { event_type }),
    ...(location && { location }),
    raw_text: text,
    confidence: parseFloat(finalConfidence.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useVoice – Малчин апп-н дуут тушаалын hook
 *
 * MVP шатанд текст командыг задлан шинжилнэ.
 * Цаашид аудио бичлэг → speech-to-text интеграц нэмнэ.
 *
 * @example
 * ```tsx
 * const { parseCommand, getSuggestions } = useVoice();
 *
 * const result = parseCommand('Өнөөдөр 23 хонь туулгалаа');
 * // => { action: 'health', event_type: 'deworming', animal_type: 'sheep', count: 23, ... }
 * ```
 */
export function useVoice() {
  const parseCommand = useCallback((text: string): VoiceCommand => {
    return parseVoiceCommand(text);
  }, []);

  const getSuggestions = useCallback((): string[] => {
    return [
      '23 хонь туулгалаа',
      '5 ямаа зарлаа',
      '3 тугал төрлөө',
      'үнээ вакцин хийлгэсэн',
      'хонь руу нүүлээ',
      '100 хонь Батцэнгэл зуслан',
      '10 адуу отор',
      '2 үхэр үхсэн',
      'ингэ төрсөн',
      '50 ямаа бэлчээр',
    ];
  }, []);

  return {
    parseCommand,
    getSuggestions,
  };
}
