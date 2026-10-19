import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { config } from '../config/env.js';

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  topicsCovered: string[];
  followUpSuggestions: string[];
  sentiment: 'positive' | 'neutral' | 'constructive' | 'mixed';
  isDemoMode: boolean;
  modelUsed: string;
  provider: 'gemini' | 'openai' | 'demo';
}

export interface ExtractedActionItem {
  task: string;
  description: string;
  assigneeName: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  sourceQuote?: string | null;
  timestamp?: string | null;
  speaker?: string | null;
}

export interface ActionItemResult {
  actionItems: ExtractedActionItem[];
  isDemoMode: boolean;
  modelUsed: string;
  provider: 'gemini' | 'openai' | 'demo';
}

export interface TranscriptEntry {
  speakerName: string;
  timestamp: string;
  text: string;
  confidence: number;
}

export interface TranscriptionResult {
  fullText: string;
  entries: TranscriptEntry[];
  isDemoMode: boolean;
  modelUsed: string;
  provider: 'groq' | 'openai' | 'demo';
  durationSeconds?: number;
}

export interface ProviderStatus {
  gemini: {
    configured: boolean;
    model: string;
  };
  groq: {
    configured: boolean;
    model: string;
  };
  demoMode: boolean;
}

export class AiService {
  private static geminiClient: GoogleGenAI | null = null;
  private static groqClient: Groq | null = null;

