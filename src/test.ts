// src/test.ts
import initializeAgent from './agent';

async function test() {
	const executor = await initializeAgent();

	try {
		const result = await executor.run('Make a plan trip to Sapa, 7days, max budget is 5K dollar USD');
		console.log('Result:', result);
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await executor.cleanup();
	}
}

test();
