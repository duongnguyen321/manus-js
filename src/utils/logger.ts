// src/utils/logger.ts
import chalk from 'chalk';
import configs from "../../configs/configs.ts";

const logger = {
	info: (message: string, data?: any) => {
		console.log(
			chalk.blue('[INFO]') + ' ' +
			chalk.white(message) +
			(data ? ' ' + chalk.gray(JSON.stringify(data, null, 2)) : '')
		);
	},

	error: (message: string, error: any) => {
		console.error(
			chalk.red('[ERROR]') + ' ' +
			chalk.white(message) + '\n' +
			chalk.red(error instanceof Error ? error.stack : JSON.stringify(error, null, 2))
		);
	},

	debug: (message: string, data?: any) => {
		if (configs.agent.verbose) {
			console.debug(
				chalk.yellow('[DEBUG]') + ' ' +
				chalk.white(message) +
				(data ? '\n' + chalk.gray(JSON.stringify(data, null, 2)) : '')
			);
		}
	},

	success: (message: string, data?: any) => {
		console.log(
			chalk.green('[SUCCESS]') + ' ' +
			chalk.white(message) +
			(data ? ' ' + chalk.gray(JSON.stringify(data, null, 2)) : '')
		);
	},

	warn: (message: string, data?: any) => {
		console.warn(
			chalk.yellow('[WARN]') + ' ' +
			chalk.white(message) +
			(data ? ' ' + chalk.gray(JSON.stringify(data, null, 2)) : '')
		);
	}
};

export default logger;
