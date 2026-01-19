class App {
  constructor() {
    this.sessionId = null;
    this.currentRequests = null; // Store requests for history navigation
    this.fileUpload = new FileUploadHandler();
    this.requestList = new RequestList();
    this.requestDetails = new RequestDetails();
    window.app = this;

    this.initBackButton();
    this.initVisibilityHandler();
    this.initHistoryHandler();
    this.initLogPathHint();
  }

  initLogPathHint() {
    // Detect OS and resolve the log path
    const logPath = this.getLogPath();

    // Update all log path elements
    document.querySelectorAll('.log-path').forEach(el => {
      el.textContent = logPath;
    });
  }

  getLogPath() {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    // Detect Windows
    if (platform.includes('win') || userAgent.includes('windows')) {
      // Windows: %USERPROFILE%\.claude-code-router\logs
      return '%USERPROFILE%\\.claude-code-router\\logs';
    }

    // Detect macOS or Linux (both use ~/.claude-code-router/logs)
    return '~/.claude-code-router/logs';
  }

  initBackButton() {
    const backButton = document.getElementById('backButton');
    if (backButton) {
      backButton.addEventListener('click', () => this.goBack());
    }
  }

  initVisibilityHandler() {
    // Force repaint when page becomes visible again
    // This fixes rendering issues when browser discards compositor layers for inactive tabs
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.forceRepaint();
      }
    });

    // Also handle window focus for additional coverage
    window.addEventListener('focus', () => {
      this.forceRepaint();
    });
  }

  initHistoryHandler() {
    // Handle browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.sessionId && event.state.requests) {
        // Restore the log view
        this.restoreLogView(event.state.sessionId, event.state.requests, event.state.selectedReqId);
      } else {
        // Go back to initial view
        this.showInitialView();
      }
    });

    // Replace initial state so we have a clean state to go back to
    history.replaceState({ view: 'initial' }, '', window.location.href);
  }

  forceRepaint() {
    // Force a repaint by toggling a CSS property on scrollable containers
    const scrollableElements = document.querySelectorAll(
      '.tab-content, .request-list, .json-viewer, .response-content, .message-list, .system-list'
    );

    scrollableElements.forEach(el => {
      // Trigger reflow/repaint
      el.style.transform = 'translateZ(1px)';
      // Use requestAnimationFrame to ensure the change is applied
      requestAnimationFrame(() => {
        el.style.transform = 'translateZ(0)';
      });
    });
  }

  goBack() {
    // Update current history state with selected request before going back
    this.updateCurrentHistoryState();
    // Use browser history to go back
    history.back();
  }

  updateCurrentHistoryState() {
    // Update the current history state with the selected request ID
    if (this.sessionId && this.currentRequests) {
      history.replaceState(
        {
          sessionId: this.sessionId,
          requests: this.currentRequests,
          selectedReqId: this.requestList.selectedReqId
        },
        '',
        window.location.href
      );
    }
  }

  showInitialView() {
    // Reset session
    this.sessionId = null;
    this.currentRequests = null;

    // Hide content wrapper and show upload area
    document.getElementById('contentWrapper').style.display = 'none';
    document.querySelector('.upload-area').style.display = 'block';

    // Hide mini upload area in header
    document.getElementById('miniUploadArea').style.display = 'none';

    // Clear the request list
    this.requestList.clear();

    // Clear the details panels
    this.requestDetails.clear();

    // Reset file inputs
    document.getElementById('fileInput').value = '';
    document.getElementById('miniFileInput').value = '';

    // Reset upload area label to initial state
    const uploadLabel = document.querySelector('.upload-area .upload-label p:first-of-type');
    if (uploadLabel) {
      uploadLabel.textContent = 'Drop log file here or click to upload';
    }
  }

  restoreLogView(sessionId, requests, selectedReqId) {
    // Restore session and requests
    this.sessionId = sessionId;
    this.currentRequests = requests;

    // Hide upload area and show content wrapper
    document.querySelector('.upload-area').style.display = 'none';
    document.getElementById('contentWrapper').style.display = 'flex';

    // Show mini upload area in header
    document.getElementById('miniUploadArea').style.display = 'block';

    // Render request list and restore selection
    this.requestList.render(requests);

    // Restore the previously selected request if available
    if (selectedReqId) {
      this.requestList.selectRequest(selectedReqId);
    }
  }

  onLogUploaded(data) {
    this.sessionId = data.sessionId;
    this.currentRequests = data.requests;

    // Push state to history for back/forward navigation
    history.pushState(
      { sessionId: data.sessionId, requests: data.requests, selectedReqId: null },
      '',
      window.location.href
    );

    // Hide upload area and show content wrapper
    document.querySelector('.upload-area').style.display = 'none';
    document.getElementById('contentWrapper').style.display = 'flex';

    // Show mini upload area in header
    document.getElementById('miniUploadArea').style.display = 'block';

    // Render request list
    this.requestList.render(data.requests);
  }

  onRequestSelected(reqId) {
    this.requestDetails.render(this.sessionId, reqId);
    // Update history state with the selected request
    this.updateCurrentHistoryState();
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
