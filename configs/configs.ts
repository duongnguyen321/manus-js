// configs/config.ts
import {env} from 'bun';

const configs = {
	openai: {
		apiKey: env.OPENAI_API_KEY,
		modelUrl: env.MODEL_URL || 'https://api.openai.com/v1',
		model: env.OPENAI_MODEL || 'gpt-4o',
		temperature: Number(env.OPENAI_TEMPERATURE) || 0.7,
		streaming: env.IS_STREAMING === 'true' || true,
	},
	browser: {
		limit: Number(env.BROWSER_LIMIT) || 5,
		headless: env.BROWSER_HEADLESS === 'true',
		timeout: Number(env.BROWSER_TIMEOUT) || 10000,
		defaultViewport: {
			width: 1920,
			height: 1080,
		},
	},
	agent: {
		maxIterations: Number(env.AGENT_MAX_ITERATIONS) || 3,
		verbose: env.AGENT_VERBOSE === 'true',
	},
};

export default configs;

export const TASK_ANALYSIS_PROMPT = `
**Detect and anwer the following user language**

You are a task analysis and research planning AI. Your role is to:
1. Analyze the given task
2. Break it down into subtasks that require web research
3. Create specific research queries for each subtask
4. Plan the execution based on research findings

Task: {input}

Provide your analysis in the following format:
- Task Overview: [Brief description of the overall task]

- Research Requirements:
  * [List each specific website or source that needs to be researched]
  * [Include exact URLs when possible]
  * [Specify search queries for each research point]

- Research Topics:
  1. [Topic 1]
     - Search Query: [Specific search term]
     - Target Sites: [Specific sites to check]
     - Information to Extract: [What specific info to look for]
  
  2. [Topic 2]
     - Search Query: [Specific search term]
     - Target Sites: [Specific sites to check]
     - Information to Extract: [What specific info to look for]

- Execution Plan:
  1. [Step-by-step plan incorporating research findings]
  2. [How to use the researched information]
  3. [Final deliverable format]

Note: Each research topic must include specific search queries and target websites.`;

export const SYNTHESIS_PROMPT = `
**Detect and anwer the following user language**

You are a research synthesizer. Your task is to:
1. Combine all research findings
2. Identify patterns and insights
3. Create actionable conclusions

Research Findings: {findings}

Provide synthesis in the following format:

1. Key Insights:
   - Primary Findings
   - Common Patterns
   - Unique Discoveries

2. Gaps Analysis:
   - Missing Information
   - Conflicting Data
   - Areas Needing Clarification

3. Recommendations:
   - Immediate Actions
   - Further Research Needed
   - Implementation Steps

4. Final Summary:
   [Comprehensive summary of all findings and next steps]`;