  /**
   * Lazy-initialize and return the Google Gemini client
   */
  private static getGemini(): GoogleGenAI {
    if (!config.isGeminiConfigured) {
      throw new Error(
        'Google Gemini API key is missing. Please set GEMINI_API_KEY in your .env file to enable genuine AI summaries and action item extraction.'
      );
    }
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    }
    return this.geminiClient;
  }

  /**
   * Lazy-initialize and return the Groq SDK client
   */
  private static getGroq(): Groq {
    if (!config.isGroqConfigured) {
      throw new Error(
        'Groq API key is missing. Please set GROQ_API_KEY in your .env file to enable real Whisper speech-to-text audio transcription.'
      );
    }
    if (!this.groqClient) {
      this.groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
    }
    return this.groqClient;
  }

  /**
   * Return current configuration status of AI providers
   */
  static getProviderStatus(): ProviderStatus {
    return {
      gemini: {
        configured: config.isGeminiConfigured,
        model: config.GEMINI_MODEL
      },
      groq: {
        configured: config.isGroqConfigured,
        model: config.GROQ_MODEL
      },
      demoMode: config.DEMO_MODE
    };
  }

  /**
   * Test live connection to Google Gemini API
   */
  static async testGeminiConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      const gemini = this.getGemini();
      const response = await gemini.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: 'Respond with exactly: {"status":"ok","engine":"gemini"}',
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        model: config.GEMINI_MODEL,
        message: text.trim(),
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      throw new Error(`Gemini API connection test failed (${config.GEMINI_MODEL}): ${err.message || err}`);
    }
  }

  /**
   * Test live connection to Groq API
   */
  static async testGroqConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      const groq = this.getGroq();
      // List models to verify authentication and access
      const models = await groq.models.list();
      const latencyMs = Date.now() - startTime;
      const whisperAvailable = models.data.some((m) => m.id.includes('whisper'));
      return {
        success: true,
        model: config.GROQ_MODEL,
        message: `Groq connection authenticated. Whisper available: ${whisperAvailable}. Total models: ${models.data.length}`,
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      throw new Error(`Groq API connection test failed: ${err.message || err}`);
    }
  }

  /**
   * Transcribe real meeting audio using Groq Whisper API
   */
  static async transcribeAudio(filePath?: string): Promise<TranscriptionResult> {
    // 1. If an audio file is supplied, attempt real Groq Whisper transcription
    if (filePath && fs.existsSync(filePath)) {
      if (!config.isGroqConfigured) {
        throw new Error(
          'GROQ_API_KEY is not configured in .env. Please configure GROQ_API_KEY to transcribe uploaded meeting audio with Whisper.'
        );
      }

      // Validate supported format
      const validExtensions = ['.webm', '.wav', '.mp3', '.m4a', '.ogg', '.flac', '.mp4'];
      const ext = path.extname(filePath).toLowerCase();
      if (!validExtensions.includes(ext)) {
        throw new Error(`Unsupported audio format '${ext}'. Supported formats: ${validExtensions.join(', ')}`);
      }

      // Check file size (Groq Whisper limit: 25 MB)
      const stats = fs.statSync(filePath);
      const maxBytes = 25 * 1024 * 1024;
      if (stats.size > maxBytes) {
        throw new Error(
          `Audio file size (${(stats.size / (1024 * 1024)).toFixed(1)} MB) exceeds Groq 25 MB limit.`
        );
      }

      try {
        const groq = this.getGroq();
        const fileStream = fs.createReadStream(filePath);

        const response: any = await groq.audio.transcriptions.create({
          file: fileStream,
          model: config.GROQ_MODEL,
          response_format: 'verbose_json',
          temperature: 0.0
        });

        const fullText = (response.text || '').trim();
        if (!fullText) {
          throw new Error('Groq Whisper returned an empty transcript for the provided audio file.');
        }

        // Parse verbose segments with timestamps
        let entries: TranscriptEntry[] = [];
        if (Array.isArray(response.segments) && response.segments.length > 0) {
          entries = response.segments.map((seg: any) => {
            const startSec = Math.floor(seg.start || 0);
            const mins = Math.floor(startSec / 60)
              .toString()
              .padStart(2, '0');
            const secs = (startSec % 60).toString().padStart(2, '0');
            return {
              speakerName: '[Speaker identification not available]',
              timestamp: `${mins}:${secs}`,
              text: (seg.text || '').trim(),
              confidence: seg.avg_logprob ? Math.round(Math.exp(seg.avg_logprob) * 100) / 100 : 0.95
            };
          });
        } else {
          entries = [
            {
              speakerName: '[Speaker identification not available]',
              timestamp: '00:00',
              text: fullText,
              confidence: 0.98
            }
          ];
        }

        return {
          fullText,
          entries,
          isDemoMode: false,
          modelUsed: `Groq (${config.GROQ_MODEL})`,
          provider: 'groq',
          durationSeconds: response.duration ? Math.round(response.duration) : undefined
        };
      } catch (err: any) {
        console.error('[AiService] Groq Whisper transcription error:', err);
        throw new Error(`Groq Whisper transcription failed: ${err.message || err}`);
      }
    }

    // 2. If no audio file path provided, check whether demo mode is explicitly enabled
    if (config.DEMO_MODE) {
      console.warn('[AiService] Using seeded demo transcript because DEMO_MODE=true is enabled.');
      return {
        fullText:
          'Alex Rivera opened the session reviewing WebRTC connection stats, noting a 35% latency drop after optimizing ICE candidate gathering. Sarah Chen confirmed the database migration is complete and all query performance indexes are verified. Priya Patel emphasized that the OAuth 2.0 refresh token rotation policy must be finalized and reviewed by Friday. Marcus Vance stated he will update the Helm charts and deploy the canary build to staging tomorrow morning. Finally, Alex confirmed that release v1.2 code freeze is set for next Tuesday at 5 PM.',
        entries: [
          {
            speakerName: 'Alex Rivera (Host)',
            timestamp: '00:15',
            text: 'Good morning everyone, lets review our real-time infrastructure benchmarks and sprint deliverables.',
            confidence: 0.99
          },
          {
            speakerName: 'Sarah Chen',
            timestamp: '04:12',
            text: 'The database collections are completely indexed in MongoDB and our read latencies are under 15 milliseconds.',
            confidence: 0.97
          },
          {
            speakerName: 'Priya Patel',
            timestamp: '08:30',
            text: 'We must finalize the OAuth 2.0 refresh token rotation policy and security review by this Friday.',
            confidence: 0.98
          },
          {
            speakerName: 'Marcus Vance',
            timestamp: '12:45',
            text: 'I will update the Helm charts and deploy the canary build to staging tomorrow morning at 10 AM.',
            confidence: 0.99
          }
        ],
        isDemoMode: true,
        modelUsed: 'Deterministic Demo Seed',
        provider: 'demo'
      };
    }

    throw new Error(
      'No audio file provided for transcription. Please upload a meeting audio file (.webm, .wav, .mp3, etc.) or record a meeting.'
    );
  }

  /**
   * Generate genuine executive summary, key points, decisions, and follow-up suggestions using Google Gemini
   */
  static async generateSummary(transcriptText: string): Promise<SummaryResult> {
    if (!transcriptText || !transcriptText.trim()) {
      throw new Error('Cannot generate summary: Meeting transcript is empty.');
    }

    // 1. Real Google Gemini generation
    if (config.isGeminiConfigured) {
      try {
        const gemini = this.getGemini();

        const prompt = `You are an expert enterprise meeting intelligence assistant.
Analyze the following meeting transcript thoroughly and generate a comprehensive executive summary in strictly valid JSON format.

Required JSON Schema:
{
  "summary": "Concise 2-3 paragraph executive summary synthesizing the session context, outcomes, and progress.",
  "keyPoints": ["4-6 specific, factual bullet points detailing key topics discussed"],
  "decisions": ["2-5 concrete, actionable decisions agreed upon by participants"],
  "topicsCovered": ["3-5 high-level categorical tags, e.g. 'WebRTC Performance', 'Infrastructure', 'Security Compliance'"],
  "followUpSuggestions": ["3-5 proactive follow-up recommendations to ensure project success and mitigate risks"],
  "sentiment": "positive" | "neutral" | "constructive" | "mixed"
}

Meeting Transcript:
"""
${transcriptText}
"""

Rules:
- Respond ONLY with valid, parseable JSON conforming to the schema above.
- Do not invent facts, metrics, or attendees not mentioned or implied in the transcript.
- Sentiment must be strictly one of: "positive", "neutral", "constructive", "mixed".`;

        const response = await gemini.models.generateContent({
          model: config.GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text || '';
        let parsed: any;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          // If markdown fences were included, strip them
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        return {
          summary: parsed.summary || 'Summary generated by Google Gemini.',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
          topicsCovered: Array.isArray(parsed.topicsCovered) ? parsed.topicsCovered : ['Architecture', 'Engineering'],
          followUpSuggestions: Array.isArray(parsed.followUpSuggestions) ? parsed.followUpSuggestions : [],
          sentiment: ['positive', 'neutral', 'constructive', 'mixed'].includes(parsed.sentiment)
            ? parsed.sentiment
            : 'constructive',
          isDemoMode: false,
          modelUsed: `Google Gemini (${config.GEMINI_MODEL})`,
          provider: 'gemini'
        };
      } catch (err: any) {
        console.error('[AiService] Google Gemini summarization error:', err);
        throw new Error(`Google Gemini summary generation failed: ${err.message || err}`);
      }
    }

    // 2. Demo mode fallback only if explicitly enabled
    if (config.DEMO_MODE) {
      console.warn('[AiService] Returning seeded summary because DEMO_MODE=true is enabled.');
      return {
        summary:
          'The engineering sync reviewed significant performance gains in WebRTC signaling latency, successful completion of database migration with validated indexing, and key upcoming release milestones. Security standards around token rotation were agreed upon, with canary deployment via Helm scheduled for staging tomorrow.',
        keyPoints: [
          'WebRTC signaling and ICE candidate optimization resulted in a 35% latency reduction across multi-peer meshes.',
          'Database transition to MongoDB confirmed stable with sub-15ms query latencies under load.',
          'OAuth 2.0 refresh token rotation policy undergoing final security review prior to Friday.',
          'Canary staging deployment prepared using updated Helm charts and Kubernetes ingress.'
        ],
        decisions: [
          'Approved deployment of the staging canary build tomorrow morning at 10:00 AM.',
          'Finalized release v1.2 code freeze date for next Tuesday at 5:00 PM.',
          'Adopted mandatory token rotation standard for all enterprise API sessions.'
        ],
        topicsCovered: ['Real-time WebRTC Performance', 'Database Verification', 'Authentication Security', 'Release Timeline'],
        followUpSuggestions: [
          'Monitor staging canary error rates and latency histograms for 24 hours post-deployment.',
          'Conduct security audit on refresh token rotation edge cases before v1.2 code freeze.'
        ],
        sentiment: 'constructive',
        isDemoMode: true,
        modelUsed: 'Demo Mode Engine',
        provider: 'demo'
      };
    }

    throw new Error(
      'GEMINI_API_KEY is not configured in .env. Please configure GEMINI_API_KEY to generate real AI meeting summaries.'
    );
  }

  /**
   * Extract concrete, actionable tasks from meeting transcript using Google Gemini
   */
  static async extractActionItems(transcriptText: string): Promise<ActionItemResult> {
    if (!transcriptText || !transcriptText.trim()) {
      throw new Error('Cannot extract action items: Meeting transcript is empty.');
    }

    // 1. Real Google Gemini action item extraction
    if (config.isGeminiConfigured) {
      try {
        const gemini = this.getGemini();

        const prompt = `You are an expert enterprise project manager.
Analyze the following meeting transcript and extract all concrete action items, deliverables, and tasks with strict traceability back to the transcript speech.

Required JSON Schema:
{
  "actionItems": [
    {
      "task": "Concise, actionable task title starting with an imperative verb (e.g. 'Deploy canary build to staging')",
      "description": "Specific context, requirements, acceptance criteria, or technical details mentioned in the meeting",
      "assigneeName": "Full name of the designated owner if mentioned in the transcript, otherwise null",
      "priority": "low" | "medium" | "high" | "urgent",
      "dueDate": "ISO 8601 date string (YYYY-MM-DD) if a deadline was mentioned or implied, otherwise null",
      "sourceQuote": "Direct quote from the transcript showing where this task was agreed upon or assigned",
      "timestamp": "Timestamp string if present in transcript (e.g. '12:45'), otherwise null",
      "speaker": "Name of the speaker who committed to or requested this task, otherwise null"
    }
  ]
}

Meeting Transcript:
"""
${transcriptText}
"""

Rules:
- Output strictly valid JSON conforming to the schema above.
- Only extract tasks explicitly discussed or committed to. Do not invent tasks out of thin air.
- Priority must strictly be one of: "low", "medium", "high", "urgent".
- Ground each task in its verifiable "sourceQuote" and "timestamp" for full auditability.`;

        const response = await gemini.models.generateContent({
          model: config.GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text || '';
        let parsed: any;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        const items: ExtractedActionItem[] = Array.isArray(parsed.actionItems)
          ? parsed.actionItems.map((item: any) => ({
              task: item.task ? String(item.task).trim() : 'Follow up on discussion item',
              description: item.description ? String(item.description).trim() : '',
              assigneeName: item.assigneeName ? String(item.assigneeName).trim() : null,
              priority: ['low', 'medium', 'high', 'urgent'].includes(item.priority) ? item.priority : 'medium',
              dueDate: item.dueDate ? String(item.dueDate).trim() : null,
              sourceQuote: item.sourceQuote ? String(item.sourceQuote).trim() : null,
              timestamp: item.timestamp ? String(item.timestamp).trim() : null,
              speaker: item.speaker ? String(item.speaker).trim() : null
            }))
          : [];

        return {
          actionItems: items,
          isDemoMode: false,
          modelUsed: `Google Gemini (${config.GEMINI_MODEL})`,
          provider: 'gemini'
        };
      } catch (err: any) {
        console.error('[AiService] Google Gemini action items extraction error:', err);
        throw new Error(`Google Gemini action item extraction failed: ${err.message || err}`);
      }
    }

    // 2. Demo mode fallback only if explicitly enabled
    if (config.DEMO_MODE) {
      console.warn('[AiService] Returning seeded action items because DEMO_MODE=true is enabled.');
      return {
        actionItems: [
          {
            task: 'Update Helm charts and trigger canary deployment to staging',
            description: 'Deploy the latest container images to staging cluster and monitor error rates.',
            assigneeName: 'Marcus Vance',
            priority: 'high',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            sourceQuote: 'I will update the Helm charts and deploy the canary build to staging tomorrow morning at 10 AM.',
            timestamp: '12:45',
            speaker: 'Marcus Vance'
          },
          {
            task: 'Finalize OAuth 2.0 refresh token rotation policy',
            description: 'Complete security review and merge token rotation middleware.',
            assigneeName: 'Priya Patel',
            priority: 'urgent',
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            sourceQuote: 'We must finalize the OAuth 2.0 refresh token rotation policy and security review by this Friday.',
            timestamp: '08:30',
            speaker: 'Priya Patel'
          },
          {
            task: 'Enforce v1.2 code freeze and tag release candidate',
            description: 'Block non-critical pull requests and prepare release notes.',
            assigneeName: 'Alex Rivera',
            priority: 'medium',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            sourceQuote: 'Alex confirmed that release v1.2 code freeze is set for next Tuesday at 5 PM.',
            timestamp: '00:15',
            speaker: 'Alex Rivera (Host)'
          }
        ],
        isDemoMode: true,
        modelUsed: 'Demo Mode Fallback',
        provider: 'demo'
      };
    }

    throw new Error(
      'GEMINI_API_KEY is not configured in .env. Please configure GEMINI_API_KEY to extract real AI action items.'
    );
  }
}
