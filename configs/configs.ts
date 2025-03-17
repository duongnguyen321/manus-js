// configs/config.ts
import { env } from 'bun';

const configs = {
	// OpenAI Configuration
	openai: {
		apiKey: env?.OPENAI_API_KEY,
		apiBaseUrl: env?.OPENAI_API_URL || 'https://api.openai.com/v1',
		model: env?.OPENAI_MODEL || 'gpt-4o',
		temperature: env?.OPENAI_TEMPERATURE ? Number(env.OPENAI_TEMPERATURE) : 0.7,
		streaming: env?.IS_STREAMING === 'true',
	},

	// OpenRouter Configuration
	openrouter: {
		apiKey: env?.OPENROUTER_API_KEY,
		apiBaseUrl: env?.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
		model: env?.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free',
		temperature: env?.OPENROUTER_TEMPERATURE ? Number(env.OPENROUTER_TEMPERATURE) : 0.7,
		streaming: env?.IS_STREAMING === 'true',
	},

	// Browser Configuration
	browser: {
		limit: env?.BROWSER_LIMIT ? Number(env.BROWSER_LIMIT) : 5,
		headless: env?.BROWSER_HEADLESS === 'true',
		timeout: env?.BROWSER_TIMEOUT ? Number(env.BROWSER_TIMEOUT) : 10000,
		defaultViewport: { width: 1920, height: 1080 },
	},

	// Agent Configuration
	agent: {
		maxIterations: env?.AGENT_MAX_ITERATIONS ? Number(env.AGENT_MAX_ITERATIONS) : 3,
		verbose: env?.AGENT_VERBOSE === 'true',
	},

};

export default configs;

export const TASK_ANALYSIS_PROMPT = `
Detect and anwer the following user language

You are a task analysis and research planning AI. Your role is to:

1. Analyze the given task to identify user intent and needs.
2. Break the task into subtasks requiring web research.
3. Create precise research queries for each subtask.
4. Recommend the best target sites (limited to 1-2 per subtask) for research.
5. Deliver a plan for executing the task based on research outcomes.

Task: {input}

Provide your analysis in the following format:
- Task Overview: [Brief description of the overall task]

- Research Requirements:
  * [List each specific website or source that needs to be researched]
  * [Include exact URLs when possible]
  * [Specify search queries for each research point]

- Research Topics:
[List key resources/sites, ensuring no more than 1-2 per topic.]

  1. [Topic 1]
     - Search Query: [Specific search term]
     - Target Sites: [Specific sites to check must include domain]
     - Information to Extract: [What specific info to look for]
  
  2. [Topic 2]
     - Search Query: [Specific search term]
     - Target Sites: [Specific sites to check must include domain]
     - Information to Extract: [What specific info to look for]

- Execution Plan:
  1. [Step-by-step plan incorporating research findings]
  2. [How to use the researched information]
  3. [Final deliverable format]

Note: Each research topic must include specific search queries and target websites.
Ensure research aligns closely with the user's intent and context`;

export const SYNTHESIS_PROMPT = `
Detect and respond in the user's language.

You are a research synthesizer. Your task is to:

1. Combine research findings into actionable insights.
2. Identify trends, gaps, and inconsistencies within the data.
3. Formulate clear and concise recommendations for next steps.

Research Findings: {findings}

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

export const SUMMA_PROMPT = `
      The following text is too long for processing. Please summarize it into a clear, concise version that is within 5000 characters, retaining all key details and important points:

      --- START OF LONG CONTENT ---
      {content}
      --- END OF LONG CONTENT ---

      Summarized Content:
    `;
