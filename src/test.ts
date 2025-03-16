// src/test.ts
import initializeAgent from './agent';

async function test() {
	const executor = await initializeAgent();

	try {
		const result = await executor.run(
			"Research page https://duonguyen.site/blogs/manus-js-tro-ly-nghien-cuu-web-thong-minh-duoc-ho-tro-boi-ai"
		);
		console.log("Result:", result);
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await executor.cleanup();
	}
}

test();
