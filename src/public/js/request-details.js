class RequestDetails {
  constructor() {
    this.currentDetails = null;
    this.markdownEnabled = true;
    this.initTabs();
    this.initMarkdownToggle();
  }

  initTabs() {
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  initMarkdownToggle() {
    const toggle = document.getElementById('markdownToggle');
    if (toggle) {
      this.markdownEnabled = toggle.checked;
      toggle.addEventListener('change', () => {
        this.markdownEnabled = toggle.checked;
        // Re-render response choices if we have current details
        if (this.currentDetails && this.currentDetails.mergedResponse) {
          const contentEl = document.getElementById('responseContent');
          this.renderResponseChoices(contentEl, this.currentDetails.mergedResponse);
        }
      });
    }
  }

  switchTab(tab) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update panes
    document.querySelectorAll('.tab-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.id === `${tab}Tab`);
    });
  }

  async render(sessionId, reqId) {
    try {
      const response = await fetch(`/api/logs/${sessionId}/requests/${reqId}`);
      const details = await response.json();

      // Store current details for re-rendering when toggle changes
      this.currentDetails = details;

      this.renderRequest(details);
      this.renderResponse(details);
    } catch (error) {
      console.error('Failed to load request details:', error);
    }
  }

  renderRequest(details) {
    // General info
    const general = document.getElementById('requestGeneral');
    general.innerHTML = `
      <div class="details-label">Request ID:</div>
      <div class="details-value">${details.reqId}</div>
      <div class="details-label">Method:</div>
      <div class="details-value">${details.method}</div>
      <div class="details-label">URL:</div>
      <div class="details-value">${details.url}</div>
      <div class="details-label">Model:</div>
      <div class="details-value">${details.model}</div>
      <div class="details-label">Status Code:</div>
      <div class="details-value">${details.statusCode}</div>
      <div class="details-label">Response Time:</div>
      <div class="details-value">${details.responseTime.toFixed(2)} ms</div>
    `;

    // Headers
    const headers = document.getElementById('requestHeaders');
    const headerEntries = Object.entries(details.requestHeaders || {});
    if (headerEntries.length > 0) {
      headers.innerHTML = headerEntries
        .map(
          ([key, value]) => `
        <div class="details-label">${this.escapeHtml(key)}:</div>
        <div class="details-value">${this.escapeHtml(String(value))}</div>
      `
        )
        .join('');
    } else {
      headers.innerHTML =
        '<div class="empty-state">No headers available</div>';
    }

    // Raw Body (collapsible, collapsed by default)
    const body = document.getElementById('requestBody');
    if (details.requestBody) {
      body.textContent = JSON.stringify(details.requestBody, null, 2);
    } else {
      body.textContent = 'No request body available';
    }

    // Human-friendly request details
    this.renderRequestDetails(details.requestBody);
  }

  renderRequestDetails(body) {
    if (!body) {
      document.getElementById('requestDetailsSection').style.display = 'none';
      return;
    }
    document.getElementById('requestDetailsSection').style.display = 'block';

    // Render Configuration
    this.renderConfig(body);

    // Render System Prompts
    this.renderSystemPrompts(body.system || []);

    // Render Messages
    this.renderMessages(body.messages || []);

    // Render Tools
    this.renderTools(body.tools || []);
  }

  renderConfig(body) {
    const configEl = document.getElementById('requestConfig');
    const configItems = [];

    if (body.model) {
      configItems.push(`
        <div class="details-label">Model:</div>
        <div class="details-value">${this.escapeHtml(body.model)}</div>
      `);
    }

    if (body.max_tokens !== undefined) {
      configItems.push(`
        <div class="details-label">Max Tokens:</div>
        <div class="details-value">${body.max_tokens}</div>
      `);
    }

    if (body.stream !== undefined) {
      configItems.push(`
        <div class="details-label">Stream:</div>
        <div class="details-value">${body.stream}</div>
      `);
    }

    if (body.temperature !== undefined) {
      configItems.push(`
        <div class="details-label">Temperature:</div>
        <div class="details-value">${body.temperature}</div>
      `);
    }

    if (body.metadata) {
      configItems.push(`
        <div class="details-label">Metadata:</div>
        <div class="details-value"><code>${this.escapeHtml(JSON.stringify(body.metadata))}</code></div>
      `);
    }

    configEl.innerHTML = configItems.length > 0
      ? configItems.join('')
      : '<div class="empty-state">No configuration available</div>';
  }

  renderSystemPrompts(system) {
    const systemListEl = document.getElementById('systemList');
    const systemCountEl = document.getElementById('systemCount');

    // Handle both array and string formats
    let systemMessages = [];
    if (typeof system === 'string') {
      systemMessages = [{ type: 'text', text: system }];
    } else if (Array.isArray(system)) {
      systemMessages = system;
    }

    systemCountEl.textContent = systemMessages.length;

    if (systemMessages.length === 0) {
      systemListEl.innerHTML = '<div class="empty-state">No system prompts</div>';
      return;
    }

    systemListEl.innerHTML = systemMessages
      .map((msg, index) => this.renderSystemCard(msg, index))
      .join('');
  }

  renderSystemCard(message, index) {
    // Handle different content formats
    let contentHtml = '';
    if (typeof message === 'string') {
      contentHtml = `<div class="text-content">${this.escapeHtml(message)}</div>`;
    } else if (message.type === 'text') {
      contentHtml = `<div class="text-content">${this.escapeHtml(message.text || '')}</div>`;
    } else {
      contentHtml = `<div class="text-content">${this.escapeHtml(JSON.stringify(message, null, 2))}</div>`;
    }

    return `
      <div class="message-card system">
        <div class="message-header">
          <span class="message-role">System</span>
          <span class="message-index">#${index + 1}</span>
        </div>
        <div class="message-content">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  renderMessages(messages) {
    const messageListEl = document.getElementById('messageList');
    const messageCountEl = document.getElementById('messageCount');

    messageCountEl.textContent = messages.length;

    if (messages.length === 0) {
      messageListEl.innerHTML = '<div class="empty-state">No messages</div>';
      return;
    }

    messageListEl.innerHTML = messages
      .map((msg, index) => this.renderMessageCard(msg, index))
      .join('');
  }

  renderMessageCard(message, index) {
    const role = message.role || 'unknown';
    const roleClass = role === 'user' ? 'user' : 'assistant';

    // Handle content - can be string or array
    let contentHtml = '';
    if (typeof message.content === 'string') {
      contentHtml = `<div class="text-content">${this.escapeHtml(message.content)}</div>`;
    } else if (Array.isArray(message.content)) {
      contentHtml = message.content
        .map(block => this.renderContentBlock(block))
        .join('');
    }

    return `
      <div class="message-card ${roleClass}">
        <div class="message-header">
          <span class="message-role">${this.escapeHtml(role)}</span>
          <span class="message-index">#${index + 1}</span>
        </div>
        <div class="message-content">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  renderContentBlock(block) {
    if (!block || !block.type) {
      return '';
    }

    switch (block.type) {
      case 'text':
        return `<div class="text-content">${this.escapeHtml(block.text || '')}</div>`;

      case 'tool_use':
        return this.renderToolUseBlock(block);

      case 'tool_result':
        return this.renderToolResultBlock(block);

      default:
        return `<div class="text-content"><em>Unknown content type: ${this.escapeHtml(block.type)}</em></div>`;
    }
  }

  renderToolUseBlock(block) {
    const inputStr = typeof block.input === 'string'
      ? block.input
      : JSON.stringify(block.input, null, 2);

    return `
      <div class="tool-use-block">
        <div class="tool-use-header">
          <svg class="tool-use-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          <span class="tool-name">${this.escapeHtml(block.name || 'Unknown Tool')}</span>
          <span class="tool-id">${this.escapeHtml(block.id || '')}</span>
        </div>
        <div class="tool-input">${this.escapeHtml(inputStr)}</div>
      </div>
    `;
  }

  renderToolResultBlock(block) {
    let contentStr = '';
    if (typeof block.content === 'string') {
      contentStr = block.content;
    } else if (Array.isArray(block.content)) {
      contentStr = block.content
        .map(c => c.text || JSON.stringify(c))
        .join('\n');
    } else {
      contentStr = JSON.stringify(block.content, null, 2);
    }

    // Truncate very long results
    const displayContent = this.truncateText(contentStr, 2000);

    return `
      <div class="tool-result-block">
        <div class="tool-result-header">
          <svg class="tool-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="tool-result-label">Tool Result</span>
          <span class="tool-result-id">${this.escapeHtml(block.tool_use_id || '')}</span>
        </div>
        <div class="tool-result-content">${this.escapeHtml(displayContent)}</div>
      </div>
    `;
  }

  renderTools(tools) {
    const toolsListEl = document.getElementById('toolsList');
    const toolCountEl = document.getElementById('toolCount');

    toolCountEl.textContent = tools.length;

    if (tools.length === 0) {
      toolsListEl.innerHTML = '<div class="empty-state">No tools defined</div>';
      return;
    }

    toolsListEl.innerHTML = tools
      .map((tool, index) => this.renderToolCard(tool, index))
      .join('');
  }

  renderToolCard(tool, index) {
    const name = tool.name || 'Unknown Tool';
    const description = tool.description || '';
    const schema = tool.input_schema || {};

    return `
      <details class="tool-card">
        <summary class="tool-card-header">
          <svg class="tool-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          <span class="tool-card-name">${this.escapeHtml(name)}</span>
        </summary>
        <div class="tool-card-body">
          <div class="tool-description">${this.escapeHtml(description)}</div>
          ${this.renderToolSchema(schema)}
        </div>
      </details>
    `;
  }

  renderToolSchema(schema) {
    if (!schema || !schema.properties) {
      return '';
    }

    const properties = schema.properties;
    const required = schema.required || [];
    const propertyNames = Object.keys(properties);

    if (propertyNames.length === 0) {
      return '';
    }

    const paramsHtml = propertyNames
      .map(propName => this.renderToolParam(propName, properties[propName], required.includes(propName)))
      .join('');

    return `
      <div class="tool-schema-section">
        <div class="tool-schema-header">Parameters</div>
        <div class="tool-params">
          ${paramsHtml}
        </div>
      </div>
    `;
  }

  renderToolParam(name, prop, isRequired) {
    const type = this.getSchemaType(prop);
    const description = prop.description || '';
    const enumValues = prop.enum;

    let enumHtml = '';
    if (enumValues && Array.isArray(enumValues)) {
      enumHtml = `
        <div class="tool-param-enum">
          <span class="tool-param-enum-label">Values: </span>
          <span class="tool-param-enum-values">${enumValues.map(v => `"${this.escapeHtml(v)}"`).join(' | ')}</span>
        </div>
      `;
    }

    return `
      <div class="tool-param">
        <div class="tool-param-header">
          <span class="tool-param-name">${this.escapeHtml(name)}</span>
          <span class="tool-param-type">${this.escapeHtml(type)}</span>
          ${isRequired
            ? '<span class="tool-param-required">required</span>'
            : '<span class="tool-param-optional">optional</span>'}
        </div>
        ${description ? `<div class="tool-param-desc">${this.escapeHtml(this.truncateText(description, 300))}</div>` : ''}
        ${enumHtml}
      </div>
    `;
  }

  getSchemaType(prop) {
    if (!prop) return 'any';

    if (prop.type) {
      if (prop.type === 'array' && prop.items) {
        const itemType = this.getSchemaType(prop.items);
        return `${itemType}[]`;
      }
      return prop.type;
    }

    if (prop.enum) {
      return 'enum';
    }

    if (prop.oneOf || prop.anyOf) {
      return 'union';
    }

    return 'any';
  }

  renderResponse(details) {
    // Merged Response (OpenAI format)
    const mergedResponseEl = document.getElementById('mergedResponse');
    if (details.mergedResponse) {
      mergedResponseEl.textContent = JSON.stringify(details.mergedResponse, null, 2);
    } else {
      mergedResponseEl.textContent = 'No merged response available';
    }

    // Render all choices from the response
    const contentEl = document.getElementById('responseContent');
    this.renderResponseChoices(contentEl, details.mergedResponse);

    // Usage
    const usage = document.getElementById('responseUsage');
    if (details.usage) {
      usage.innerHTML = `
        <div class="details-label">Input Tokens:</div>
        <div class="details-value">${details.usage.input_tokens || 0}</div>
        <div class="details-label">Output Tokens:</div>
        <div class="details-value">${details.usage.output_tokens || 0}</div>
        <div class="details-label">Total Tokens:</div>
        <div class="details-value">${details.usage.total_tokens || 0}</div>
        ${
          details.usage.cache_read_input_tokens
            ? `
          <div class="details-label">Cache Read:</div>
          <div class="details-value">${details.usage.cache_read_input_tokens}</div>
        `
            : ''
        }
      `;
    } else {
      usage.innerHTML = '<div class="empty-state">No usage data available</div>';
    }

    // Raw chunks - show all chunks
    const chunks = document.getElementById('responseChunks');
    chunks.textContent = JSON.stringify(details.responseChunks, null, 2);
  }

  renderResponseChoices(container, mergedResponse) {
    if (!mergedResponse || !mergedResponse.choices || mergedResponse.choices.length === 0) {
      container.innerHTML = '<div class="empty-state">No response content</div>';
      return;
    }

    const choices = mergedResponse.choices;

    // Render all choices
    container.innerHTML = choices
      .map((choice, index) => this.renderResponseChoice(choice, index, choices.length))
      .join('');
  }

  renderResponseChoice(choice, index, totalChoices) {
    const message = choice.message || {};
    const finishReason = choice.finish_reason || '';
    const choiceIndex = choice.index !== undefined ? choice.index : index;

    // Build content sections
    const contentSections = [];

    // Render text content as Markdown if present
    if (message.content) {
      contentSections.push(this.renderResponseContent(message.content));
    }

    // Render tool_calls if present
    if (message.tool_calls && message.tool_calls.length > 0) {
      contentSections.push(this.renderResponseToolCalls(message.tool_calls));
    }

    // If no content and no tool_calls, show a message
    if (contentSections.length === 0) {
      contentSections.push('<div class="empty-state">No content in this choice</div>');
    }

    // Only show choice header if there are multiple choices
    const headerHtml = totalChoices > 1 ? `
      <div class="response-choice-header">
        <span class="response-choice-index">Choice ${choiceIndex + 1}</span>
        <span class="response-choice-role">${this.escapeHtml(message.role || 'assistant')}</span>
        ${finishReason ? `<span class="response-choice-finish">${this.escapeHtml(finishReason)}</span>` : ''}
      </div>
    ` : '';

    return `
      <div class="response-choice">
        ${headerHtml}
        <div class="response-choice-body">
          ${contentSections.join('')}
        </div>
      </div>
    `;
  }

  renderResponseContent(content) {
    // Check if markdown rendering is enabled and marked library is available
    if (this.markdownEnabled && typeof marked !== 'undefined') {
      try {
        // Configure marked for safe rendering
        marked.setOptions({
          breaks: true,
          gfm: true
        });
        const htmlContent = marked.parse(content);
        return `<div class="response-markdown">${htmlContent}</div>`;
      } catch (e) {
        console.error('Markdown parsing error:', e);
        return `<div class="response-text">${this.escapeHtml(content)}</div>`;
      }
    }
    // Fallback to plain text
    return `<div class="response-text">${this.escapeHtml(content)}</div>`;
  }

  renderResponseToolCalls(toolCalls) {
    if (!toolCalls || toolCalls.length === 0) {
      return '';
    }

    return `
      <div class="response-tool-calls">
        <div class="response-tool-calls-header">
          <svg class="tool-calls-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          <span>Tool Calls (${toolCalls.length})</span>
        </div>
        <div class="response-tool-calls-list">
          ${toolCalls.map((tc, i) => this.renderResponseToolCall(tc, i)).join('')}
        </div>
      </div>
    `;
  }

  renderResponseToolCall(toolCall, index) {
    const id = toolCall.id || '';
    const type = toolCall.type || 'function';
    const functionData = toolCall.function || {};
    const name = functionData.name || 'Unknown';
    const args = functionData.arguments || '';

    // Try to parse and pretty-print arguments
    let argsDisplay = args;
    try {
      if (typeof args === 'string' && args.trim()) {
        const parsed = JSON.parse(args);
        argsDisplay = JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // Keep original if parsing fails
    }

    return `
      <div class="response-tool-call-card">
        <div class="response-tool-call-header">
          <svg class="response-tool-call-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          <span class="response-tool-call-name">${this.escapeHtml(name)}</span>
          <span class="response-tool-call-type">${this.escapeHtml(type)}</span>
          <span class="response-tool-call-id">${this.escapeHtml(id)}</span>
        </div>
        <div class="response-tool-call-args">
          <div class="response-tool-call-args-label">Arguments:</div>
          <pre class="response-tool-call-args-content">${this.escapeHtml(argsDisplay)}</pre>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  clear() {
    // Clear stored details
    this.currentDetails = null;

    // Clear request tab
    document.getElementById('requestGeneral').innerHTML = '';
    document.getElementById('requestHeaders').innerHTML = '';
    document.getElementById('requestBody').textContent = '';

    // Clear request details
    document.getElementById('requestConfig').innerHTML = '';
    document.getElementById('systemList').innerHTML = '';
    document.getElementById('systemCount').textContent = '0';
    document.getElementById('messageList').innerHTML = '';
    document.getElementById('messageCount').textContent = '0';
    document.getElementById('toolsList').innerHTML = '';
    document.getElementById('toolCount').textContent = '0';

    // Clear response tab
    document.getElementById('mergedResponse').textContent = '';
    document.getElementById('responseContent').textContent = '';
    document.getElementById('responseUsage').innerHTML = '';
    document.getElementById('responseChunks').textContent = '';

    // Reset to request tab
    this.switchTab('request');
  }
}
