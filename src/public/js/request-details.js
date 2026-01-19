class RequestDetails {
  constructor() {
    this.initTabs();
  }

  initTabs() {
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        this.switchTab(tab);
      });
    });
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

    // Body
    const body = document.getElementById('requestBody');
    if (details.requestBody) {
      body.textContent = JSON.stringify(details.requestBody, null, 2);
    } else {
      body.textContent = 'No request body available';
    }
  }

  renderResponse(details) {
    // Merged Response (OpenAI format)
    const mergedResponseEl = document.getElementById('mergedResponse');
    if (details.mergedResponse) {
      mergedResponseEl.textContent = JSON.stringify(details.mergedResponse, null, 2);
    } else {
      mergedResponseEl.textContent = 'No merged response available';
    }

    // Content (extracted from merged response)
    const content = document.getElementById('responseContent');
    content.textContent = details.responseContent || 'No response content';

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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clear() {
    // Clear request tab
    document.getElementById('requestGeneral').innerHTML = '';
    document.getElementById('requestHeaders').innerHTML = '';
    document.getElementById('requestBody').textContent = '';

    // Clear response tab
    document.getElementById('mergedResponse').textContent = '';
    document.getElementById('responseContent').textContent = '';
    document.getElementById('responseUsage').innerHTML = '';
    document.getElementById('responseChunks').textContent = '';

    // Reset to request tab
    this.switchTab('request');
  }
}
