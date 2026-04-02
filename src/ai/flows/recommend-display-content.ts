'use server';
/**
 * @fileOverview Provides an AI-powered tool to recommend digital signage content.
 *
 * - recommendDisplayContent - A function that generates content recommendations based on display context and audience engagement.
 * - RecommendDisplayContentInput - The input type for the recommendDisplayContent function.
 * - RecommendDisplayContentOutput - The return type for the recommendDisplayContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Zod schema for the input of the content recommendation flow.
 * It includes display context, audience engagement, and available content information.
 */
const RecommendDisplayContentInputSchema = z.object({
  timeOfDay:
    z.string().describe('The current time of day (e.g., "morning", "afternoon", "evening", "lunch_break").'),
  location:
    z.string().describe('The physical location of the digital display (e.g., "main_hall", "cafeteria", "library_entrance").'),
  audienceEngagementPatterns:
    z.string().describe('Observed audience engagement patterns, such as "high_traffic_morning_students_scan_QR", "low_engagement_with_long_videos", or "high_engagement_with_interactive_quizzes".'),
  availableContentSummary:
    z.string().describe('A summary or list of available content items and playlists that can be recommended. E.g., "playlist: MorningNews, playlist: CampusEvents, item: Quiz_Math_Facts, item: Science_Fact_of_Day, item: WeatherUpdate".'),
  currentDisplayScheduleSummary:
    z.string().optional().describe('An optional summary of what is currently scheduled to be displayed, to help avoid redundant suggestions or suggest improvements. E.g., "Currently showing MorningNews playlist for 30 minutes".'),
});

/**
 * Type definition for the input of the content recommendation flow.
 */
export type RecommendDisplayContentInput = z.infer<typeof RecommendDisplayContentInputSchema>;

/**
 * Zod schema for the output of the content recommendation flow.
 * It includes recommended content IDs/names, reasoning, and optional optimization tips.
 */
const RecommendDisplayContentOutputSchema = z.object({
  recommendedContentIds:
    z.array(z.string()).describe('An array of IDs or names of specific content items or playlists recommended for display.'),
  reasoning:
    z.string().describe('A detailed explanation of why these specific content items or playlists were recommended based on the provided context and engagement patterns.'),
  optimizationTips:
    z.string().optional().describe('Optional general tips or strategies for optimizing content delivery and audience engagement based on the observed patterns.'),
});

/**
 * Type definition for the output of the content recommendation flow.
 */
export type RecommendDisplayContentOutput = z.infer<typeof RecommendDisplayContentOutputSchema>;

/**
 * Defines a Genkit prompt for recommending digital signage content.
 * The prompt instructs the LLM to act as a content strategist and provide
 * recommendations, reasoning, and optimization tips based on the input context.
 */
const recommendDisplayContentPrompt = ai.definePrompt({
  name: 'recommendDisplayContentPrompt',
  input: {schema: RecommendDisplayContentInputSchema},
  output: {schema: RecommendDisplayContentOutputSchema},
  prompt: `You are an expert digital signage content strategist. Your goal is to provide optimal content recommendations based on the display context and audience engagement patterns.

Consider the following information:

Current Time of Day: {{{timeOfDay}}}
Display Location: {{{location}}}
Audience Engagement Patterns: {{{audienceEngagementPatterns}}}
Available Content and Playlists (IDs/Names): {{{availableContentSummary}}}

{{#if currentDisplayScheduleSummary}}
Current Display Schedule: {{{currentDisplayScheduleSummary}}}
{{/if}}

Based on this, recommend content items or playlists from the 'Available Content and Playlists' that would maximize impact and engagement. Provide a detailed reasoning for each recommendation and optional general optimization tips.

The output must be a JSON object strictly conforming to the following schema:
{{jsonSchema output}}`,
});

/**
 * Defines a Genkit flow for recommending digital signage content.
 * This flow takes contextual information and engagement patterns as input
 * and uses an AI model to suggest suitable content or playlists.
 */
const recommendDisplayContentFlow = ai.defineFlow(
  {
    name: 'recommendDisplayContentFlow',
    inputSchema: RecommendDisplayContentInputSchema,
    outputSchema: RecommendDisplayContentOutputSchema,
  },
  async input => {
    const {output} = await recommendDisplayContentPrompt(input);
    return output!;
  },
);

/**
 * Wrapper function to execute the Genkit flow for recommending digital signage content.
 * @param input The input object containing display context, audience engagement, and available content.
 * @returns A promise that resolves to the recommended content output.
 */
export async function recommendDisplayContent(
  input: RecommendDisplayContentInput,
): Promise<RecommendDisplayContentOutput> {
  return recommendDisplayContentFlow(input);
}
