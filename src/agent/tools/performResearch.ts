import {sleep} from "bun";
import configs from "../../../configs/configs.ts";
import logger from "../../utils/logger.ts";
import BrowserTools from "./browserTools.ts";

const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[$@!$&'()*+,;=]*)?$/;

// Helper function for individual site requests with delay
async function fetchSite(browserTool: BrowserTools, name: string, site: string, searchQuery: string) {
	try {
		let siteUrl;
		if (domainRegex.test(site)) {
			// If it's a valid domain without protocol, add https://
			siteUrl = site.startsWith('http') ? site : `https://${site}`;
			logger.info(`Accessing site directly: ${siteUrl}`);
		} else {
			// Fallback to Google search if not a valid domain
			siteUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
			logger.info(`Searching on Google for: ${siteUrl}`);
		}

		const siteResult = await browserTool.call(siteUrl);

		return {
			topic: name,
			source: site,
			content: siteResult
		};
	} catch (error: any) {
		logger.error(`Error accessing ${site}:`, error);
		return {
			topic: name,
			source: site,
			content: `Error accessing ${site}: ${error.message}`
		};
	}
}

// Helper to ensure browser is initialized only once
async function ensureBrowserInitialized(browserTool: BrowserTools): Promise<void> {
	if (!browserTool.browser) {
		// Force browser initialization by making a simple call
		try {
			logger.info("Initializing browser instance...");
			await browserTool.initial("https://duonguyen.site/blogs/manus-js-tro-ly-nghien-cuu-web-thong-minh-duoc-ho-tro-boi-ai");
			logger.info("Browser initialized successfully");
		} catch (error) {
			logger.error("Failed to initialize browser:", error);
			throw new Error("Browser initialization failed");
		}
	}
}


// Function to create a delay between batches
export default async function performResearch(browserTool: BrowserTools, topics: any) {
	await ensureBrowserInitialized(browserTool)
	// Collect all site requests across all topics
	const allRequests = [];

	for (const topic of topics) {
		const {name, searchQuery, targetSites} = topic;
		if (!targetSites || !targetSites.length) continue;

		// Add each site request to our collection
		for (const site of targetSites) {
			allRequests.push({name, site, searchQuery});
		}
	}

	// Process in batches to avoid overwhelming the browser or getting rate-limited
	const BATCH_SIZE = configs.browser.batch; // Adjust based on your needs
	const results = [];

	for (let i = 0; i < allRequests.length; i += BATCH_SIZE) {
		const batch = allRequests.slice(i, i + BATCH_SIZE);

		// Process this batch concurrently
		const batchPromises = batch.map(({name, site, searchQuery}) =>
			fetchSite(browserTool, name, site, searchQuery)
		);

		// Wait for all requests in this batch to complete
		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);

		// Add delay between batches
		if (i + BATCH_SIZE < allRequests.length) {
			await sleep(2000 + Math.random() * 1000);
		}
	}

	return results;
}
