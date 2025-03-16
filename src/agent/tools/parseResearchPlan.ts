import logger from "../../utils/logger.ts";

interface ResearchTopic {
	name: string;
	searchQuery: string;
	targetSites: string[];
}

export default function parseResearchPlan(analysis: string) {
	try {
		const topics: ResearchTopic[] = [];
		const lines = analysis.split('\n');
		let currentTopic: ResearchTopic | null = null;

		// Regular expressions for better matching
		const topicRegex = /^\s*\d+\.\s+(.*?)\s*$/;
		const searchQueryRegex = /^\s*-\s*Search Query:\s*"([^"]+)"/;
		const targetSitesRegex = /^\s*-\s*Target Sites:\s*(.*)/;

		for (const line of lines) {
			// Skip empty lines
			if (!line.trim()) continue;

			// Check for new topic
			const topicMatch = line.match(topicRegex);
			if (topicMatch) {
				if (currentTopic) {
					topics.push(currentTopic);
				}
				currentTopic = {
					name: topicMatch[1]?.trim() ?? '',
					searchQuery: '',
					targetSites: []
				};
				continue;
			}

			if (!currentTopic) continue;

			// Check for search query
			const searchQueryMatch = line.match(searchQueryRegex);
			if (searchQueryMatch?.[1]) {
				currentTopic.searchQuery = searchQueryMatch[1].trim();
				continue;
			}

			// Check for target sites
			const targetSitesMatch = line.match(targetSitesRegex);
			if (targetSitesMatch?.[1]) {
				currentTopic.targetSites = targetSitesMatch[1]
					.split(',')
					.map(site => site
						.trim()
						.replace(/\s*$/, '')
					)
					.filter(Boolean);
			}
		}

		// Don't forget to add the last topic
		if (currentTopic) {
			topics.push(currentTopic);
		}

		logger.debug('Parsed research topics:', topics);
		return {topics};
	} catch (error) {
		logger.error('Error parsing research plan:', error);
		return {topics: []};
	}
}
