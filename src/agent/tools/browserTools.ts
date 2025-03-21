// src/agent/tools/browserTools.ts
import {OpenAI} from 'openai';
import {Browser, Page} from 'puppeteer';
import {SystemMessage} from '@langchain/core/messages';
import {ChatOpenAI} from '@langchain/openai';
import {domainRegex} from "../../helpers.ts";
import createBrowser from '../../utils/puppeteer.ts';
import logger from '../../utils/logger.ts';
import configs, {SUMMA_PROMPT} from '../../../configs/configs';

class BrowserTools {
	name = 'browser';
	description =
		'Use this tool to browse websites, search for information, and extract content from web pages. Input should be a URL or search query.';
	browser: Browser | null = null;

	model: OpenAI | ChatOpenAI | null = null;
	modelName: string = configs.openrouter.model || 'openai/gpt-4o';
	type: 'langchain' | 'openrouter' | null = null;

	constructor(type: 'langchain' | 'openrouter') {
		if (type === 'openrouter') {
			this.model = new OpenAI({
				apiKey: configs.openrouter.apiKey,
				baseURL: configs.openrouter.apiBaseUrl,
				dangerouslyAllowBrowser: true,
			});
		}
		if (type === 'langchain') {
			this.model = new ChatOpenAI({
				modelName: configs.openai.model,
				streaming: configs.openai.streaming,
				cache: true,
			});
			this.type = type;
		}
	}

	async handleInternalLinks(domain: string, page: Page, browser: Browser) {
		try {
			// Parse domain to handle different cases
			let targetDomain = '';
			if (domain.includes('google.com/search') && domain.includes('site:')) {
				// Extract domain from site: search
				const siteMatch = domain.match(/site:([^\s&]+)/);
				const _targetDomain = siteMatch ? siteMatch[1]?.split('/')[0] : '';
				if (_targetDomain) targetDomain = _targetDomain
			} else if (domainRegex.test(domain)) {
				// For domain with/without path, get the main domain
				targetDomain = new URL(domain.startsWith('http') ? domain : `https://${domain}`).hostname;
			}

			const links = await page.evaluate((targetDomain) => {
				const currentHost = window.location.host;
				const isSearchPage = currentHost.includes('google.com') &&
					(window.location.pathname.includes('/search') ||
						window.location.search.includes('?q='));

				const links = Array.from(document.querySelectorAll('a[href]'));

				return {
					isSearchPage,
					targetDomain,
					links: links
						.map(link => link.getAttribute('href'))
						.filter(href => {
							if (!href) return false;

							try {
								const skipPatterns = [
									'/advanced', '/preferences', '/settings',
									'/images', '/videos', '/maps', '/news',
									'javascript:', 'mailto:', 'tel:', '#'
								];
								if (skipPatterns.some(pattern => href.includes(pattern))) {
									return false;
								}

								if (href.startsWith('http')) {
									const url = new URL(href);
									if (isSearchPage) {
										// For search results, only get links from target domain
										return targetDomain ? url.hostname.includes(targetDomain) : true;
									}
									// For direct domain access, get internal links
									return url.hostname === currentHost;
								}
								// Handle relative URLs for non-search pages
								return !isSearchPage && href.startsWith('/');
							} catch {
								return false;
							}
						})
				};
			}, targetDomain);

			if (!links.links.length) return '';

			logger.info(`Processing ${links.isSearchPage ? 'search results' : 'internal links'} page`);

			let allContent = '';
			const mapLinks = [...new Set(links.links)];
			for (const link of mapLinks.slice(0, configs.browser.limit)) {
				if (!link) continue;
				try {
					const absoluteUrl = new URL(link, page.url()).href;
					logger.info(`Following link: ${absoluteUrl}`);
					const internalPage = await browser.newPage();
					await internalPage.goto(absoluteUrl, {
						waitUntil: 'networkidle2',
						timeout: 15000
					});

					try {
						await internalPage.waitForNetworkIdle({timeout: 5000});
					} catch (e) {
						logger.debug('Network not idle for link, continuing...');
					}

					const content = await this.extractContent(internalPage);
					allContent += `\n\nContent from ${absoluteUrl}:\n${content}`;
					await internalPage.close();
				} catch (error: any) {
					logger.debug(`Failed to process link ${link}:`, error.message);
				}
			}

			return allContent;
		} catch (error) {
			logger.error('Error processing links:', error);
			return '';
		}
	}

