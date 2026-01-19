class App {
  constructor() {
    this.sessionId = null;
    this.fileUpload = new FileUploadHandler();
    this.requestList = new RequestList();
    this.requestDetails = new RequestDetails();
    window.app = this;
  }

  onLogUploaded(data) {
    this.sessionId = data.sessionId;

    // Hide upload area and show content wrapper
    document.querySelector('.upload-area').style.display = 'none';
    document.getElementById('contentWrapper').style.display = 'flex';

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
