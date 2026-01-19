class RequestList {
  constructor() {
    this.container = document.getElementById('requestList');
    this.countElement = document.getElementById('requestCount');
    this.filterCheckbox = document.getElementById('filterCheckbox');
    this.requests = [];
    this.selectedReqId = null;
    this.isFiltered = true;

    this.initFilterCheckbox();
  }

  initFilterCheckbox() {
    if (this.filterCheckbox) {
      this.isFiltered = this.filterCheckbox.checked;
      this.filterCheckbox.addEventListener('change', () => {
        this.isFiltered = this.filterCheckbox.checked;
        this.renderList();
      });
    }
  }

  render(requests) {
    this.requests = requests;
    this.renderList();
  }

  renderList() {
    // Apply filter: hide summarization requests and count_tokens requests
    const filteredRequests = this.isFiltered
      ? this.requests.filter((req) => !req.isSummarizationRequest && !req.url.includes('/count_tokens'))
      : this.requests;

    // Update count display
    this.updateCount(filteredRequests.length, this.requests.length);

    if (filteredRequests.length === 0) {
      this.container.innerHTML =
        '<div class="empty-state">No requests found</div>';
      return;
    }

    this.container.innerHTML = filteredRequests
      .map((req) => this.renderRequestItem(req))
      .join('');

    // Add click handlers
    this.container.querySelectorAll('.request-item').forEach((item) => {
      item.addEventListener('click', () => {
        const reqId = item.dataset.reqId;
        this.selectRequest(reqId);
      });
    });

    // Auto-select first request if none selected or selected is filtered out
    const selectedVisible = filteredRequests.some(
      (req) => req.reqId === this.selectedReqId
    );
    if (filteredRequests.length > 0 && (!this.selectedReqId || !selectedVisible)) {
      this.selectRequest(filteredRequests[0].reqId);
    }
  }

  updateCount(visibleCount, totalCount) {
    if (this.isFiltered && visibleCount !== totalCount) {
      this.countElement.textContent = `${visibleCount}/${totalCount}`;
    } else {
      this.countElement.textContent = totalCount;
    }
  }

  renderRequestItem(req) {
    const statusClass =
      req.statusCode >= 200 && req.statusCode < 300 ? 'success' : 'error';
    const date = new Date(req.timestamp);
    const time = date.toLocaleTimeString();

    // Build payload summary if it's an OpenAI message payload
    let payloadSummary = '';
    const hasPayload = req.systemCount > 0 || req.messageCount > 0 || req.toolCount > 0;
    if (hasPayload) {
      payloadSummary = `<span class="payload-summary">S ${req.systemCount} / M ${req.messageCount} / T ${req.toolCount}</span>`;
    }

    // Model display: highlight if request and response models differ significantly
    const modelsDiffer = req.responseModel && !this.modelsMatch(req.requestModel, req.responseModel);
    const modelClass = modelsDiffer ? 'model-highlight' : '';
    const modelTooltip = modelsDiffer ? `title="Request: ${req.requestModel}"` : '';

    // Token usage display
    let tokenUsage = '';
    if (req.inputTokens != null && req.outputTokens != null) {
      tokenUsage = `<span class="token-usage">${this.formatTokens(req.inputTokens)} / ${this.formatTokens(req.outputTokens)}</span>`;
    }

    return `
      <div class="request-item${this.selectedReqId === req.reqId ? ' active' : ''}" data-req-id="${req.reqId}">
        <div class="request-item-header">
          <span class="request-method">${req.method}</span>
          ${payloadSummary}
          <span class="request-status ${statusClass}">${req.statusCode}</span>
        </div>
        <div class="request-url">${req.url}</div>
        <div class="request-meta">
          <span class="${modelClass}" ${modelTooltip}>${req.model}</span>
          ${tokenUsage}
          <span>${req.responseTime.toFixed(2)}ms</span>
          <span>${time}</span>
        </div>
      </div>
    `;
  }

  /**
   * Format token count for display (e.g., 1234 -> "1.2k")
   */
  formatTokens(count) {
    if (count == null) {
      return '-';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }

  /**
   * Check if two model names match by normalizing and checking prefix.
   * e.g., "claude-haiku-4.5" matches "claude-haiku-4-5-20251001"
   */
  modelsMatch(requestModel, responseModel) {
    if (!requestModel || !responseModel) {
      return false;
    }

    // Normalize: replace all non-alphanumeric chars with dashes, lowercase
    const normalize = (str) => str.toLowerCase().replace(/[^A-Za-z0-9]/g, '-');

    const normRequest = normalize(requestModel);
    const normResponse = normalize(responseModel);

    // Check if either is a prefix of the other
    return normResponse.startsWith(normRequest) || normRequest.startsWith(normResponse);
  }

  selectRequest(reqId) {
    this.selectedReqId = reqId;

    // Update UI
    this.container.querySelectorAll('.request-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.reqId === reqId);
    });

    // Notify app
    window.app.onRequestSelected(reqId);
  }

  clear() {
    this.requests = [];
    this.selectedReqId = null;
    this.container.innerHTML = '';
    this.countElement.textContent = '0';
  }
}
