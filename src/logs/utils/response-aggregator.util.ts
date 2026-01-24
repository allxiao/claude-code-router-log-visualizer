/**
 * OpenAI Chat Completion Response structure (merged from streaming chunks)
 */
export interface ToolCall {
  id?: string;
  type?: string;
  function: {
    name?: string;
    arguments: string;
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
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
}

export class ResponseAggregator {
  /**
   * Merge streaming chunks into a single OpenAI-compatible response object
   * Following OpenAI API spec for chat completions
   */
  static mergeChunksToResponse(chunks: any[]): OpenAIResponse | null {
    if (!chunks || chunks.length === 0) {
      return null;
    }

    // Initialize the merged response
    let id = '';
    let created = 0;
    let model = '';
    let finishReason: string | null = null;
    let role = 'assistant';
    let content = '';
    let usage: OpenAIResponse['usage'] | undefined;

    // Tool calls: Map by index to handle streaming tool call chunks
    const toolCallsMap: Map<number, ToolCall> = new Map();

    for (const chunk of chunks) {
      try {
        // Parse the data field which contains JSON response
        let parsed: any;
        if (chunk.data) {
          parsed = typeof chunk.data === 'string' ? JSON.parse(chunk.data) : chunk.data;
        } else if (chunk.response) {
          parsed = chunk.response;
        } else {
          continue;
        }

        // Extract common fields from first chunk that has them
        if (!id && parsed.id) {
          id = parsed.id;
        }
        if (!created && parsed.created) {
          created = parsed.created;
        }
        if (!model && parsed.model) {
          model = parsed.model;
        }

        // Process choices
        if (parsed.choices && parsed.choices.length > 0) {
          const choice = parsed.choices[0];

          // Extract role from delta (usually only in first chunk)
          if (choice.delta?.role) {
            role = choice.delta.role;
          }

          // Concatenate content from delta
          if (choice.delta?.content) {
            content += choice.delta.content;
          }

          // Process tool calls from delta
          if (choice.delta?.tool_calls && Array.isArray(choice.delta.tool_calls)) {
            for (const toolCallDelta of choice.delta.tool_calls) {
              const toolIndex = toolCallDelta.index ?? 0;

              // Get or create the tool call entry
              if (!toolCallsMap.has(toolIndex)) {
                toolCallsMap.set(toolIndex, {
                  id: undefined,
                  type: undefined,
                  function: {
                    name: undefined,
                    arguments: '',
                  },
                });
              }

              const toolCall = toolCallsMap.get(toolIndex)!;

              // Merge tool call data
              if (toolCallDelta.id) {
                toolCall.id = toolCallDelta.id;
              }
              if (toolCallDelta.type) {
                toolCall.type = toolCallDelta.type;
              }
              if (toolCallDelta.function) {
                if (toolCallDelta.function.name) {
                  toolCall.function.name = toolCallDelta.function.name;
                }
                if (toolCallDelta.function.arguments) {
                  toolCall.function.arguments += toolCallDelta.function.arguments;
                }
              }
            }
          }

          // Extract finish_reason from final chunk
          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }
        }

        // Extract usage from final chunk
        if (parsed.usage) {
          usage = {
            prompt_tokens: parsed.usage.prompt_tokens || 0,
            completion_tokens: parsed.usage.completion_tokens || 0,
            total_tokens: parsed.usage.total_tokens || 0,
          };
          if (parsed.usage.prompt_tokens_details) {
            usage.prompt_tokens_details = {
              cached_tokens: parsed.usage.prompt_tokens_details.cached_tokens || 0,
            };
          }
        }
      } catch (error) {
        // Skip chunks that can't be parsed
        continue;
      }
    }

    // Return null if no valid data was found
    if (!id && !content && toolCallsMap.size === 0) {
      return null;
    }

    // Build tool_calls array from map, sorted by index
    let toolCalls: ToolCall[] | undefined;
    if (toolCallsMap.size > 0) {
      toolCalls = Array.from(toolCallsMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([_, toolCall]) => toolCall);
    }

    // Build the merged response object
    return {
      id: id || 'unknown',
      object: 'chat.completion',
      created: created || Date.now(),
      model: model || 'unknown',
      choices: [
        {
          index: 0,
          message: {
            role,
            content: content || null,
            ...(toolCalls && toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
          },
          finish_reason: finishReason,
        },
      ],
      usage,
    };
  }

  /**
   * Aggregate streaming response chunks into readable content (legacy method)
   */
  static aggregateChunks(chunks: any[]): string {
    const merged = this.mergeChunksToResponse(chunks);
    return merged?.choices?.[0]?.message?.content || '';
  }

  /**
   * Parse SSE (Server-Sent Events) format
   */
  static parseSseChunks(chunks: any[]): string {
    let content = '';

    for (const chunk of chunks) {
      if (chunk.type === 'send data' && chunk.data) {
        const lines = chunk.data.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6);
              const parsed = JSON.parse(jsonStr);

              // Anthropic SSE format
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                content += parsed.delta.text;
              }
            } catch (error) {
              continue;
            }
          }
        }
      }
    }

    return content;
  }
}
