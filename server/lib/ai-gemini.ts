import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "" 
});

export interface NormalizedDataItem {
  id: string;
  source: string;
  date: string;
  title: string;
  device_name: string | null;
  model: string | null;
  classification: string | null;
  reason: string | null;
  firm: string | null;
  manufacturer: string | null;
  state: string | null;
  status: string | null;
  codes: string[] | null;
  delta: { old: number; new: number } | null;
  match: { exact_model: boolean; fuzzy_model: boolean };
  flags: { maude_signal: boolean; manufacturer_notice: boolean };
  sources: string[];
}

export interface PatternDetectionResult {
  flags: {
    maude_signal: boolean;
    manufacturer_notice: boolean;
    recall_risk: boolean;
    financial_impact: boolean;
  };
  match: {
    exact_model: boolean;
    fuzzy_model: boolean;
    device_category: boolean;
  };
  confidence: number;
}

export async function normalizeData(rawData: any, source: string): Promise<NormalizedDataItem[]> {
  try {
    const systemPrompt = `You are a data normalization expert for regulatory intelligence.
    
Given raw data from ${source}, return a strictly normalized JSON array with these required fields:
- id: string (use original ID or generate one)
- source: string (${source})
- date: string (ISO date)
- title: string
- device_name: string|null
- model: string|null
- classification: string|null
- reason: string|null
- firm: string|null
- manufacturer: string|null
- state: string|null
- status: string|null
- codes: string[]|null (CPT codes if CMS)
- delta: {old: number, new: number}|null (if CMS pricing change)
- match: {exact_model: boolean, fuzzy_model: boolean}
- flags: {maude_signal: boolean, manufacturer_notice: boolean}
- sources: string[] (e.g., ["openfda:enforcement"], ["cms:pfs_change"])

Rules:
- Return ONLY valid JSON array, no prose
- Never invent values; use null if unknown
- For CMS data, detect price changes and populate delta
- Set flags based on content analysis
- Normalize device names and models consistently`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: JSON.stringify(rawData),
    });

    const normalized = JSON.parse(response.text);
    return Array.isArray(normalized) ? normalized : [normalized];
  } catch (error) {
    console.error('Gemini normalization error:', error);
    throw new Error(`Failed to normalize data: ${error.message}`);
  }
}

export async function detectPatterns(event: any): Promise<PatternDetectionResult> {
  try {
    const systemPrompt = `Analyze this regulatory event and return JSON with pattern detection:
    
{
  "flags": {
    "maude_signal": boolean,
    "manufacturer_notice": boolean,
    "recall_risk": boolean,
    "financial_impact": boolean
  },
  "match": {
    "exact_model": boolean,
    "fuzzy_model": boolean,
    "device_category": boolean
  },
  "confidence": number (0-100)
}

Look for:
- MAUDE database references or adverse event signals
- Official manufacturer communications
- Specific device model mentions
- Financial/pricing implications`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            flags: {
              type: "object",
              properties: {
                maude_signal: { type: "boolean" },
                manufacturer_notice: { type: "boolean" },
                recall_risk: { type: "boolean" },
                financial_impact: { type: "boolean" }
              }
            },
            match: {
              type: "object", 
              properties: {
                exact_model: { type: "boolean" },
                fuzzy_model: { type: "boolean" },
                device_category: { type: "boolean" }
              }
            },
            confidence: { type: "number" }
          }
        }
      },
      contents: JSON.stringify(event),
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Pattern detection error:', error);
    return {
      flags: { maude_signal: false, manufacturer_notice: false, recall_risk: false, financial_impact: false },
      match: { exact_model: false, fuzzy_model: false, device_category: false },
      confidence: 0
    };
  }
}
