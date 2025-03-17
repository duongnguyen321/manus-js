import { OpenAI } from 'openai';
import performResearch from './performResearch.ts';
import parseResearchPlan from './parseResearchPlan.ts';
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
	});

	// Best latency model from now.
	const modelName = configs.openrouter.model || 'google/gemini-2.0-flash-lite-preview-02-05:free';

	return {
		run: async (input: string) => {
			try {
				// 1. Task Analysis
				logger.info('Analyzing task and creating research plan...');
				const analysisResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{ role: 'system', content: 'Detect and answer the following user language' },
						{ role: 'system', content: TASK_ANALYSIS_PROMPT },
						{ role: 'user', content: input },
					],
					temperature: configs.openrouter.temperature,
				});
				const analysis = analysisResponse.choices[0]?.message?.content || '';
				logger.info('Analysis result:', analysis);

				// 2. Extract research topics
				const researchPlan = parseResearchPlan(analysis);
				logger.info('Research plan created:', researchPlan);

				// 3. Perform research for each topic
				logger.info('Starting research phase...');
				const researchResults = await performResearch(
					browserTool,
					researchPlan.topics
				);

				// 4. Synthesize research findings
				logger.info('Synthesizing research findings...');
				const synthesisResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{ role: 'system', content: 'Detect and answer the following user language' },
						{ role: 'system', content: SYNTHESIS_PROMPT },
						{ role: 'user', content: JSON.stringify(researchResults) },
					],
					temperature: configs.openrouter.temperature,
				});
				
				const synthesis = synthesisResponse.choices[0]?.message?.content || '';

				// 5. Generate final response
				const finalResponse = await openai.chat.completions.create({
					model: modelName,
					messages: [
						{ role: 'system', content: 'Detect and answer the following user language' },
						{ role: 'system', content: input },
						{ role: 'user', content: synthesis },
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
