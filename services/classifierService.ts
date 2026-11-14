/**
 * EcoScan Classifier Service
 *
 * Uses Google Gemini Vision via the Interactions API (v1beta).
 * Model: gemini-3.8-flash
 * Auth:  x-goog-api-key header with AQ. key
 *
 * Key loaded from .env → app.config.js → expo-constants.
 */

import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

export type MaterialCategory =
  | 'Plastic'
  | 'Paper'
  | 'Cardboard'
  | 'Glass'
  | 'Metal'
  | 'Trash';

export interface ClassificationResult {
  material: MaterialCategory;
  confidence: number;   // 0–1
  recyclable: boolean;
  recommendation: string;
  source: 'gemini';
}

const VALID_MATERIALS: MaterialCategory[] = [
  'Plastic', 'Paper', 'Cardboard', 'Glass', 'Metal', 'Trash',
];

const RECYCLABLE: Record<MaterialCategory, boolean> = {
  Plastic: true,
  Paper: true,
  Cardboard: true,
  Glass: true,
  Metal: true,
  Trash: false,
};

const RECOMMENDATIONS: Record<MaterialCategory, string> = {
  Plastic:   'Rinse clean and place in the plastic recycling bin. Remove caps if required locally.',
  Paper:     'Keep dry and flatten before placing in the paper recycling container.',
  Cardboard: 'Break down boxes and keep dry. Place in the cardboard or mixed recycling bin.',
  Glass:     'Rinse thoroughly and take to a glass recycling collection point.',
  Metal:     'Rinse cans and place in the metal or mixed recycling container.',
  Trash:     'This item cannot be recycled. Dispose of it in the general waste bin.',
};

const CLASSIFY_PROMPT = `Analyze this image and identify the primary recyclable material category.
Choose EXACTLY one of: Plastic, Paper, Cardboard, Glass, Metal, Trash.

Respond with ONLY valid JSON in this exact format, no other text:
{
  "material": "one of the categories above",
  "confidence": <number between 0.0 and 1.0>
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function imageToBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

function parseResponse(text: string): { material: MaterialCategory; confidence: number } | null {
  try {
    // Strip markdown code fences if present (```json ... ```)
    const cleaned = text.replace(/```[a-z]*\n?/gi, '').trim();
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const material = VALID_MATERIALS.find(
      (m) => m.toLowerCase() === String(parsed.material ?? '').toLowerCase()
    );
    if (!material) return null;
    const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));
    return { material, confidence };
  } catch {
    return null;
  }
}

/** Wait ms milliseconds */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Gemini Interactions API ──────────────────────────────────────────────────

// Working free-tier models confirmed by live test (Nov 2026)
// 3.8-flash and 3.6-flash hit 503 during peak — lite models are stable
const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

async function classifyWithGemini(
  base64: string
): Promise<{ material: MaterialCategory; confidence: number }> {
  const apiKey = Constants.expoConfig?.extra?.GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured in .env');

  let lastError: unknown;

  for (const model of GEMINI_MODELS) {
    const body = {
      model,
      input: [
        { type: 'text', text: CLASSIFY_PROMPT },
        { type: 'image', data: base64, mime_type: 'image/jpeg' },
      ],
    };

    // Retry current model up to 2 times on 429 rate limit
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/interactions',
          body,
          {
            headers: {
              'x-goog-api-key': apiKey,
              'Content-Type': 'application/json',
              'Api-Revision': '2026-05-20',
            },
            timeout: 20000,
          }
        );

        // Find the model_output step (there may be a "thought" step before it)
        const outputStep = response.data?.steps?.find(
          (s: any) => s.type === 'model_output'
        );
        const text: string =
          response.data?.output_text ??
          outputStep?.content?.[0]?.text ??
          '';

        const result = parseResponse(text);
        if (!result) throw new Error(`Could not parse Gemini response: "${text}"`);
        console.log(`Classified with ${model}`);
        return result;

      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;

        if (status === 429) {
          // Rate limited — wait and retry same model
          await sleep(2000 * (attempt + 1));
          continue;
        }

        if (status === 503) {
          // Server overloaded — skip to next model immediately
          console.warn(`${model} overloaded (503), trying next model...`);
          break;
        }

        // Any other error (400, 401, 404 etc) — throw immediately
        throw err;
      }
    }
  }

  throw lastError ?? new Error('All Gemini models unavailable');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function classifyImage(imageUri: string): Promise<ClassificationResult> {
  const base64 = await imageToBase64(imageUri);
  const raw = await classifyWithGemini(base64);

  return {
    material:       raw.material,
    confidence:     raw.confidence,
    recyclable:     RECYCLABLE[raw.material],
    recommendation: RECOMMENDATIONS[raw.material],
    source:         'gemini',
  };
}
