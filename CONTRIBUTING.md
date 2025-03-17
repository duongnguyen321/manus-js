# Contributing to Manus-JS

[![Contributors](https://img.shields.io/github/contributors/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/duongnguyen321/manus-js)](https://github.com/duongnguyen321/manus-js/pulls)

Thank you for considering contributing to Manus-JS! This document provides guidelines and instructions for contributing to this project.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue list](https://github.com/duongnguyen321/manus-js/issues) as you might find that the bug has already been reported. If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/duongnguyen321/manus-js/issues/new).

**Bug Report Template:**
```
**Description:**
[Clear and concise description of the bug]

**Steps to Reproduce:**
1. [First Step]
2. [Second Step]
3. [and so on...]

**Expected behavior:**
[What you expected to happen]

**Actual behavior:**
[What actually happened]

**Environment:**
- OS: [e.g. Windows 10, macOS 11.2]
- Node version: [e.g. 16.13.0]
- npm/yarn version: [e.g. npm 8.1.0]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as [GitHub issues](https://github.com/duongnguyen321/manus-js/issues). Create an issue and provide the following information:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any relevant examples if applicable**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style guidelines
6. Submit your pull request!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/duongnguyen321/manus-js.git
   cd manus-js
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   # or
   yarn install
   ```

3. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Coding Guidelines

### JavaScript/TypeScript Style

- Use ES6+ features when appropriate
- Follow the ESLint configuration in the project
- Write meaningful variable and function names
- Document complex logic with comments
- Use TypeScript types appropriately

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Testing

Ensure that all tests pass before submitting your PR:

```bash
bun run test
# or
npm test
# or
yarn test
```

If you add new functionality, please include appropriate tests.

## Documentation

If your changes require documentation updates, please include them in your PR.

## Community

- Check out the [project](https://github.com/duongnguyen321/manus-js)

## Attribution

Contributors will be acknowledged in our [README.md](README.md).

---

Thank you for contributing to Manus-JS! 🚀 
