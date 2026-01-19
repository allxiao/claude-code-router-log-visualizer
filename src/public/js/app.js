class App {
  constructor() {
    this.sessionId = null;
    this.fileUpload = new FileUploadHandler();
    this.requestList = new RequestList();
    this.requestDetails = new RequestDetails();
    window.app = this;

    this.initBackButton();
    this.initVisibilityHandler();
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
    // Reset session
    this.sessionId = null;

    // Hide content wrapper and show upload area
    document.getElementById('contentWrapper').style.display = 'none';
    document.querySelector('.upload-area').style.display = 'block';

    // Hide mini upload area in header
    document.getElementById('miniUploadArea').style.display = 'none';

    // Clear the request list
    this.requestList.clear();

    // Clear the details panels
    this.requestDetails.clear();

    // Reset file input
    document.getElementById('fileInput').value = '';
  }

  onLogUploaded(data) {
    this.sessionId = data.sessionId;

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
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
