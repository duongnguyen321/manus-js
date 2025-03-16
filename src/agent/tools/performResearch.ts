import logger from "../../utils/logger.ts";
import BrowserTools from "./browserTools.ts";

export default async function performResearch(browserTool: BrowserTools, topics: any) {
	const researchResults = [];

	for (const topic of topics) {
		const {name, searchQuery, targetSites} = topic;
		if (!targetSites || !targetSites.length) continue
		// Handle site-specific searches
		if (targetSites && targetSites.length) {
			for (const site of targetSites) {
				// Construct site-specific search query
				const siteSearchQuery = `https://www.google.com/search?q=${site}%20${encodeURIComponent(searchQuery)}`;
				logger.info(`Searching specifically on ${site}: ${siteSearchQuery}`);

				try {
					const siteResult = await browserTool._call(siteSearchQuery);
					researchResults.push({
						topic: name,
						source: site,
						content: siteResult
					});

					// Add delay between searches to avoid rate limiting
					await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
				} catch (error: any) {
					logger.error(`Error searching ${site}:`, error);
					researchResults.push({
						topic: name,
						source: site,
						content: `Error searching ${site}: ${error.message}`
					});
				}
			}
		}
	}

	return researchResults;
}
