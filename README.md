# TinyCode

A tiny code assistant CLI tool powered by AI that helps you with coding tasks directly from your terminal.

## Installation

### Global Installation

Install TinyCode globally to use it anywhere on your system:

```bash
npm install -g tinycode
```

### Local Development

To install from source:

```bash
git clone <repository-url>
cd tinycode
npm install
npm run build
npm link
```

## Usage

Simply run `tinycode` in your terminal to start the interactive session:

```bash
tinycode
```

The tool will start an interactive session where you can:
- Ask coding questions
- Get help with debugging
- Request code examples
- Get assistance with various development tasks

## Configuration

TinyCode supports different AI providers through environment variables:

- `TINYCODE_PROVIDER`: Set the AI provider (default: 'copilot')
- `TINYCODE_MODEL`: Set the specific model to use

You can set these in your `.env` file or export them in your shell:

```bash
export TINYCODE_PROVIDER=copilot
export TINYCODE_MODEL=gpt-4
```

## Commands

Within the TinyCode session, you can use various commands:
- Type your questions directly
- Use built-in commands for session management
- Access help with available commands

## Features

- Interactive AI-powered coding assistance
- Session management for conversation history
- Multiple AI provider support
- Tool integration for enhanced capabilities
- Cross-platform compatibility

## Requirements

- Node.js 16 or higher
- npm or pnpm package manager

## License

ISC
