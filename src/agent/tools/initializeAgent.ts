import {OpenAI} from 'openai';
import performResearch from './performResearch.ts';
import logger from '../../utils/logger.ts';
import configs, {
	SYNTHESIS_PROMPT,
	TASK_ANALYSIS_PROMPT,
} from '../../../configs/configs.ts';
import BrowserTools from './browserTools.ts';
import type {ChatCompletionChunk, ChatCompletion} from 'openai/resources/index.mjs';

async function streamOpenAIResponse(
	response: AsyncIterable<ChatCompletionChunk>
): Promise<string> {
	let fullResponse = '';

	for await (const chunk of response) {
		const content = chunk.choices?.[0]?.delta?.content || '';
		if (content) {
			fullResponse += content;
			process.stdout.write(content);
		}
	}

	if (!fullResponse.trim()) {
		throw new Error('Empty response received from OpenAI streaming.');
	}

	return fullResponse;
}

export default async function initializeAgent() {
	const browserTool = new BrowserTools('openrouter');

	const openai = new OpenAI({
		apiKey: configs.openrouter.apiKey,
		baseURL: configs.openrouter.apiBaseUrl,
		dangerouslyAllowBrowser: true,
	});

	const modelName: string = configs.openrouter.model || 'openai/gpt-4o';

	return {
		run: async (input: string) => {
			try {
				// 1. Task Analysis
				logger.info('Analyzing task and creating research plan...');
				const analysisResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{
							role: 'system',
							content: 'Detect and answer the following user language',
						},
						{role: 'system', content: TASK_ANALYSIS_PROMPT(input)},
					],
					stream: configs.openrouter.streaming,
				});

				let analysis: string = '';
				if (configs.openrouter.streaming) {
					analysis = await streamOpenAIResponse(analysisResponse as AsyncIterable<ChatCompletionChunk>);
				} else {
					const _analysis = (analysisResponse as ChatCompletion).choices[0]?.message?.content;
					if (_analysis) analysis = _analysis;
				}
				if (!analysis.trim())
					throw new Error('Failed to generate task analysis.');

				logger.info('Analysis result:', analysis);

				let researchPlan = [];
				try {
					const jsonMatch = analysis.match(/```json\n([\s\S]*?)\n```/);
					researchPlan =
						jsonMatch && jsonMatch[1]
							? JSON.parse(jsonMatch[1])
							: JSON.parse(analysis);
				} catch (error: any) {
					logger.debug('Error parsing researchPlan:', error.message);
				}
				logger.info('Research plan created:', researchPlan);

				// 3. Perform research for each topic
				logger.info('Starting research phase...');
				const researchResults = await performResearch(
					browserTool,
					researchPlan
				);

				// 4. Synthesize research findings
				logger.info('Synthesizing research findings...');
				const synthesisResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{
							role: 'system',
							content: 'Detect and answer the following user language',
						},
						{
							role: 'system',
							content: SYNTHESIS_PROMPT(JSON.stringify(researchResults)),
						},
					],
					stream: configs.openrouter.streaming,
				});

				let synthesis: string = '';
				if (configs.openrouter.streaming) {
					synthesis = await streamOpenAIResponse(synthesisResponse as AsyncIterable<ChatCompletionChunk>);
				} else {
					const _synthesis = (synthesisResponse as ChatCompletion).choices[0]?.message?.content;
					if (_synthesis) synthesis = _synthesis;
				}
				if (!synthesis.trim())
					throw new Error('Failed to synthesize research findings.');

				// 5. Generate final response
				const finalResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{
							role: 'system',
							content: 'Detect and answer the following user language',
						},
						{role: 'system', content: synthesis},
						{role: 'user', content: input},
					],
					stream: configs.openrouter.streaming,
				});
				let final: string = '';
				if (configs.openrouter.streaming) {
					final = await streamOpenAIResponse(finalResponse as AsyncIterable<ChatCompletionChunk>);
				} else {
					const _final = (finalResponse as ChatCompletion).choices[0]?.message?.content;
					if (_final) final = _final;
				}
				return final
			} catch (error) {``
				logger.error('Error during task execution:', error);
				return 'An error occurred while processing your request. Please try again later.';
			} finally {
				await browserTool.shutdown();
			}
		},
		cleanup: async () => await browserTool.shutdown(),
	};
}
