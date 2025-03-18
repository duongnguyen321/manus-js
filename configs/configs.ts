// configs/config.ts
import {env} from 'bun';

const configs = {
	// OpenAI Configuration
	openai: {
		apiKey: env?.OPENAI_API_KEY,
		apiBaseUrl: env?.OPENAI_API_URL || 'https://api.openai.com/v1',
		model: env?.OPENAI_MODEL || 'gpt-4o',
		streaming: env?.IS_STREAMING === 'true',
	},

	// OpenRouter Configuration
	openrouter: {
		apiKey: env?.OPENROUTER_API_KEY,
		apiBaseUrl: env?.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
		model: env?.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free',
		streaming: env?.IS_STREAMING === 'true',
	},

	// Browser Configuration
	browser: {
		limit: env?.BROWSER_LIMIT ? Number(env.BROWSER_LIMIT) : 5,
		batch: env?.BROWSER_BATCH ? Number(env.BROWSER_BATCH) : 3,
		headless: env?.BROWSER_HEADLESS === 'true',
		timeout: env?.BROWSER_TIMEOUT ? Number(env.BROWSER_TIMEOUT) : 10000,
		defaultViewport: {width: 1920, height: 1080},
	},

	// Agent Configuration
	agent: {
		maxIterations: env?.AGENT_MAX_ITERATIONS ? Number(env.AGENT_MAX_ITERATIONS) : 3,
		verbose: env?.AGENT_VERBOSE === 'true',
	},

};

export default configs;

export const TASK_ANALYSIS_PROMPT = (input: string) => `
You are a task analysis and research planning AI. Your role is to:

1. Analyze the given task to identify user intent and needs.
2. Break the task into subtasks with optional have web research.
3. Create precise research queries for each subtask.
4. Recommend the best target sites (limited to 1-2 per subtask) for research. (Optional)
5. Deliver a plan for executing the task based on research outcomes.

Important:
Always include specific search queries for each topic, even if they must be generated from context
Always recommend relevant target websites in the format "domain.com/path" (without http/https)
If exact sites aren't obvious, suggest industry-standard resources or authoritative sites in the relevant field
Ensure all research components directly address the user's intent and needs
RETURNED VALID JSON parse

Task: ${input}

Returned format is JSON ARRAY must follow this format, without any tag markdown or XML:
[
	{
	  "name": Title of task,
	  "searchQuery": Detail and search query of task,
	  "targetSites": [
	    domain with path
	  ]
	},
	{
	  "name": Title of task,
	  "searchQuery": Detail and search query of task,
	  "targetSites": [
	    domain with path, without protocol
	  ]
	}
]
`;

export const SYNTHESIS_PROMPT = (findings: string) => `
Detect and respond in the user's language.

You are a research synthesizer. Your task is to:

1. Combine research findings into actionable insights.
2. Identify trends, gaps, and inconsistencies within the data.
3. Formulate clear and concise recommendations for next steps.

Research Findings: ${findings}

Provide synthesis in the following format:

1. Key Insights:
   - Primary Findings: Summarize main conclusions from the research.
   - Common Patterns: Highlight recurring themes or trends across data.
   - Unique Discoveries: Note any outliers or unexpected findings.

2. Gaps Analysis:
   - Missing Information: Identify critical unanswered questions.
   - Conflicting Data: Highlight inconsistencies or disputes in findings.
   - Areas Needing Clarification: Point out areas requiring further research.

3. Recommendations:
   - Immediate Actions: What practical steps should the user take first?
   - Further Research Needed: Outline any additional research.
   - Implementation Steps: Specific actions derived from findings.

4. Final Summary:
   [Comprehensive summary of all findings and next steps]`;

export const SUMMA_PROMPT = (content: string) => `
Summarize that, retaining all key details and important points:
--- START OF LONG CONTENT ---
${content}
--- END OF LONG CONTENT ---
`;
