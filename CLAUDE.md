# Claude Code Router Log Visualizer

## Project Overview

A web-based inspection tool for visualizing and analyzing Claude Code Router API logs. Users can upload JSONL log files via drag-and-drop and interactively browse API requests with their full details including prompts, responses, tool calls, and token usage.

## Technology Stack

- **Runtime**: Node.js 18+
- **Backend**: NestJS 11 (TypeScript)
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Key Libraries**: Express, Multer (file uploads), RxJS, UUID

## Project Structure

```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root NestJS module
├── logs/                      # Logs feature module
│   ├── logs.controller.ts     # REST API endpoints
│   ├── logs.service.ts        # Business logic & parsing
│   ├── logs.module.ts         # Module declaration
│   ├── interfaces/            # TypeScript interfaces
│   └── utils/                 # Parsing utilities
└── public/                    # Static frontend (SPA)
    ├── index.html
    ├── css/styles.css
    └── js/                    # Frontend modules
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (watch mode)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Lint TypeScript files
npm run lint

# Format code
npm run format
```

## Architecture Patterns

### Backend (NestJS)
- Follow NestJS module-based architecture
- Controllers handle HTTP requests and route to services
- Services contain business logic and data processing
- Interfaces define TypeScript types in dedicated files
- Utility functions go in `utils/` directories within feature modules
- Use dependency injection via NestJS decorators

### Frontend (Vanilla JS)
- Single Page Application without framework
- Modular JavaScript files by feature (file-upload.js, request-list.js, request-details.js)
- CSS variables for theming support
- Event-driven communication between modules

### Data Flow
1. JSONL log files uploaded via multipart form
2. Logs parsed and aggregated by request ID in memory (Map-based storage)
3. Streaming response chunks merged into OpenAI-compatible format
4. REST API serves parsed data to frontend
5. Frontend fetches and renders interactive UI

## Coding Conventions

### TypeScript
- Use interfaces for type definitions (not type aliases for objects)
- Place interfaces in `interfaces/` subdirectories
- Use decorators for NestJS controllers and services
- Prefer async/await over raw Promises

### JavaScript (Frontend)
- Use ES6+ features (const/let, arrow functions, template literals, destructuring)
- Modular file organization by feature
- Use meaningful function and variable names
- Comment complex logic

### General
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use kebab-case for file names
- Keep functions focused and single-purpose

## API Endpoints

- `POST /logs/upload` - Upload JSONL log file
- `GET /logs/requests` - List all parsed requests
- `GET /logs/requests/:id` - Get specific request details

## Key Concepts

- **Request ID**: Unique identifier from `x-request-id` header in logs
- **Streaming Aggregation**: Multiple log entries with same request ID are merged
- **Special Requests**: Summarization and topic analysis requests are detected and flagged
- **Token Usage**: Tracks input/output tokens and extended thinking tokens

## Testing

No test framework is currently configured. When adding tests:
- Use Jest (standard for NestJS projects)
- Place test files alongside source files with `.spec.ts` extension
- Mock external dependencies and file uploads

## Notes

- Server runs on port 3000 by default
- CORS is enabled for cross-origin requests
- Data is stored in-memory (not persistent across restarts)
- TypeScript strict mode is disabled in tsconfig.json
