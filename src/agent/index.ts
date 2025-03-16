// src/agent/index.ts
import logger from "../utils/logger.ts";
import initializeAgent from "./tools/initializeAgent.ts";


// Error handler with improved logging and cleanup
process.on('unhandledRejection', async (error) => {
	logger.error('Unhandled rejection:', error);
	try {
		const agent = await initializeAgent();
		await agent.cleanup();
	} catch (cleanupError) {
		logger.error('Error during cleanup:', cleanupError);
	}
});

export default initializeAgent
