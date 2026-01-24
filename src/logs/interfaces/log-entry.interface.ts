export interface LogEntry {
  level: number;
  time: number;
  pid: number;
  hostname: string;
  reqId?: string;
  msg: string;

  // Request-specific fields
  req?: {
    method: string;
    url: string;
    host: string;
    remoteAddress: string;
    remotePort: number;
  };

  // Request body
  data?: any;
  type?: 'request body' | 'recieved data' | 'send data';

  // Final request
  request?: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal?: any;
  };
  headers?: Record<string, string>;
  requestUrl?: string;

  // Response data
  response?: any;

  // Completion
  res?: {
    statusCode: number;
  };
  responseTime?: number;
}

export interface ParsedRequest {
  reqId: string;
  method: string;
  url: string;
  model: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;

  // Full details
  requestHeaders: Record<string, string>;
  requestBody: any;
  finalRequest: any;

  // Aggregated response - merged OpenAI-compatible response object
  mergedResponse: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string | null;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      prompt_tokens_details?: {
        cached_tokens: number;
      };
    };
  } | null;

  // Legacy fields for backward compatibility
  responseContent: string;
  responseChunks: any[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cache_read_input_tokens?: number;
  };
}

export interface RequestSummary {
  reqId: string;
  method: string;
  url: string;
  model: string;
  requestModel: string;
  responseModel: string | null;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  // Payload summary counts
  systemCount: number;
  messageCount: number;
  toolCount: number;
  // Token usage from response
  inputTokens: number | null;
  outputTokens: number | null;
  // Filter flags
  isSummarizationRequest: boolean;
  // Feature flags
  hasThinking: boolean;
}
