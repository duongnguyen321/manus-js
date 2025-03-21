// src/index.ts
import * as readline from 'readline';
import slug from './src/helpers.ts';
import initializeAgent from './src/agent';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import initializeAgentLangChain from './src/agent/tools/initializeAgentLangChain.ts';

// Add this function to capture stdout with ANSI code removal
function createOutputCapturer() {
	let captured = '';

	// Create a writable stream that captures output
	const captureStream = new (require('stream').Writable)({
		write(
			chunk: any,
			encoding: BufferEncoding,
			callback: (error?: Error | null) => void
		): void {
			captured += chunk.toString();
			process.stdout.write(chunk, encoding);
			callback();
		},
	});

	// Function to strip ANSI color codes
	const stripAnsi = (str: string): string => {
		// This regex matches all ANSI escape sequences used for colors
		return str.replace(
			/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
			''
		);
	};

	// Save original console methods
	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	const originalConsoleInfo = console.info;
	const originalConsoleWarn = console.warn;

	return {
		start: () => {
			// Override console methods to use our capture stream
			console.log = (...args) => {
				const message = args.map((arg) => String(arg)).join(' ');
				captureStream.write(message + '\n');
			};
			console.error = (...args) => {
				const message = args.map((arg) => String(arg)).join(' ');
				captureStream.write(message + '\n');
			};
			console.info = (...args) => {
				const message = args.map((arg) => String(arg)).join(' ');
				captureStream.write(message + '\n');
			};
			console.warn = (...args) => {
				const message = args.map((arg) => String(arg)).join(' ');
				captureStream.write(message + '\n');
			};
		},
		stop: () => {
			// Restore original console methods
			console.log = originalConsoleLog;
			console.error = originalConsoleError;
			console.info = originalConsoleInfo;
			console.warn = originalConsoleWarn;

			// Strip ANSI codes before returning
			const cleanOutput = stripAnsi(captured);
			captured = '';
			return cleanOutput;
		},
	};
}

let selectedProvider: 'openai' | 'openrouter' | null = null; // Lưu AI provider được chọn
const history: string[] = [];
const historyContext: { role: 'bot' | 'user', content: string }[] = []

async function saveToFile(
	content: string,
	directory: string,
	filename: string
) {
	try {
		await fs.mkdir(directory, {recursive: true});

		const sanitizedFilename = slug(filename);
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fullPath = path.join(
			directory,
			`${sanitizedFilename}_${timestamp}.md`
		);

		await fs.writeFile(fullPath, content, 'utf-8');
		return fullPath;
	} catch (error) {
		console.error(chalk.red(`Error saving to ${directory}:`), error);
		throw error;
	}
}

async function saveLog(query: string, process: { [key: string]: any }) {
	const {stdout, ...rest} = process;
	const content = `# Query Log
Query: ${query}
Timestamp: ${new Date().toISOString()}

## Process Details
\`\`\`json
${JSON.stringify(rest, null, 2)}
\`\`\`

## Output

\`\`\`
${stdout}
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

async function promptUser(
	rl: readline.Interface,
	message: string
): Promise<string> {
	return new Promise((resolve) => {
		rl.question(chalk.blue(message), (answer) => {
			resolve(answer.trim());
		});
	});
}

async function selectAIProvider(rl: readline.Interface): Promise<string> {
	console.log(chalk.yellow('\nAvailable AI Providers:\n'));

	const providers: { name: string; id: string }[] = [
		{name: 'OpenAI(LangChain)', id: 'openai'},
		{name: 'OpenRouter', id: 'openrouter'},
	];

	providers.forEach((provider, index) => {
		console.log(chalk.green(`${index + 1}. ${provider.name}`));
	});

	let selectedIndex: number | null = null;

	while (
		selectedIndex === null ||
		selectedIndex < 0 ||
		selectedIndex >= providers.length
		) {
		const choice = await promptUser(
			rl,
			'Select an AI provider (1, 2) [Default: 1]:\n> '
		);

		// Nếu người dùng không nhập gì, chọn mặc định là `1` (OpenAI)
		const parsedChoice = choice.trim() === '' ? 1 : parseInt(choice, 10);

		if (
			!isNaN(parsedChoice) &&
			parsedChoice > 0 &&
			parsedChoice <= providers.length
		) {
			selectedIndex = parsedChoice - 1;
		} else {
			console.log(chalk.red('Invalid selection. Please try again.'));
			selectedIndex = null; // Reset để tiếp tục vòng lặp
		}
	}

	// Chắc chắn `selectedIndex` hợp lệ trước khi truy cập phần tử mảng
	const selectedProvider = providers[selectedIndex];

	if (!selectedProvider) {
		throw new Error('Unexpected error: Selected provider is undefined.');
	}

	console.log(chalk.green(`\nYou selected: ${selectedProvider.name}`));
	return selectedProvider.id;
}

async function main() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	try {
		// Bước 1: Chọn AI Provider
		selectedProvider = (await selectAIProvider(rl)) as 'openai' | 'openrouter';

		console.log(
			chalk.yellow(`Initializing AI agent using ${selectedProvider}...`)
		);
		let executor = null;

		switch (selectedProvider) {
			case 'openai':
				console.log(chalk.yellow('Initializing OpenAI agent...'));
				executor = await initializeAgentLangChain();
				break;
			case 'openrouter':
				console.log(chalk.yellow('Initializing OpenRouter agent...'));
				executor = await initializeAgent();

				break;
			default:
				throw new Error('Invalid AI provider selected');
		}

		while (true) {
			const query = await promptUser(
				rl,
				'Enter your search query (or type "exit" to quit, "history" to see past queries):\n> '
			);

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
			const outputCapturer = createOutputCapturer();
			outputCapturer.start();

			try {
				const processStart = {
					timestamp: new Date().toISOString(),
					query,
					status: 'started',
					provider: selectedProvider, // Ghi lại provider đã sử dụng
				};

				const result = await executor.run(query);
				const capturedOutput = outputCapturer.stop();

				const processComplete = {
					...processStart,
					status: 'completed',
					completedAt: new Date().toISOString(),
					executionTime:
						Date.now() - new Date(processStart.timestamp).getTime(),
					stdout: capturedOutput,
				};

				const logPath = await saveLog(query, processComplete);
				const dataPath = await saveData(query, result);

				spinner.succeed('Search completed');
				console.log(chalk.green('\nResult:'), result);
				console.log(chalk.gray(`\nLog saved to: ${logPath}`));
				console.log(chalk.gray(`Data saved to: ${dataPath}`));

				history.push(query);
				historyContext.push({role: 'user', content: query});
				historyContext.push({role: 'bot', content: result.toString()});
			} catch (error) {
				const capturedOutput = outputCapturer.stop();

				const processError = {
					timestamp: new Date().toISOString(),
					query,
					status: 'failed',
					provider: selectedProvider,
					stdout: capturedOutput,
					error: error instanceof Error ? error.message : String(error),
				};

				await saveLog(query, processError);

				spinner.fail('Search failed');
				console.error(chalk.red('\nError during search:'), error);
			}

			console.log('\n-------------------------------------------\n');
		}
	} catch (error) {
		console.error(chalk.red('Fatal error:'), error);
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
	console.error(
		chalk.red('\nUnhandled Rejection at:'),
		promise,
		chalk.red('\nReason:'),
		reason
	);
	process.exit(1);
});

main().catch((error) => {
	console.error(chalk.red('Application Error:'), error);
	process.exit(1);
});
