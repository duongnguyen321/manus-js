// src/test.ts
import initializeAgent from './agent';

async function test() {
	const executor = await initializeAgent();

	try {
		const result = await executor.run('Research page https://duonguyen.site');
		console.log('Result:', result);
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await executor.cleanup();
	}
}

test();
