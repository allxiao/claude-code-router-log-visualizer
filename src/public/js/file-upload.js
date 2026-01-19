class FileUploadHandler {
  constructor() {
    this.uploadArea = document.getElementById('uploadArea');
    this.fileInput = document.getElementById('fileInput');
    this.init();
  }

  init() {
    // Click to upload
    this.fileInput.addEventListener('change', (e) =>
      this.handleFile(e.target.files[0])
    );

    // Drag and drop
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('drag-over');
    });

    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('drag-over');
    });

    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      this.handleFile(file);
    });
  }

  async handleFile(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Show loading state
      this.uploadArea.querySelector('p').textContent = 'Uploading...';

      const response = await fetch('/api/logs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      window.app.onLogUploaded(data);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload and parse log file');
      this.uploadArea.querySelector('p').textContent =
        'Drop log file here or click to upload';
    }
  }
}
