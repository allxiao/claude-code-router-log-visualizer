class FileUploadHandler {
  constructor() {
    this.uploadArea = document.getElementById('uploadArea');
    this.fileInput = document.getElementById('fileInput');
    this.miniUploadArea = document.getElementById('miniUploadArea');
    this.miniFileInput = document.getElementById('miniFileInput');
    this.init();
  }

  init() {
    // Main upload area - Click to upload
    this.fileInput.addEventListener('change', (e) =>
      this.handleFile(e.target.files[0])
    );

    // Main upload area - Drag and drop
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

    // Mini upload area (in details panel)
    if (this.miniUploadArea && this.miniFileInput) {
      this.miniFileInput.addEventListener('change', (e) =>
        this.handleFile(e.target.files[0])
      );

      this.miniUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.miniUploadArea.classList.add('drag-over');
      });

      this.miniUploadArea.addEventListener('dragleave', () => {
        this.miniUploadArea.classList.remove('drag-over');
      });

      this.miniUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        this.miniUploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        this.handleFile(file);
      });
    }
  }

  async handleFile(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Show loading state on main upload area if visible
      const uploadLabel = this.uploadArea.querySelector('p');
      if (uploadLabel) {
        uploadLabel.textContent = 'Uploading...';
      }

      const response = await fetch('/api/logs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      window.app.onLogUploaded(data);

      // Reset file inputs
      this.fileInput.value = '';
      if (this.miniFileInput) {
        this.miniFileInput.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload and parse log file');
      const uploadLabel = this.uploadArea.querySelector('p');
      if (uploadLabel) {
        uploadLabel.textContent = 'Drop log file here or click to upload';
      }
    }
  }
}
