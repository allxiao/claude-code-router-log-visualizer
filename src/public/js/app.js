class App {
  constructor() {
    this.sessionId = null;
    this.fileUpload = new FileUploadHandler();
    this.requestList = new RequestList();
    this.requestDetails = new RequestDetails();
    window.app = this;

    this.initBackButton();
  }

  initBackButton() {
    const backButton = document.getElementById('backButton');
    if (backButton) {
      backButton.addEventListener('click', () => this.goBack());
    }
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
