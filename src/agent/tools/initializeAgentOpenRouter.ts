import {OpenAI} from 'openai';
import performResearch from './performResearch.ts';
import logger from '../../utils/logger.ts';
import configs, {
	SYNTHESIS_PROMPT,
	TASK_ANALYSIS_PROMPT,
} from '../../../configs/configs.ts';
import BrowserTools from './browserTools.ts';

export default async function initializeAgentOpenRouter() {
	const browserTool = new BrowserTools();

	// Can't using langchain/openai because OpenRouter is not supported yet
	const openai = new OpenAI({
		apiKey: configs.openrouter.apiKey,
		baseURL: configs.openrouter.apiBaseUrl,
		dangerouslyAllowBrowser: true,
	});

	// Best latency model from now.
	const modelName = configs.openrouter.model || 'openai/gpt-4o';

	return {
		run: async (input: string) => {
			try {
				// 1. Task Analysis
				logger.info('Analyzing task and creating research plan...');
				const analysisResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{role: 'system', content: 'Detect and answer the following user language'},
						{role: 'system', content: TASK_ANALYSIS_PROMPT(input)},
					],
					temperature: configs.openrouter.temperature,
				});
				const analysis = analysisResponse.choices[0]?.message?.content || '';
				logger.info('Analysis result:', analysis);

				let researchPlan = []
				const analyticsContent = analysis.toString()

				try {
					// First try to extract JSON from markdown code block if present
					const jsonMatch = analyticsContent.match(/```json\n([\s\S]*?)\n```/);

					if (jsonMatch && jsonMatch[1]) {
						// Case 1: Parse JSON content inside the code block
						researchPlan = JSON.parse(jsonMatch[1]);
					} else {
						// Case 2: Try parsing the content directly as JSON
						researchPlan = JSON.parse(analyticsContent);
					}
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

				console.log('researchResults: ', researchResults)
				// 4. Synthesize research findings
				logger.info('Synthesizing research findings...');
				const synthesisResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{role: 'system', content: 'Detect and answer the following user language'},
						{role: 'system', content: SYNTHESIS_PROMPT(JSON.stringify(researchResults))},
					],
					temperature: configs.openrouter.temperature,
				});

				const synthesis = synthesisResponse.choices[0]?.message?.content || '';

				// 5. Generate final response
				const finalResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{role: 'system', content: 'Detect and answer the following user language'},
						{role: 'system', content: synthesis},
						{role: 'user', content: input},
					],
					temperature: configs.openrouter.temperature,
				});

				return finalResponse.choices[0]?.message?.content || '';
			} catch (error) {
				logger.error('Error during task execution:', error);
				throw error;
			} finally {
				await browserTool.shutdown();
			}
		},
		cleanup: async () => await browserTool.shutdown(),
	};
}
