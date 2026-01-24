import { Injectable } from '@nestjs/common';
import { LogParser } from './utils/log-parser.util';
import { ResponseAggregator } from './utils/response-aggregator.util';
import {
  ParsedRequest,
  RequestSummary,
  LogEntry,
} from './interfaces/log-entry.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LogsService {
  // In-memory storage (for production, use Redis or database)
  private sessions: Map<string, Map<string, ParsedRequest>> = new Map();

  async parseLogFile(buffer: Buffer): Promise<string> {
    const sessionId = uuidv4();
    const content = buffer.toString('utf-8');

    // Parse JSONL to log entries
    const logEntries = LogParser.parseJsonl(content);

    // Group by reqId and parse
    const requestsMap = LogParser.groupByRequest(logEntries);

    // Aggregate responses for each request
    const parsedRequests = new Map<string, ParsedRequest>();

    for (const [reqId, entries] of requestsMap.entries()) {
      const parsed = this.parseRequestEntries(reqId, entries);
      parsedRequests.set(reqId, parsed);
    }

    this.sessions.set(sessionId, parsedRequests);

    return sessionId;
  }

  async getRequestList(sessionId: string): Promise<RequestSummary[]> {
    const requests = this.sessions.get(sessionId);

    if (!requests) {
      return [];
    }

    return Array.from(requests.values())
      .map((req) => {
        // Calculate payload counts
        const body = req.requestBody || {};
        const systemCount = Array.isArray(body.system)
          ? body.system.length
          : body.system
            ? 1
            : 0;
        const messageCount = Array.isArray(body.messages)
          ? body.messages.length
          : 0;
        const toolCount = Array.isArray(body.tools) ? body.tools.length : 0;

        // Detect summarization requests:
        // 1) No tools definition
        // 2) System prompt contains "Summarize this coding conversation"
        const isSummarizationRequest = this.isSummarizationRequest(body);

        // Extract model from request and response
        const requestModel = req.model || 'unknown';
        const responseModel = req.mergedResponse?.model || null;
        // Use response model if available, otherwise fall back to request model
        const model = responseModel || requestModel;

        // Extract token usage from response (check both legacy usage and mergedResponse.usage)
        const usage: any = req.usage || req.mergedResponse?.usage;
        const inputTokens = usage?.input_tokens ?? usage?.prompt_tokens ?? null;
        const outputTokens = usage?.output_tokens ?? usage?.completion_tokens ?? null;

        // Detect if request has thinking/extended thinking enabled
        const hasThinking = !!body.thinking;

        return {
          reqId: req.reqId,
          method: req.method,
          url: req.url,
          model,
          requestModel,
          responseModel,
          statusCode: req.statusCode,
          responseTime: req.responseTime,
          timestamp: req.timestamp,
          systemCount,
          messageCount,
          toolCount,
          inputTokens,
          outputTokens,
          isSummarizationRequest,
          hasThinking,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  private isSummarizationRequest(body: any): boolean {
    // Condition 1: No tools definition
    const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
    if (hasTools) {
      return false;
    }

    // Condition 2: System prompt contains one of the marker texts
    const summarizationMarkers = [
      'Summarize this coding conversation',
      'Analyze if this message indicates a new conversation topic',
    ];
    const system = body.system;

    if (!system) {
      return false;
    }

    const containsMarker = (text: string): boolean => {
      return summarizationMarkers.some((marker) => text.includes(marker));
    };

    if (typeof system === 'string') {
      return containsMarker(system);
    }

    if (Array.isArray(system)) {
      return system.some(
        (s) =>
          (typeof s === 'string' && containsMarker(s)) ||
          (s && typeof s.text === 'string' && containsMarker(s.text)),
      );
    }

    return false;
  }

  async getRequestDetails(
    sessionId: string,
    reqId: string,
  ): Promise<ParsedRequest | null> {
    const requests = this.sessions.get(sessionId);

    if (!requests) {
      return null;
    }

    return requests.get(reqId) || null;
  }

  private parseRequestEntries(reqId: string, entries: LogEntry[]): ParsedRequest {
    let method = 'POST';
    let url = '/v1/messages';
    let model = 'unknown';
    let statusCode = 200;
    let responseTime = 0;
    let timestamp = 0;
    let requestHeaders: Record<string, string> = {};
    let requestBody: any = null;
    let finalRequest: any = null;
    const responseChunks: any[] = [];
    let usage: any = null;

    for (const entry of entries) {
      // Extract timestamp
      if (!timestamp && entry.time) {
        timestamp = entry.time;
      }

      // Incoming request
      if (entry.msg === 'incoming request' && entry.req) {
        method = entry.req.method;
        url = entry.req.url;
      }

      // Request body
      if (entry.type === 'request body' && entry.data) {
        requestBody = entry.data;
        model = entry.data.model || model;
      }

      // Final request to upstream
      if (entry.msg === 'final request') {
        finalRequest = {
          url: entry.requestUrl,
          headers: entry.headers,
          body: entry.request?.body,
        };
        requestHeaders = entry.headers || {};
      }

      // Received data from LLM
      if (entry.type === 'recieved data') {
        responseChunks.push(entry);
      }

      // Request completed
      if (entry.msg === 'request completed') {
        statusCode = entry.res?.statusCode || 200;
        responseTime = entry.responseTime || 0;
      }
    }

    // Merge response chunks into a single OpenAI-compatible response object
    const mergedResponse = ResponseAggregator.mergeChunksToResponse(responseChunks);

    // Extract content and usage from merged response
    const responseContent = mergedResponse?.choices?.[0]?.message?.content || '';

    // Map usage to legacy format for backward compatibility
    if (mergedResponse?.usage) {
      usage = {
        input_tokens: mergedResponse.usage.prompt_tokens || 0,
        output_tokens: mergedResponse.usage.completion_tokens || 0,
        total_tokens: mergedResponse.usage.total_tokens || 0,
        cache_read_input_tokens:
          mergedResponse.usage.prompt_tokens_details?.cached_tokens || 0,
      };
    }

    return {
      reqId,
      method,
      url,
      model,
      statusCode,
      responseTime,
      timestamp,
      requestHeaders,
      requestBody,
      finalRequest,
      mergedResponse,
      responseContent,
      responseChunks,
      usage,
    };
  }
}
