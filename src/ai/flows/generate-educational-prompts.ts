'use server';
/**
 * @fileOverview A Genkit flow for generating concise, engaging science or math facts and questions.
 *
 * - generateEducationalPrompt - A function that handles the generation of educational prompts.
 * - GenerateEducationalPromptInput - The input type for the generateEducationalPrompt function.
 * - GenerateEducationalPromptOutput - The return type for the generateEducationalPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateEducationalPromptInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate an educational fact or question.').min(1, 'Topic cannot be empty.'),
  type: z.enum(['fact', 'question', 'both']).default('both').describe('Whether to generate a fact, a question, or both.'),
});
export type GenerateEducationalPromptInput = z.infer<typeof GenerateEducationalPromptInputSchema>;

const GenerateEducationalPromptOutputSchema = z.object({
  category: z.enum(['Science', 'Math']).describe('The category of the generated educational content (Science or Math).'),
  content: z.string().describe('The generated concise and engaging educational fact or question.'),
});
export type GenerateEducationalPromptOutput = z.infer<typeof GenerateEducationalPromptOutputSchema>;

export async function generateEducationalPrompt(input: GenerateEducationalPromptInput): Promise<GenerateEducationalPromptOutput> {
  return generateEducationalPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEducationalPromptPrompt',
  input: { schema: GenerateEducationalPromptInputSchema },
  output: { schema: GenerateEducationalPromptOutputSchema },
  prompt: `You are an expert educator specialized in creating concise and engaging science or math content for digital signage.

Generate a single educational piece of content (either a fact or a question) based on the provided topic. The content should be brief (ideally under 150 characters) and designed to spark curiosity or provide a quick learning point.

Based on the topic, determine if the content falls under 'Science' or 'Math'.

If the user specifies 'fact', generate a fact. If 'question', generate a question. If 'both' or not specified, choose the most appropriate format for the topic.

Topic: {{{topic}}}
Desired Type: {{{type}}}`,
});

const generateEducationalPromptFlow = ai.defineFlow(
  {
    name: 'generateEducationalPromptFlow',
    inputSchema: GenerateEducationalPromptInputSchema,
    outputSchema: GenerateEducationalPromptOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate educational prompt content.');
    }
    return output;
  }
);
