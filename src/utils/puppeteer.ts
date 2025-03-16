import {sleep} from "bun";
import PUP_CONFIG from "../../configs/puppeteer.js";
import {connect} from "puppeteer-real-browser";
import chalk from "chalk";

export default async function createBrowser(){
	try {
		const {browser} = await connect(PUP_CONFIG);
		return browser
	} catch (e: any) {
		console.log(chalk.red(e.message));
		await sleep(3000)
		await createBrowser();
	}
}

