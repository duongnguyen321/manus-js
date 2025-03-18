# Manus JS: AI-Powered Intelligent Web Research Assistant

[Follow blog code here!!!](https://duonguyen.site/blogs/manus-js-tro-ly-nghien-cuu-web-thong-minh-duoc-ho-tro-boi-ai)

| Category       | Badge Description | Badge                                                                                                                                                 |
| -------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Main Stats** | Stars             | [![Stars](https://img.shields.io/github/stars/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/stargazers)                        |
|                | Forks             | [![Forks](https://img.shields.io/github/forks/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/network/members)                   |
|                | Contributors      | [![Contributors](https://img.shields.io/github/contributors/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/graphs/contributors) |
|                | Pull Requests     | [![Pull Requests](https://img.shields.io/github/issues-pr/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/pulls)                 |
|                | Last Commit       | [![Last Commit](https://img.shields.io/github/last-commit/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/commits/main)          |
|                | Monthly Commits   | [![Commits](https://img.shields.io/github/commit-activity/m/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/commits/main)        |
| **Code Stats** | Top Language      | [![Top Language](https://img.shields.io/github/languages/top/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js)                    |
|                | Languages Count   | [![Languages Count](https://img.shields.io/github/languages/count/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js)               |
|                | Code Size         | [![Code Size](https://img.shields.io/github/languages/code-size/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js)                 |

---

Hello everyone, ladies and gentlemen. I'm Duong, born in 2004, currently a Fullstack developer. I have a burning passion for exploring new knowledge, especially AI-agents (actually I'm saying this because it fits the scope of this article). I learned about a powerful tool called Manus. However, since I didn't have an Invite key but was really excited about it, I coded my own version. Based on its demo videos, I basically cloned it.

As everyone knows, in the era of digital information explosion, collecting and processing data from multiple web sources has become extremely complex and time-consuming. **Manus JS** was created as a smart solution, offering the ability to automate the web research process with the support of advanced AI models.

Okay. This product is not medicine, but remember to read the instructions carefully before using it haaaa

---

## Usage Guide

### Clone repo

```bash
git clone https://github.com/duongnguyen321/manus-js.git
```

Install related packages. I use Bun to run, so you can try it too [check it out here](https://duonguyen.site/blogs/dung-bunjs-di-ung-dung-npm-nua)

```bash
bun install
```

### Install necessary services

1. Install **Google Chrome**

Although I prefer using Edge and Safari, Chrome must be installed to use browser research tools <3

- I use **Google Chrome** as a real browser to bypass security layers, await DOM, and then extract information from websites. This helps make the information retrieved more accurate and comprehensive.

```ts
import { sleep } from 'bun';
import PUP_CONFIG from '../../configs/puppeteer.js';
import { connect } from 'puppeteer-real-browser';
import chalk from 'chalk';

export default async function createBrowser() {
	try {
		const { browser } = await connect(PUP_CONFIG);
		return browser;
	} catch (e: any) {
		console.log(chalk.red(e.message));
		await sleep(3000);
		await createBrowser();
	}
}
```

2. Get API Key

Since this is just an Agent, it still needs an AI to complete it.
Here we have 2 options:

- [LangChain](https://www.langchain.com) and [OpenAI](https://platform.openai.com/docs/models)
- [OpenRouter](https://openrouter.ai/) and models on [OpenRouter](https://openrouter.ai/models)

You need to create a `.env` file, so run the following command:

**Then remember to change the API Key information in the env**

```bash
cp .env.example .env
```

- Example of choosing OpenAI

```bash
  ❯ start
  $ bun run index.ts

  Available AI Providers:
  1. OpenAI(LangChain)
  2. OpenRouter
  Select an AI provider (1, 2) [Default: 1]:
  >
  You selected: OpenAI(LangChain)
  Initializing AI agent using openai...
  Initializing OpenAI agent...
```

- Example of choosing OpenRouter

```bash
  ❯ start
  $ bun run index.ts

  Available AI Providers:
  1. OpenAI(LangChain)
  2. OpenRouter
  Select an AI provider (1, 2) [Default: 1]:
  > 2
  You selected: OpenRouter
  Initializing AI agent using openrouter...
  Initializing OpenRouter agent...
```

#### Where to get API keys?

For OpenRouter, you can go to [openrouter.ai](https://openrouter.ai?ref=duonguyen.site), register an account, and create an API Key

> _With OpenRouter, you can use the model: **google/gemini-2.0-flash-lite-preview-02-05:free** as this is a free model_

For OpenAI, you can go to [platform.openai.com](https://platform.openai.com/), register an account, and create an API Key.

> _With OpenAI, you need to add money as there is no free version_

### Usage

1. First run the test file to check if everything is working properly.

Open the `/src/test.ts` file in the project, modify the question in the `executor.run` section, and then run the following command:

```bash
bun run test
```

2. Okay if everything is working properly, run `start` and enjoy!

```bash
bun start
```

---

## Flow running

1. **Choose provider:** When selecting the necessary provider, it will initialize the function and wait for user questions.

- `/index.ts`

2. **Task analysis:** Use the first question to break down into smaller tasks, request research if needed

- Section: `Analyzing task and creating research plan` in both files `initializeAgent.ts` or `initializeAgentLangChain.ts`

3. Use the browser to open pages, search for information, get all text content from webpages, then summarize and consolidate into a context

- `/src/agent/tools/performResearch.ts` and `/src/agent/tools/browserTools.ts`

> If **BROWSER_LIMIT** is greater than or equal to 1, an additional internal link will be opened in each page. This helps make the information clearer.

4. Summarize information, combine with planning in **(2)**, analyze and return the response

- Section: `Synthesizing research findings...` and `Generate final response` in both files `initializeAgent.ts` or `initializeAgentLangChain.ts`

---

## Planning

- Agent Click, Research,... in a webpage instead of just crawling and summarizing the webpage.

## Thank you for reading!!!

Thank you all for reading, please try it out and develop it further with me <3

Oh, and if there are any errors or if you can't use it, please leave a comment for me <3
