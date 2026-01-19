class RequestList {
  constructor() {
    this.container = document.getElementById('requestList');
    this.countElement = document.getElementById('requestCount');
    this.requests = [];
    this.selectedReqId = null;
  }

  render(requests) {
    this.requests = requests;
    this.countElement.textContent = requests.length;

    if (requests.length === 0) {
      this.container.innerHTML =
        '<div class="empty-state">No requests found</div>';
      return;
    }

    this.container.innerHTML = requests
      .map((req) => this.renderRequestItem(req))
      .join('');

    // Add click handlers
    this.container.querySelectorAll('.request-item').forEach((item) => {
      item.addEventListener('click', () => {
        const reqId = item.dataset.reqId;
        this.selectRequest(reqId);
      });
    });

    // Auto-select first request
    if (requests.length > 0 && !this.selectedReqId) {
      this.selectRequest(requests[0].reqId);
    }
  }

  renderRequestItem(req) {
    const statusClass =
      req.statusCode >= 200 && req.statusCode < 300 ? 'success' : 'error';
    const date = new Date(req.timestamp);
    const time = date.toLocaleTimeString();

    return `
      <div class="request-item" data-req-id="${req.reqId}">
        <div class="request-item-header">
          <span class="request-method">${req.method}</span>
          <span class="request-status ${statusClass}">${req.statusCode}</span>
        </div>
        <div class="request-url">${req.url}</div>
        <div class="request-meta">
          <span>${req.model}</span>
          <span>${req.responseTime.toFixed(2)}ms</span>
          <span>${time}</span>
        </div>
      </div>
    `;
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
}