	async extractContent(page: Page) {
		try {
			const content = await page.evaluate(() => {
				const getTextContent = (element: HTMLElement) => {
					// Remove unwanted elements
					const selectorsToRemove = [
						'script',
						'style',
						'noscript',
						'iframe',
						'nav',
						'footer',
						'header',
						'[class*="cookie"]',
						'[class*="banner"]',
						'[class*="modal"]',
						'[class*="popup"]',
						'[class*="newsletter"]',
						'[class*="ad-"]',
						'[id*="cookie"]',
						'[id*="banner"]',
						'[id*="modal"]',
						'[id*="popup"]',
						'[id*="newsletter"]',
						'[id*="ad-"]',
					];

					selectorsToRemove.forEach((selector) => {
						const elements = element.querySelectorAll(selector);
						elements.forEach((el) => el.remove());
					});

					const mainContent =
						element.querySelector('main') ||
						element.querySelector('article') ||
						element.querySelector('.content') ||
						element.querySelector('#content') ||
						element;

					return mainContent.innerText
						.replace(/\s+/g, ' ')
						.replace(/\n+/g, '\n')
						.trim();
				};

				return getTextContent(document.body);
			});
			logger.info('Summarizing content');
			if (this.type === 'openrouter' && this.model) {
				const model = this.model as OpenAI;
				const _summon = await model.chat.completions.create({
					model: this.modelName,
					messages: [
						{
							role: 'system',
							content: 'Detect and answer the following user language',
						},
						{role: 'system', content: SUMMA_PROMPT(content)},
					],
				});
				if (_summon.choices[0]?.message?.content)
					return _summon.choices[0]?.message.content;
			} else if (this.type === 'langchain' && this.model) {
				const model = this.model as ChatOpenAI;
				const _summon = await model.call([
					new SystemMessage('Detect and answer the following user language'),
					new SystemMessage(SUMMA_PROMPT(content)),
				]);
				if (_summon.content?.toString()) return _summon.content?.toString();
			}
			return content;
		} catch (error: any) {
			logger.error('Error extracting content:', error);
			return '';
		}
	}

	async initial(input: string) {
		try {
			if (!this.browser) {
				const _browser = await createBrowser();
				this.browser = (_browser as unknown as Browser) || null;
			}

			const page = await this.browser?.newPage();
			await page.goto(input);
		} catch (error: any) {
			logger.error('Error in BrowserTool:', error);
			return `Error accessing the web: ${error.message}`;
		}
	}

	async call(input: string): Promise<string> {
		try {
			if (!this.browser) {
				const _browser = await createBrowser();
				this.browser = (_browser as unknown as Browser) || null;
			}

			const page = await this.browser?.newPage();

			// Enable request interception
			// Enable request interception once before attaching any handlers
			await page.setRequestInterception(true);

			// Set up request handler
			page.on('request', (request) => {
				try {
					const resourceType = request.resourceType();
					const url = request.url();
					const blockedResources = [
						'image',
						'stylesheet',
						'font',
						'media',
						'websocket',
						'other',
					];

					// Script filtering logic
					if (
						resourceType === 'script' &&
						(url.includes('google-analytics') ||
							url.includes('advertisement') ||
							url.includes('clarity'))
					) {
						request.abort();
					}
					// Other resource types filtering
					else if (blockedResources.includes(resourceType)) {
						request.abort();
					}
					// Allow everything else
					else {
						request.continue();
					}
				} catch (error: any) {
					// Ignore "already handled" errors, log others
					if (!error.message.includes('already handled')) {
						console.error('Request interception error:', error);
					}
				}
			});

			logger.info(`Navigating to: ${input}`);

			const url = input.startsWith('http')
				? input
				: `https://www.google.com/search?q=${encodeURIComponent(input)}`;

			await page.goto(url, {
				waitUntil: 'networkidle2',
				timeout: 15000,
			});

			try {
				await page.waitForNetworkIdle({timeout: 5000});
			} catch (e) {
				logger.debug('The network is not idle');
			}

			await page.waitForFunction(() => document.body.innerText.length > 0, {
				timeout: 5000,
			});

			// Extract main content
			let content = await this.extractContent(page);

			// Handle internal links

			const internalContent = await this.handleInternalLinks(
				url,
				page,
				this.browser
			);
			if (internalContent) {
				content += internalContent;
			}

			// Trim content to prevent token limits
			if (content.length > 10000) {
				if (this.type === 'openrouter' && this.model) {
					const model = this.model as OpenAI;
					const _summon = await model.chat.completions.create({
						model: this.modelName,
						messages: [
							{
								role: 'system',
								content: 'Detect and answer the following user language',
							},
							{role: 'system', content: SUMMA_PROMPT(content)},
						],
					});
					if (_summon.choices[0]?.message?.content)
						content = _summon.choices[0]?.message.content;
				} else if (this.type === 'langchain' && this.model) {
					const model = this.model as ChatOpenAI;
					const _summon = await model.call([
						new SystemMessage('Detect and answer the following user language'),
						new SystemMessage(SUMMA_PROMPT(content)),
					]);
					if (_summon.content?.toString())
						content = _summon.content?.toString();
				}
			}

			return content;
		} catch (error: any) {
			logger.error('Error in BrowserTool:', error);
			return `Error accessing the web: ${error.message}`;
		}
	}

	async shutdown() {
		if (this.browser) {
			await this.browser?.close();
			this.browser = null;
		}
	}
}

export default BrowserTools;
