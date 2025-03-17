import configs from './configs.ts';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const USER_DATA_PATH = path.join(__dirname, '../userData');
if (!fs.existsSync(USER_DATA_PATH)) {
	fs.mkdirSync(USER_DATA_PATH);
}
const PUP_CONFIG = {
	headless: configs.browser.headless,
	turnstile: true,
	connectOption: configs.browser,
	customConfig: {
		userDataDir: USER_DATA_PATH,
	},
	disableXvfb: configs.browser.headless,
};
Object.freeze(PUP_CONFIG);
export default PUP_CONFIG;
