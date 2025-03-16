import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import {ChatOpenAI} from "@langchain/openai";
import performResearch from "./performResearch.ts";
import parseResearchPlan from "./parseResearchPlan.ts";
import logger from "../../utils/logger.ts";
import configs, {SYNTHESIS_PROMPT, TASK_ANALYSIS_PROMPT} from "../../../configs/configs.ts";
import BrowserTools from "./browserTools.ts";

export default async function initializeAgent() {
	const browserTool = new BrowserTools();

	const analyzerModel = new ChatOpenAI({
		temperature: configs.openai.temperature,
		modelName: configs.openai.model,
		streaming: configs.openai.streaming,
	});

	const researchModel = new ChatOpenAI({
		temperature: configs.openai.temperature,
		modelName: configs.openai.model,
		streaming: configs.openai.streaming,
	});

	return {
		run: async (input: string) => {
			try {
				// 1. Task Analysis
				logger.info('Analyzing task and creating research plan...');
				const analysis = await analyzerModel.call([
					new SystemMessage("**Detect and anwer the following user language**"),
					new SystemMessage(TASK_ANALYSIS_PROMPT),
					new HumanMessage(input)
				]);
				logger.info("analysis", analysis.content)
				// 2. Extract research topics
				const researchPlan = parseResearchPlan(analysis.content.toString());
				logger.info('Research plan created:', researchPlan);

				// 3. Perform research for each topic
				logger.info('Starting research phase...');
				const researchResults = await performResearch(browserTool,researchPlan.topics);

				// 4. Synthesize research findings
				logger.info('Synthesizing research findings...');
				const synthesis = await researchModel.call([
					new SystemMessage("**Detect and anwer the following user language**"),
					new SystemMessage(SYNTHESIS_PROMPT),
					new HumanMessage(JSON.stringify(researchResults))
				]);

				// 5. Generate final response
				const finalResponse = await analyzerModel.call([
					new SystemMessage("**Detect and anwer the following user language**"),
					new SystemMessage(input),
					new HumanMessage(synthesis.content.toString()),
				]);

				return finalResponse.content;

			} catch (error) {
				logger.error('Error during task execution:', error);
				throw error;
			}
		},
		cleanup: async () => await browserTool.shutdown()
	};
}
