import { createClient } from '@/lib/supabase/server';
import type { Document, DocumentType } from '@/types/supabase';

/**
 * Structured context for the tailoring engine.
 * Contains all relevant user documents organized by type.
 */
export interface TailoringContext {
  baselineResume: Document | null;
  tailoredExamples: Array<{
    tailoredDoc: Document;
    jobDescription: Document;
  }>;
  storyBank: Document[];
  jobDescriptionText: string;
  targetRole: string;
  targetCompany: string;
}

/**
 * Assembles all relevant user documents into a structured context
 * for the tailoring engine to consume.
 */
export async function assembleContext(
  userId: string,
  jobDescriptionText: string,
  targetRole: string,
  targetCompany: string
): Promise<TailoringContext> {
  const supabase = await createClient();

  // Fetch all user documents in one query
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  const docs = (documents ?? []) as Document[];

  // Group by type
  const byType = (type: DocumentType) => docs.filter((d) => d.type === type);

  // Get baseline resume (most recent)
  const baselineResumes = byType('baseline_resume');
  const baselineResume = baselineResumes[0] ?? null;

  // Build paired examples: tailored resume/cover letter + its paired job description
  const tailoredResumes = byType('tailored_resume');
  const tailoredCoverLetters = byType('tailored_cover_letter');
  const jobDescriptions = byType('job_description');

  const tailoredExamples: TailoringContext['tailoredExamples'] = [];

  for (const tailored of [...tailoredResumes, ...tailoredCoverLetters]) {
    if (tailored.pair_id) {
      const paired = jobDescriptions.find((jd) => jd.id === tailored.pair_id);
      if (paired && paired.content_parsed && tailored.content_parsed) {
        tailoredExamples.push({
          tailoredDoc: tailored,
          jobDescription: paired,
        });
      }
    }
  }

  // Get story bank entries
  const storyBank = byType('story_bank').filter((d) => d.content_parsed);

  return {
    baselineResume,
    tailoredExamples,
    storyBank,
    jobDescriptionText,
    targetRole,
    targetCompany,
  };
}

/**
 * Formats the assembled context into a structured text block
 * suitable for inclusion in an LLM prompt.
 */
export function formatContextForPrompt(context: TailoringContext): string {
  const sections: string[] = [];

  // Baseline resume
  if (context.baselineResume?.content_parsed) {
    sections.push(
      `<baseline_resume>\n${context.baselineResume.content_parsed}\n</baseline_resume>`
    );
  }

  // Few-shot examples
  if (context.tailoredExamples.length > 0) {
    const examples = context.tailoredExamples
      .map((ex, i) => {
        const type =
          ex.tailoredDoc.type === 'tailored_resume' ? 'resume' : 'cover letter';
        return `<example_${i + 1}>
<type>${type}</type>
<job_description>
${ex.jobDescription.content_parsed}
</job_description>
<tailored_output>
${ex.tailoredDoc.content_parsed}
</tailored_output>
</example_${i + 1}>`;
      })
      .join('\n\n');

    sections.push(`<tailoring_examples>\n${examples}\n</tailoring_examples>`);
  }

  // Story bank
  if (context.storyBank.length > 0) {
    const stories = context.storyBank
      .map(
        (s) =>
          `<story source="${s.file_name}">\n${s.content_parsed}\n</story>`
      )
      .join('\n\n');

    sections.push(
      `<story_bank>\n${stories}\n</story_bank>`
    );
  }

  // Target job description
  sections.push(
    `<target_job_description>
<role>${context.targetRole}</role>
<company>${context.targetCompany}</company>
<description>
${context.jobDescriptionText}
</description>
</target_job_description>`
  );

  return sections.join('\n\n');
}
