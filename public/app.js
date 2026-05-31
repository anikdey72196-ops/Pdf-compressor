document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const toolPanels = document.querySelectorAll('.tool-panel');

  // DOM Elements - Diagnostics Status
  const gsStatusBadge = document.getElementById('gsStatusBadge');
  const gsStatusText = document.getElementById('gsStatusText');
  const troubleBanner = document.getElementById('troubleBanner');
  const troubleCodeBlock = document.getElementById('troubleCodeBlock');

  // DOM Elements - 1. Compress PDF Tool
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const queuedFileInfo = document.getElementById('queuedFileInfo');
  const queuedFileName = document.getElementById('queuedFileName');
  const queuedFileSize = document.getElementById('queuedFileSize');
  const removeFileBtn = document.getElementById('removeFileBtn');
  
  const presetCards = document.querySelectorAll('#panelCompress .preset-card');
  const compressBtn = document.getElementById('compressBtn');
  const btnText = compressBtn.querySelector('.btn-text');
  const btnLoader = compressBtn.querySelector('.btn-loader');
  
  const resultsSection = document.getElementById('resultsSection');
  const originalSizeResult = document.getElementById('originalSizeResult');
  const compressedSizeResult = document.getElementById('compressedSizeResult');
  const savingsVal = document.getElementById('savingsVal');
  const savingsRingFill = document.getElementById('savingsRingFill');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');

  // DOM Elements - 2. PDF to Image Tool
  const pdfToImageDropZone = document.getElementById('pdfToImageDropZone');
  const pdfToImageFileInput = document.getElementById('pdfToImageFileInput');
  const pdfToImgFileInfo = document.getElementById('pdfToImgFileInfo');
  const pdfToImgFileName = document.getElementById('pdfToImgFileName');
  const pdfToImgFileSize = document.getElementById('pdfToImgFileSize');
  const pdfToImgRemoveBtn = document.getElementById('pdfToImgRemoveBtn');
  
  const pdfToImgFormatBtns = document.querySelectorAll('#pdfToImgFormatSelector .segment-btn');
  const pdfToImgDpiCards = document.querySelectorAll('#pdfToImgDpiGrid .preset-card');
  const pdfToImageBtn = document.getElementById('pdfToImageBtn');
  
  const pdfToImageResults = document.getElementById('pdfToImageResults');
  const pdfToImgPagesBadge = document.getElementById('pdfToImgPagesBadge');
  const pdfToImageGallery = document.getElementById('pdfToImageGallery');
  const pdfToImgDownloadZipBtn = document.getElementById('pdfToImgDownloadZipBtn');
  const pdfToImgResetBtn = document.getElementById('pdfToImgResetBtn');

  // DOM Elements - 3. Image to PDF Tool
  const imgToPdfDropZone = document.getElementById('imgToPdfDropZone');
  const imgToPdfFileInput = document.getElementById('imgToPdfFileInput');
  const imgToPdfListContainer = document.getElementById('imgToPdfListContainer');
  const imgToPdfQueueCount = document.getElementById('imgToPdfQueueCount');
  const imgToPdfSortableList = document.getElementById('imgToPdfSortableList');
  
  const imgToPdfLayoutBtns = document.querySelectorAll('#imgToPdfLayoutSelector .segment-btn');
  const imgToPdfMarginBtns = document.querySelectorAll('#imgToPdfMarginSelector .segment-btn');
  const imgToPdfBtn = document.getElementById('imgToPdfBtn');
  
  const imgToPdfResults = document.getElementById('imgToPdfResults');
  const imgToPdfPagesResult = document.getElementById('imgToPdfPagesResult');
  const imgToPdfDownloadBtn = document.getElementById('imgToPdfDownloadBtn');
  const imgToPdfResetBtn = document.getElementById('imgToPdfResetBtn');

  // ==========================================
  // Application State
  // ==========================================
  let isGhostscriptWorking = false;

  // 1. Compress PDF State
  let compressSelectedFile = null;
  let compressSelectedQuality = 'ebook';

  // 2. PDF to Image State
  let pdfToImgSelectedFile = null;
  let pdfToImgSelectedFormat = 'png';
  let pdfToImgSelectedDpi = '150';

  // 3. Image to PDF State
  let imgToPdfSelectedFiles = []; // Array of { file, previewUrl }
  let imgToPdfSelectedLayout = 'original';
  let imgToPdfSelectedMargin = '0';

  // ==========================================
  // Router Tab Control
  // ==========================================
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle Nav Active state
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle Panels Visibility
      toolPanels.forEach(p => p.classList.add('hidden'));
      const activeTabName = btn.getAttribute('data-tab');

      if (activeTabName === 'compress') {
        document.getElementById('panelCompress').classList.remove('hidden');
      } else if (activeTabName === 'pdf-to-img') {
        document.getElementById('panelPdfToImg').classList.remove('hidden');
      } else if (activeTabName === 'img-to-pdf') {
        document.getElementById('panelImgToPdf').classList.remove('hidden');
      }
    });
  });

  // ==========================================
  // Diagnostics Check
  // ==========================================
  async function runDiagnostics() {
    try {
      const response = await fetch('/api/diagnostics');
      if (!response.ok) throw new Error('Diagnostics API offline');
      
      const data = await response.json();
      isGhostscriptWorking = data.working;
      
      if (data.working) {
        gsStatusBadge.className = 'status-indicator-badge online';
        gsStatusText.textContent = `GS v${data.version} Connected`;
        troubleBanner.classList.add('hidden');
      } else {
        gsStatusBadge.className = 'status-indicator-badge offline';
        gsStatusText.textContent = 'GS Disconnected';
        troubleBanner.classList.remove('hidden');
        
        if (data.platform === 'win32') {
          troubleCodeBlock.textContent = `GHOSTSCRIPT_PATH=C:\\Program Files (x86)\\gs\\gs${data.version !== 'Unknown' ? data.version : '10.07.1'}\\bin\\gswin32c.exe`;
        } else {
          troubleCodeBlock.textContent = `# Check package installation or install Ghostscript\n# macOS: brew install ghostscript\n# Debian/Ubuntu: sudo apt-get install ghostscript`;
        }
      }
    } catch (error) {
      console.error('Failed to query diagnostics API:', error);
      gsStatusBadge.className = 'status-indicator-badge offline';
      gsStatusText.textContent = 'Engine Offline';
    }
    
    // Initial update of trigger button lockouts
    updateCompressButtonState();
    updatePdfToImgButtonState();
  }

  runDiagnostics();

  // ==========================================
  // General Helper Functions
  // ==========================================
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Encapsulates drag-and-drop operations for any drop-zone element.
   */
  function setupDragAndDrop(element, inputElement, onFileSelect, multiple = false) {
    ['dragenter', 'dragover'].forEach(eventName => {
      element.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      element.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('dragover');
      }, false);
    });

    element.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        if (multiple) {
          Array.from(files).forEach(onFileSelect);
        } else {
          onFileSelect(files[0]);
        }
      }
    });

    inputElement.addEventListener('change', (e) => {
      const files = inputElement.files;
      if (files.length > 0) {
        if (multiple) {
          Array.from(files).forEach(onFileSelect);
        } else {
          onFileSelect(files[0]);
        }
      }
    });
  }

  // ==========================================
  // TOOL 1: PDF Compressor Controllers
  // ==========================================
  
  // Drag & drop configuration
  setupDragAndDrop(dropZone, fileInput, (file) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('AeroCompress only supports PDF files.');
      return;
    }
    compressSelectedFile = file;
    resultsSection.classList.add('hidden');
    savingsRingFill.style.strokeDashoffset = '439.82';
    
    queuedFileName.textContent = file.name;
    queuedFileSize.textContent = formatBytes(file.size);
    queuedFileInfo.classList.remove('hidden');
    updateCompressButtonState();
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    compressSelectedFile = null;
    fileInput.value = '';
    queuedFileInfo.classList.add('hidden');
    updateCompressButtonState();
  });

  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      compressSelectedQuality = card.getAttribute('data-quality');
    });
  });

  function updateCompressButtonState() {
    if (compressSelectedFile && isGhostscriptWorking) {
      compressBtn.disabled = false;
      btnText.textContent = 'Optimize Document';
    } else if (compressSelectedFile && !isGhostscriptWorking) {
      compressBtn.disabled = true;
      btnText.textContent = 'Ghostscript Required';
    } else {
      compressBtn.disabled = true;
      btnText.textContent = 'Optimize Document';
    }
  }

  compressBtn.addEventListener('click', async () => {
    if (!compressSelectedFile || !isGhostscriptWorking) return;

    compressBtn.disabled = true;
    btnText.textContent = 'Processing PDF...';
    btnLoader.classList.remove('hidden');
    dropZone.style.pointerEvents = 'none';

    const formData = new FormData();
    formData.append('pdf', compressSelectedFile);
    formData.append('quality', compressSelectedQuality);

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Compression error occurred');

      // Success Results
      originalSizeResult.textContent = formatBytes(data.originalSize);
      compressedSizeResult.textContent = formatBytes(data.compressedSize);
      
      const percentage = Math.round(data.savedPercent);
      savingsVal.textContent = `${percentage}%`;
      
      const radius = 70;
      const circumference = 2 * Math.PI * radius; // 439.82
      const offset = circumference - (percentage / 100) * circumference;
      
      setTimeout(() => {
        savingsRingFill.style.strokeDashoffset = offset;
      }, 150);

      downloadBtn.setAttribute('href', data.downloadUrl);
      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      btnLoader.classList.add('hidden');
      btnText.textContent = 'Compression Complete';
      dropZone.style.pointerEvents = 'auto';

    } catch (err) {
      console.error(err);
      alert(`Compression Failed:\n${err.message}`);
      compressBtn.disabled = false;
      btnText.textContent = 'Optimize Document';
      btnLoader.classList.add('hidden');
      dropZone.style.pointerEvents = 'auto';
    }
  });

  resetBtn.addEventListener('click', () => {
    compressSelectedFile = null;
    fileInput.value = '';
    queuedFileInfo.classList.add('hidden');
    resultsSection.classList.add('hidden');
    savingsRingFill.style.strokeDashoffset = '439.82';
    
    compressBtn.disabled = true;
    btnText.textContent = 'Optimize Document';
    dropZone.style.pointerEvents = 'auto';
    runDiagnostics();
  });

  // ==========================================
  // TOOL 2: PDF to Image Controllers
  // ==========================================

  // Format selectors
  pdfToImgFormatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pdfToImgFormatBtns.forEach(b => {
        b.classList.remove('active');
        b.style.color = 'var(--text-muted)';
        b.style.fontWeight = '500';
        b.style.background = 'none';
      });
      btn.classList.add('active');
      btn.style.color = 'var(--text-main)';
      btn.style.fontWeight = '600';
      btn.style.background = 'var(--color-accent-grad)';
      pdfToImgSelectedFormat = btn.getAttribute('data-format');
    });
  });

  // DPI settings selector
  pdfToImgDpiCards.forEach(card => {
    card.addEventListener('click', () => {
      pdfToImgDpiCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      pdfToImgSelectedDpi = card.getAttribute('data-dpi');
    });
  });

  // Drag & drop PDF to convert
  setupDragAndDrop(pdfToImageDropZone, pdfToImageFileInput, (file) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files can be converted to images.');
      return;
    }
    pdfToImgSelectedFile = file;
    pdfToImageResults.classList.add('hidden');
    
    pdfToImgFileName.textContent = file.name;
    pdfToImgFileSize.textContent = formatBytes(file.size);
    pdfToImgFileInfo.classList.remove('hidden');
    updatePdfToImgButtonState();
  });

  pdfToImgRemoveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pdfToImgSelectedFile = null;
    pdfToImageFileInput.value = '';
    pdfToImgFileInfo.classList.add('hidden');
    updatePdfToImgButtonState();
  });

  function updatePdfToImgButtonState() {
    if (pdfToImgSelectedFile && isGhostscriptWorking) {
      pdfToImageBtn.disabled = false;
      pdfToImageBtn.querySelector('.btn-text').textContent = 'Convert to Images';
    } else if (pdfToImgSelectedFile && !isGhostscriptWorking) {
      pdfToImageBtn.disabled = true;
      pdfToImageBtn.querySelector('.btn-text').textContent = 'Ghostscript Required';
    } else {
      pdfToImageBtn.disabled = true;
      pdfToImageBtn.querySelector('.btn-text').textContent = 'Convert to Images';
    }
  }

  pdfToImageBtn.addEventListener('click', async () => {
    if (!pdfToImgSelectedFile || !isGhostscriptWorking) return;

    pdfToImageBtn.disabled = true;
    pdfToImageBtn.querySelector('.btn-text').textContent = 'Processing Pages...';
    pdfToImageBtn.querySelector('.btn-loader').classList.remove('hidden');
    pdfToImageDropZone.style.pointerEvents = 'none';

    const formData = new FormData();
    formData.append('pdf', pdfToImgSelectedFile);
    formData.append('format', pdfToImgSelectedFormat);
    formData.append('dpi', pdfToImgSelectedDpi);

    try {
      const response = await fetch('/api/pdf-to-image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Conversion error occurred');

      // Set downloads zip
      pdfToImgPagesBadge.textContent = `${data.pagesCount} Pages`;
      pdfToImgDownloadZipBtn.setAttribute('href', data.downloadUrl);

      // Render Interactive Gallery previews
      pdfToImageGallery.innerHTML = '';
      data.imageUrls.forEach((url, i) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'gallery-card';
        itemCard.innerHTML = `
          <div class="gallery-thumb-container" title="Open full screen preview">
            <img src="${url}" class="gallery-thumb" alt="Page ${i + 1}" />
          </div>
          <div class="gallery-card-info">
            <span class="gallery-page-num">Page ${i + 1}</span>
            <a href="${url}" download="page_${i + 1}.${pdfToImgSelectedFormat === 'jpeg' ? 'jpg' : 'png'}" class="gallery-download-btn">
              Download
            </a>
          </div>
        `;

        // Click thumbnail to zoom full resolution
        itemCard.querySelector('.gallery-thumb-container').addEventListener('click', () => {
          window.open(url, '_blank');
        });

        pdfToImageGallery.appendChild(itemCard);
      });

      pdfToImageResults.classList.remove('hidden');
      pdfToImageResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      pdfToImageBtn.querySelector('.btn-loader').classList.add('hidden');
      pdfToImageBtn.querySelector('.btn-text').textContent = 'Conversion Success';
      pdfToImageDropZone.style.pointerEvents = 'auto';

    } catch (err) {
      console.error(err);
      alert(`Conversion Failed:\n${err.message}`);
      pdfToImageBtn.disabled = false;
      pdfToImageBtn.querySelector('.btn-loader').classList.add('hidden');
      pdfToImageBtn.querySelector('.btn-text').textContent = 'Convert to Images';
      pdfToImageDropZone.style.pointerEvents = 'auto';
    }
  });

  pdfToImgResetBtn.addEventListener('click', () => {
    pdfToImgSelectedFile = null;
    pdfToImageFileInput.value = '';
    pdfToImgFileInfo.classList.add('hidden');
    pdfToImageResults.classList.add('hidden');
    updatePdfToImgButtonState();
    runDiagnostics();
  });

  // ==========================================
  // TOOL 3: Image to PDF Controllers
  // ==========================================

  // Dimensions layout selector
  imgToPdfLayoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      imgToPdfLayoutBtns.forEach(b => {
        b.classList.remove('active');
        b.style.color = 'var(--text-muted)';
        b.style.fontWeight = '500';
        b.style.background = 'none';
      });
      btn.classList.add('active');
      btn.style.color = 'var(--text-main)';
      btn.style.fontWeight = '600';
      btn.style.background = 'var(--color-accent-grad)';
      imgToPdfSelectedLayout = btn.getAttribute('data-layout');
    });
  });

  // Margins selector
  imgToPdfMarginBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      imgToPdfMarginBtns.forEach(b => {
        b.classList.remove('active');
        b.style.color = 'var(--text-muted)';
        b.style.fontWeight = '500';
        b.style.background = 'none';
      });
      btn.classList.add('active');
      btn.style.color = 'var(--text-main)';
      btn.style.fontWeight = '600';
      btn.style.background = 'var(--color-accent-grad)';
      imgToPdfSelectedMargin = btn.getAttribute('data-margin');
    });
  });

  // Multiple drag-and-drop handles for compiling image list queue
  setupDragAndDrop(imgToPdfDropZone, imgToPdfFileInput, (file) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.png', '.jpg', '.jpeg'];
    if (!allowed.includes(ext)) {
      alert('Only PNG, JPG, JPEG image formats are supported.');
      return;
    }

    // Generate blob preview URL
    const previewUrl = URL.createObjectURL(file);
    imgToPdfSelectedFiles.push({ file, previewUrl });

    renderImgQueue();
    imgToPdfResults.classList.add('hidden');
    updateImgToPdfBtnState();
  }, true);

  // Redraws the sorting list element queue
  function renderImgQueue() {
    imgToPdfSortableList.innerHTML = '';
    
    if (imgToPdfSelectedFiles.length === 0) {
      imgToPdfListContainer.classList.add('hidden');
      return;
    }

    imgToPdfQueueCount.textContent = `${imgToPdfSelectedFiles.length} Images`;
    imgToPdfListContainer.classList.remove('hidden');

    imgToPdfSelectedFiles.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'sortable-item';
      row.innerHTML = `
        <img src="${item.previewUrl}" class="sortable-thumb" alt="Thumbnail" />
        <div class="sortable-info">
          <span class="sortable-name" title="${item.file.name}">${item.file.name}</span>
          <span class="sortable-size">${formatBytes(item.file.size)}</span>
        </div>
        <div class="sortable-controls">
          <button class="sort-control-btn sort-up-btn" title="Move Up" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
          <button class="sort-control-btn sort-down-btn" title="Move Down" ${index === imgToPdfSelectedFiles.length - 1 ? 'disabled' : ''}>&darr;</button>
          <button class="sort-control-btn sort-delete-btn" title="Remove">&times;</button>
        </div>
      `;

      // Sort & control buttons actions
      row.querySelector('.sort-up-btn').addEventListener('click', (e) => {
        e.preventDefault();
        swapItems(index, index - 1);
      });
      row.querySelector('.sort-down-btn').addEventListener('click', (e) => {
        e.preventDefault();
        swapItems(index, index + 1);
      });
      row.querySelector('.sort-delete-btn').addEventListener('click', (e) => {
        e.preventDefault();
        removeItem(index);
      });

      imgToPdfSortableList.appendChild(row);
    });
  }

  function swapItems(i1, i2) {
    const temp = imgToPdfSelectedFiles[i1];
    imgToPdfSelectedFiles[i1] = imgToPdfSelectedFiles[i2];
    imgToPdfSelectedFiles[i2] = temp;
    renderImgQueue();
  }

  function removeItem(index) {
    URL.revokeObjectURL(imgToPdfSelectedFiles[index].previewUrl);
    imgToPdfSelectedFiles.splice(index, 1);
    renderImgQueue();
    updateImgToPdfBtnState();
  }

  function updateImgToPdfBtnState() {
    imgToPdfBtn.disabled = imgToPdfSelectedFiles.length === 0;
  }

  // Compile PDF action trigger
  imgToPdfBtn.addEventListener('click', async () => {
    if (imgToPdfSelectedFiles.length === 0) return;

    imgToPdfBtn.disabled = true;
    imgToPdfBtn.querySelector('.btn-text').textContent = 'Compiling Pages...';
    imgToPdfBtn.querySelector('.btn-loader').classList.remove('hidden');
    imgToPdfDropZone.style.pointerEvents = 'none';

    const formData = new FormData();
    imgToPdfSelectedFiles.forEach(item => {
      formData.append('images', item.file);
    });
    formData.append('layout', imgToPdfSelectedLayout);
    formData.append('margin', imgToPdfSelectedMargin);
    
    // Sort array by index
    const orderList = imgToPdfSelectedFiles.map(item => item.file.name);
    formData.append('order', JSON.stringify(orderList));

    try {
      const response = await fetch('/api/image-to-pdf', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server compilation error');

      // Compile Results panel
      imgToPdfPagesResult.textContent = `${imgToPdfSelectedFiles.length} Pages`;
      imgToPdfDownloadBtn.setAttribute('href', data.downloadUrl);

      imgToPdfResults.classList.remove('hidden');
      imgToPdfResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      imgToPdfBtn.querySelector('.btn-loader').classList.add('hidden');
      imgToPdfBtn.querySelector('.btn-text').textContent = 'PDF Ready';
      imgToPdfDropZone.style.pointerEvents = 'auto';

    } catch (err) {
      console.error(err);
      alert(`Compilation Failed:\n${err.message}`);
      imgToPdfBtn.disabled = false;
      imgToPdfBtn.querySelector('.btn-loader').classList.add('hidden');
      imgToPdfBtn.querySelector('.btn-text').textContent = 'Compile into PDF';
      imgToPdfDropZone.style.pointerEvents = 'auto';
    }
  });

  imgToPdfResetBtn.addEventListener('click', () => {
    imgToPdfSelectedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
    imgToPdfSelectedFiles = [];
    imgToPdfFileInput.value = '';
    renderImgQueue();
    imgToPdfResults.classList.add('hidden');
    updateImgToPdfBtnState();
  });

  // Watch for dynamic updates to Ghostscript diagnostic status
  setInterval(() => {
    if (compressSelectedFile) updateCompressButtonState();
    if (pdfToImgSelectedFile) updatePdfToImgButtonState();
  }, 1000);
});
