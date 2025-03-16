// src/index.ts
import * as readline from 'readline';
import slug from "./src/helpers.ts";
import initializeAgent from './src/agent';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

const history: string[] = [];

async function saveToFile(content: string, directory: string, filename: string) {
	try {
		// Create directory if it doesn't exist
		await fs.mkdir(directory, { recursive: true });

		// Sanitize filename and create full path
		const sanitizedFilename = slug(filename)
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fullPath = path.join(directory, `${sanitizedFilename}_${timestamp}.md`);

		// Save content
		await fs.writeFile(fullPath, content, 'utf-8');
		return fullPath;
	} catch (error) {
		console.error(chalk.red(`Error saving to ${directory}:`), error);
		throw error;
	}
}

async function saveLog(query: string, process: any) {
	const content = `# Query Log
Query: ${query}
Timestamp: ${new Date().toISOString()}

## Process Details
\`\`\`json
${JSON.stringify(process, null, 2)}
\`\`\`
`;
	return await saveToFile(content, './logs', query);
}

async function saveData(query: string, result: any) {
	const content = `# Query Result
Query: ${query}
Timestamp: ${new Date().toISOString()}
${result}
`;
	return await saveToFile(content, './data', query);
}

async function promptUser(rl: readline.Interface): Promise<string> {
	return new Promise((resolve) => {
		rl.question(
			chalk.blue('Enter your search query ') +
			chalk.gray('(or type "exit" to quit, "history" to see past queries):\n> '),
			(answer) => {
				resolve(answer);
			}
		);
	});
}

async function main() {
	console.log(chalk.yellow('Initializing AI agent...'));
	const executor = await initializeAgent();

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	try {
		while (true) {
			const query = await promptUser(rl);

			if (query.toLowerCase() === 'exit') {
				console.log(chalk.yellow('Shutting down...'));
				break;
			}

			if (query.toLowerCase() === 'history') {
				console.log(chalk.cyan('\nSearch History:'));
				if (history.length === 0) {
					console.log(chalk.gray('No searches yet'));
				} else {
					history.forEach((h, i) => console.log(chalk.white(`${i + 1}. ${h}`)));
				}
				console.log('\n-------------------------------------------\n');
				continue;
			}

			const spinner = ora('Searching...').start();

			try {
				// Track process start
				const processStart = {
					timestamp: new Date().toISOString(),
					query,
					status: 'started'
				};

				const result = await executor.run(query);

				// Track process completion
				const processComplete = {
					...processStart,
					status: 'completed',
					completedAt: new Date().toISOString(),
					executionTime: Date.now() - new Date(processStart.timestamp).getTime()
				};

				// Save logs and data
				const logPath = await saveLog(query, processComplete);
				const dataPath = await saveData(query, result);

				spinner.succeed('Search completed');
				console.log(chalk.green('\nResult:'), result);
				console.log(chalk.gray(`\nLog saved to: ${logPath}`));
				console.log(chalk.gray(`Data saved to: ${dataPath}`));

				history.push(query);
			} catch (error) {
				// Save error log
				const processError = {
					timestamp: new Date().toISOString(),
					query,
					status: 'failed',
					error: error instanceof Error ? error.message : String(error)
				};

				await saveLog(query, processError);

				spinner.fail('Search failed');
				console.error(chalk.red('\nError during search:'), error);
			}

			console.log('\n-------------------------------------------\n');
		}
	} catch (error) {
		console.error(chalk.red('Fatal error:'), error);
	} finally {
		rl.close();
		await executor.cleanup();
	}
}

// Error handlers remain the same
process.on('SIGINT', async () => {
	console.log(chalk.yellow('\nReceived SIGINT. Cleaning up...'));
	process.exit(0);
});

process.on('uncaughtException', (error) => {
	console.error(chalk.red('\nUncaught Exception:'), error);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error(chalk.red('\nUnhandled Rejection at:'), promise, chalk.red('\nReason:'), reason);
	process.exit(1);
});

main().catch((error) => {
	console.error(chalk.red('Application Error:'), error);
	process.exit(1);
});
