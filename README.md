# Claude Code Router Log Viewer

A web-based tool for visualizing and analyzing Claude Code Router logs. Inspect API requests and responses with a Chrome DevTools-inspired interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Drag & Drop Upload** - Simply drag and drop log files or click to upload
- **Request List** - Browse all API requests with status, model, and timing info
- **Request Details** - View headers, configuration, system prompts, messages, and tools
- **Response Viewer** - Markdown rendering, tool calls display, and usage statistics
- **Filtering** - Hide non-coding requests (summarization, topic analysis)
- **History Navigation** - Browser back/forward support for seamless navigation

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/allxiao/claude-code-router-log-visualizer.git
cd claude-code-router-log-visualizer

# Install dependencies
npm install

# Start the server
npm run start
```

Open http://localhost:3000 in your browser.

## Usage

### 1. Enable Request Logging

Add the following to your Claude Code Router config file:

**macOS/Linux:** `~/.claude-code-router/config.json`
**Windows:** `%USERPROFILE%\.claude-code-router\config.json`

```json
{
  "LOG": true,
  "LOG_LEVEL": "debug"
}
```

> ⚠️ **Warning:** Debug logging generates large files. Disable when not needed.

### 2. Start Logging

Restart Claude Code Router to begin a new log file:

```bash
ccr restart
```

### 3. Find Log Files

Log files are stored at:

- **macOS/Linux:** `~/.claude-code-router/logs/`
- **Windows:** `%USERPROFILE%\.claude-code-router\logs\`

Files are named `ccr-[timestamp].log` in JSONL format.

### 4. Upload & Analyze

1. Open http://localhost:3000
2. Drag and drop a log file onto the upload area, or click to select
3. Browse requests in the left panel
4. View request/response details in the right panel

## Development

### Project Structure

```
log-visualizer/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root NestJS module
│   ├── logs/
│   │   ├── logs.module.ts      # Logs feature module
│   │   ├── logs.controller.ts  # REST API endpoints
│   │   ├── logs.service.ts     # Business logic
│   │   ├── interfaces/         # TypeScript interfaces
│   │   └── utils/              # Log parsing utilities
│   └── public/                 # Static frontend files
│       ├── index.html
│       ├── css/styles.css
│       └── js/
│           ├── app.js
│           ├── file-upload.js
│           ├── request-list.js
│           └── request-details.js
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Scripts

```bash
# Development with hot reload
npm run start:dev

# Production build
npm run build

# Start production server
npm run start:prod

# Linting
npm run lint

# Format code
npm run format
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve the web interface |
| `/api/logs/upload` | POST | Upload and parse a log file |
| `/api/logs/:sessionId/requests` | GET | Get all requests for a session |
| `/api/logs/:sessionId/requests/:reqId` | GET | Get detailed request info |

### Tech Stack

- **Backend:** [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Frontend:** Vanilla JavaScript with modern ES6+
- **Styling:** Custom CSS with CSS variables
- **Markdown:** [marked](https://marked.js.org/) for response rendering

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
