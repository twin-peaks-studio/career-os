import Anthropic from '@anthropic-ai/sdk';
import {
  assembleContext,
  formatContextForPrompt,
} from './context-assembler';
import {
  buildUserStylePrompt,
  buildAiOptimizedPrompt,
  buildUserStyleCoverLetterPrompt,
  buildAiOptimizedCoverLetterPrompt,
} from './prompts';
import { createClient } from '@/lib/supabase/server';
import type { OutputType, OutputVariant } from '@/types/supabase';

const MODEL = 'claude-sonnet-4-5-20250929';

interface TailoringRequest {
  sessionId: string;
  userId: string;
  jobDescriptionText: string;
  targetRole: string;
  targetCompany: string;
  generateResume: boolean;
  generateCoverLetter: boolean;
}

interface GeneratedOutput {
  type: OutputType;
  variant: OutputVariant;
  content: string;
  citations: Record<string, string>;
}

/**
 * Parses the model output to extract the tailored content and citations.
 */
function parseModelOutput(
  raw: string,
  outputType: OutputType
): { content: string; citations: Record<string, string> } {
  const tag = outputType === 'resume' ? 'tailored_resume' : 'cover_letter';

  // Extract content between tags
  const contentMatch = raw.match(
    new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)
  );
  const content = contentMatch?.[1]?.trim() ?? raw.trim();

  // Extract citations
  const citationsMatch = raw.match(
    /<citations>([\s\S]*?)<\/citations>/
  );
  const citations: Record<string, string> = {};

  if (citationsMatch?.[1]) {
    const lines = citationsMatch[1].trim().split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim();
      if (cleaned) {
        // Parse "claim → source" or "claim [source: doc]" patterns
        const sourceMatch = cleaned.match(/\[source:\s*(.+?)\]/);
        if (sourceMatch) {
          const claim = cleaned.replace(/\[source:.*?\]/, '').trim();
          citations[claim] = sourceMatch[1].trim();
        } else {
          // Fallback: treat the whole line as a citation entry
          citations[cleaned] = 'source document';
        }
      }
    }
  }

  return { content, citations };
}

/**
 * Calls Claude API with the given prompt and returns the response text.
 */
async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract text from the response
  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

/**
 * Generates a single tailored output (one type + one variant).
 */
async function generateSingleOutput(
  formattedContext: string,
  outputType: OutputType,
  variant: OutputVariant
): Promise<{ content: string; citations: Record<string, string> }> {
  let prompt: string;

  if (outputType === 'resume') {
    prompt =
      variant === 'user_style'
        ? buildUserStylePrompt(formattedContext)
        : buildAiOptimizedPrompt(formattedContext);
  } else {
    prompt =
      variant === 'user_style'
        ? buildUserStyleCoverLetterPrompt(formattedContext)
        : buildAiOptimizedCoverLetterPrompt(formattedContext);
  }

  const raw = await callClaude(prompt);
  return parseModelOutput(raw, outputType);
}

/**
 * Main tailoring engine entry point.
 * Assembles context, generates all requested variants, and saves outputs to the database.
 */
export async function runTailoringSession(
  request: TailoringRequest
): Promise<GeneratedOutput[]> {
  const supabase = await createClient();
  const outputs: GeneratedOutput[] = [];

  try {
    // Update session status to generating
    await supabase
      .from('tailoring_sessions')
      .update({ status: 'generating' })
      .eq('id', request.sessionId);

    // Assemble context from user's documents
    const context = await assembleContext(
      request.userId,
      request.jobDescriptionText,
      request.targetRole,
      request.targetCompany
    );

    if (!context.baselineResume?.content_parsed) {
      throw new Error(
        'No baseline resume found. Please upload a baseline resume before tailoring.'
      );
    }

    const formattedContext = formatContextForPrompt(context);

    // Build list of generation tasks
    const tasks: Array<{ type: OutputType; variant: OutputVariant }> = [];

    if (request.generateResume) {
      tasks.push({ type: 'resume', variant: 'user_style' });
      tasks.push({ type: 'resume', variant: 'ai_optimized' });
    }
    if (request.generateCoverLetter) {
      tasks.push({ type: 'cover_letter', variant: 'user_style' });
      tasks.push({ type: 'cover_letter', variant: 'ai_optimized' });
    }

    // Run generations in parallel (2 variants per type)
    const results = await Promise.all(
      tasks.map(async (task) => {
        const result = await generateSingleOutput(
          formattedContext,
          task.type,
          task.variant
        );
        return { ...task, ...result };
      })
    );

    // Save all outputs to the database
    for (const result of results) {
      const { error } = await supabase.from('tailoring_outputs').insert({
        session_id: request.sessionId,
        user_id: request.userId,
        type: result.type,
        variant: result.variant,
        content: result.content,
        citations: result.citations,
      });

      if (error) {
        console.error(`Failed to save ${result.type}/${result.variant}:`, error);
      }

      outputs.push(result);
    }

    // Update session status to complete
    await supabase
      .from('tailoring_sessions')
      .update({ status: 'complete' })
      .eq('id', request.sessionId);
  } catch (error) {
    // Update session status to failed
    await supabase
      .from('tailoring_sessions')
      .update({ status: 'failed' })
      .eq('id', request.sessionId);

    throw error;
  }

  return outputs;
}
