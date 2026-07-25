document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const toolPanels = document.querySelectorAll('.tool-panel');

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

  // DOM Elements - 4. Protect PDF Tool
  const panelProtect = document.getElementById('panelProtect');
  const protectDropZone = document.getElementById('protectDropZone');
  const protectFileInput = document.getElementById('protectFileInput');
  const protectFileInfo = document.getElementById('protectFileInfo');
  const protectFileName = document.getElementById('protectFileName');
  const protectFileSize = document.getElementById('protectFileSize');
  const protectRemoveBtn = document.getElementById('protectRemoveBtn');
  const protectPasswordInput = document.getElementById('protectPasswordInput');
  const protectBtn = document.getElementById('protectBtn');
  const protectResults = document.getElementById('protectResults');
  const protectResetBtn = document.getElementById('protectResetBtn');
  const protectDownloadBtn = document.getElementById('protectDownloadBtn');

  // ==========================================
  // Application State
  // ==========================================
  let isGhostscriptWorking = true;

  // 1. Compress PDF State
  let compressSelectedFile = null;
  let compressSelectedQuality = 'ebook';
  let isCompressing = false;

  // 2. PDF to Image State
  let pdfToImgSelectedFile = null;
  let pdfToImgSelectedFormat = 'png';
  let pdfToImgSelectedDpi = '150';

  // 3. Image to PDF State
  let imgToPdfSelectedFiles = []; // Array of { file, previewUrl }
  let imgToPdfSelectedLayout = 'original';
  let imgToPdfSelectedMargin = '0';

  // 4. Protect PDF State
  let protectSelectedFile = null;
  let isProtecting = false;

  // ==========================================
  // Router Category & Sub-Tool Control
  // ==========================================
  const catTabButtons = document.querySelectorAll('.cat-tab-btn');
  const subTabButtons = document.querySelectorAll('.sub-tab-btn');
  const subGroupPdf = document.getElementById('subGroupPdf');
  const subGroupImage = document.getElementById('subGroupImage');

  function openToolPanel(tabName) {
    toolPanels.forEach(p => p.classList.add('hidden'));
    subTabButtons.forEach(b => b.classList.remove('active'));

    const activeSubBtn = document.querySelector(`.sub-tab-btn[data-tab="${tabName}"]`);
    if (activeSubBtn) activeSubBtn.classList.add('active');

    if (tabName === 'compress') {
      document.getElementById('panelCompress').classList.remove('hidden');
    } else if (tabName === 'compress-img') {
      document.getElementById('panelCompressImg').classList.remove('hidden');
    } else if (tabName === 'pdf-to-img') {
      document.getElementById('panelPdfToImg').classList.remove('hidden');
    } else if (tabName === 'img-to-pdf') {
      document.getElementById('panelImgToPdf').classList.remove('hidden');
    } else if (tabName === 'img-to-word') {
      document.getElementById('panelImgToWord').classList.remove('hidden');
    } else if (tabName === 'office-to-pdf') {
      document.getElementById('panelOfficeToPdf').classList.remove('hidden');
    } else if (tabName === 'pdf-to-excel') {
      document.getElementById('panelPdfToExcel').classList.remove('hidden');
    } else if (tabName === 'protect') {
      document.getElementById('panelProtect').classList.remove('hidden');
    } else if (tabName === 'unlock') {
      document.getElementById('panelUnlock').classList.remove('hidden');
    }
  }

  catTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');

      if (cat === 'pdf') {
        subGroupPdf.classList.remove('hidden');
        subGroupImage.classList.add('hidden');
        openToolPanel('compress');
      } else if (cat === 'image') {
        subGroupImage.classList.remove('hidden');
        subGroupPdf.classList.add('hidden');
        openToolPanel('compress-img');
      } else if (cat === 'protect') {
        subGroupPdf.classList.add('hidden');
        subGroupImage.classList.add('hidden');
        openToolPanel('protect');
      }
    });
  });

  subTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      openToolPanel(tabName);
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
    } catch (error) {
      console.error('Failed to query diagnostics API:', error);
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
      alert('Nano Doc only supports PDF files.');
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
      if (isCompressing) return; // Prevent changing preset during processing
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
    if (!compressSelectedFile || !isGhostscriptWorking || isCompressing) return;

    isCompressing = true;
    presetCards.forEach(c => {
      c.style.opacity = '0.5';
      c.style.cursor = 'not-allowed';
    });
    compressBtn.disabled = true;
    btnText.textContent = 'Processing PDF...';
    btnLoader.classList.remove('hidden');
    dropZone.style.pointerEvents = 'none';

    const formData = new FormData();
    formData.append('pdf', compressSelectedFile);
    formData.append('quality', compressSelectedQuality);

    const unlockUI = () => {
      isCompressing = false;
      presetCards.forEach(c => {
        c.style.opacity = '1';
        c.style.cursor = 'pointer';
      });
      dropZone.style.pointerEvents = 'auto';
    };

    const renderSuccess = (data) => {
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
      unlockUI();
    };

    const handleError = (err) => {
      console.error(err);
      alert(`Compression Failed:\n${err.message}`);
      compressBtn.disabled = false;
      btnText.textContent = 'Optimize Document';
      btnLoader.classList.add('hidden');
      unlockUI();
    };

    const pollJobStatus = async (jobId) => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Job not found');
        
        if (data.status === 'completed') {
          renderSuccess(data);
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Processing failed');
        } else if (data.status === 'processing') {
          setTimeout(() => pollJobStatus(jobId), 2000);
        }
      } catch (err) {
        handleError(err);
      }
    };

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Compression error occurred');

      if (data.status === 'processing') {
        pollJobStatus(data.jobId);
      } else {
        renderSuccess(data);
      }
    } catch (err) {
      handleError(err);
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
    isCompressing = false;
    presetCards.forEach(c => {
      c.style.opacity = '1';
      c.style.cursor = 'pointer';
    });
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

  // ==========================================
  // 4. Protect PDF Logic
  // ==========================================

  function updateProtectButtonState() {
    if (protectSelectedFile && isGhostscriptWorking && protectPasswordInput.value.length > 0 && !isProtecting) {
      protectBtn.disabled = false;
    } else {
      protectBtn.disabled = true;
    }
  }

  protectPasswordInput.addEventListener('input', updateProtectButtonState);

  setupDragAndDrop(protectDropZone, protectFileInput, (file) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Nano Doc only supports PDF files.');
      return;
    }
    protectSelectedFile = file;
    protectFileName.textContent = file.name;
    protectFileSize.textContent = formatBytes(file.size);
    
    protectDropZone.querySelector('.drop-content > .drop-illustration').classList.add('hidden');
    protectDropZone.querySelector('.drop-title').classList.add('hidden');
    protectDropZone.querySelector('.drop-subtitle').classList.add('hidden');
    protectFileInfo.classList.remove('hidden');
    
    updateProtectButtonState();
  });

  protectRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    protectSelectedFile = null;
    protectFileInput.value = '';
    
    protectFileInfo.classList.add('hidden');
    protectDropZone.querySelector('.drop-content > .drop-illustration').classList.remove('hidden');
    protectDropZone.querySelector('.drop-title').classList.remove('hidden');
    protectDropZone.querySelector('.drop-subtitle').classList.remove('hidden');
    
    updateProtectButtonState();
  });

  async function pollProtectJobStatus(jobId) {
    try {
      const res = await fetch(`/api/status/${jobId}`);
      if (!res.ok) throw new Error('Status API Error');
      const job = await res.json();

      if (job.status === 'completed') {
        protectDownloadBtn.setAttribute('href', job.downloadUrl);
        protectResults.classList.remove('hidden');
        protectResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        protectBtn.innerHTML = 'Protected!';
        protectDropZone.style.pointerEvents = 'auto';
        protectDropZone.style.opacity = '1';
        protectPasswordInput.disabled = false;
        isProtecting = false;
      } else if (job.status === 'failed') {
        alert(`Protection Failed:\n${job.error || 'Ghostscript error'}`);
        resetProtectUI();
      } else {
        setTimeout(() => pollProtectJobStatus(jobId), 2000);
      }
    } catch (e) {
      console.error('Polling error:', e);
      alert('Lost connection to server while protecting.');
      resetProtectUI();
    }
  }

  function resetProtectUI() {
    protectBtn.disabled = false;
    protectBtn.innerHTML = `Lock PDF
      <div class="icon">
        <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0h24v24H0z" fill="none"></path>
          <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
        </svg>
      </div>`;
    protectDropZone.style.pointerEvents = 'auto';
    protectDropZone.style.opacity = '1';
    protectPasswordInput.disabled = false;
    isProtecting = false;
  }

  protectBtn.addEventListener('click', async () => {
    if (!protectSelectedFile || !protectPasswordInput.value) return;

    const formData = new FormData();
    formData.append('pdf', protectSelectedFile);
    formData.append('password', protectPasswordInput.value);

    protectBtn.disabled = true;
    isProtecting = true;
    protectBtn.innerHTML = `Protecting...`;
    
    protectDropZone.style.pointerEvents = 'none';
    protectDropZone.style.opacity = '0.5';
    protectPasswordInput.disabled = true;

    try {
      const response = await fetch('/api/protect', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      
      pollProtectJobStatus(data.jobId);
    } catch (err) {
      console.error(err);
      alert(`Upload Failed:\n${err.message}`);
      resetProtectUI();
    }
  });

  protectResetBtn.addEventListener('click', () => {
    protectSelectedFile = null;
    protectFileInput.value = '';
    protectPasswordInput.value = '';
    protectResults.classList.add('hidden');
    
    protectFileInfo.classList.add('hidden');
    protectDropZone.querySelector('.drop-content > .drop-illustration').classList.remove('hidden');
    protectDropZone.querySelector('.drop-title').classList.remove('hidden');
    protectDropZone.querySelector('.drop-subtitle').classList.remove('hidden');
    
    updateProtectButtonState();
  });

  // ==========================================
  // 5. Compress Image Tool Logic
  // ==========================================
  const compressImgDropZone = document.getElementById('compressImgDropZone');
  const compressImgFileInput = document.getElementById('compressImgFileInput');
  const compressImgFileInfo = document.getElementById('compressImgFileInfo');
  const compressImgFileName = document.getElementById('compressImgFileName');
  const compressImgFileSize = document.getElementById('compressImgFileSize');
  const compressImgRemoveBtn = document.getElementById('compressImgRemoveBtn');
  const compressImgPresetCards = document.querySelectorAll('#compressImgPresetGrid .preset-card');
  const compressImgBtn = document.getElementById('compressImgBtn');
  const compressImgResults = document.getElementById('compressImgResults');
  const compressImgOriginalSize = document.getElementById('compressImgOriginalSize');
  const compressImgResultSize = document.getElementById('compressImgResultSize');
  const compressImgSavingsVal = document.getElementById('compressImgSavingsVal');
  const compressImgDownloadBtn = document.getElementById('compressImgDownloadBtn');
  const compressImgResetBtn = document.getElementById('compressImgResetBtn');

  let compressImgSelectedFile = null;
  let compressImgSelectedQuality = 'medium';

  setupDragAndDrop(compressImgDropZone, compressImgFileInput, (file) => {
    compressImgSelectedFile = file;
    compressImgFileName.textContent = file.name;
    compressImgFileSize.textContent = formatBytes(file.size);
    compressImgFileInfo.classList.remove('hidden');
    compressImgBtn.disabled = false;
  });

  compressImgRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    compressImgSelectedFile = null;
    compressImgFileInput.value = '';
    compressImgFileInfo.classList.add('hidden');
    compressImgBtn.disabled = true;
  });

  compressImgPresetCards.forEach(card => {
    card.addEventListener('click', () => {
      compressImgPresetCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      compressImgSelectedQuality = card.getAttribute('data-img-quality');
    });
  });

  compressImgBtn.addEventListener('click', async () => {
    if (!compressImgSelectedFile) return;
    compressImgBtn.disabled = true;
    const formData = new FormData();
    formData.append('image', compressImgSelectedFile);
    formData.append('quality', compressImgSelectedQuality);

    try {
      const res = await fetch('/api/compress-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compress image');

      compressImgOriginalSize.textContent = formatBytes(data.originalSize);
      compressImgResultSize.textContent = formatBytes(data.compressedSize);
      compressImgSavingsVal.textContent = `${data.savedPercent}%`;
      compressImgDownloadBtn.href = data.downloadUrl;
      compressImgResults.classList.remove('hidden');
    } catch (err) {
      alert(`Image Compression Error:\n${err.message}`);
    } finally {
      compressImgBtn.disabled = false;
    }
  });

  compressImgResetBtn.addEventListener('click', () => {
    compressImgSelectedFile = null;
    compressImgFileInput.value = '';
    compressImgFileInfo.classList.add('hidden');
    compressImgResults.classList.add('hidden');
    compressImgBtn.disabled = true;
  });

  // ==========================================
  // 6. Image to Word Tool Logic
  // ==========================================
  const imgToWordDropZone = document.getElementById('imgToWordDropZone');
  const imgToWordFileInput = document.getElementById('imgToWordFileInput');
  const imgToWordFileInfo = document.getElementById('imgToWordFileInfo');
  const imgToWordFileName = document.getElementById('imgToWordFileName');
  const imgToWordRemoveBtn = document.getElementById('imgToWordRemoveBtn');
  const imgToWordBtn = document.getElementById('imgToWordBtn');
  const imgToWordResults = document.getElementById('imgToWordResults');
  const imgToWordDownloadBtn = document.getElementById('imgToWordDownloadBtn');
  const imgToWordResetBtn = document.getElementById('imgToWordResetBtn');

  let imgToWordFiles = [];

  setupDragAndDrop(imgToWordDropZone, imgToWordFileInput, (file) => {
    imgToWordFiles.push(file);
    imgToWordFileName.textContent = `${imgToWordFiles.length} image(s) selected`;
    imgToWordFileInfo.classList.remove('hidden');
    imgToWordBtn.disabled = false;
  }, true);

  imgToWordRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    imgToWordFiles = [];
    imgToWordFileInput.value = '';
    imgToWordFileInfo.classList.add('hidden');
    imgToWordBtn.disabled = true;
  });

  imgToWordBtn.addEventListener('click', async () => {
    if (imgToWordFiles.length === 0) return;
    imgToWordBtn.disabled = true;
    const formData = new FormData();
    imgToWordFiles.forEach(f => formData.append('images', f));

    try {
      const res = await fetch('/api/image-to-word', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert to Word');

      imgToWordDownloadBtn.href = data.downloadUrl;
      imgToWordResults.classList.remove('hidden');
    } catch (err) {
      alert(`Image to Word Error:\n${err.message}`);
    } finally {
      imgToWordBtn.disabled = false;
    }
  });

  imgToWordResetBtn.addEventListener('click', () => {
    imgToWordFiles = [];
    imgToWordFileInput.value = '';
    imgToWordFileInfo.classList.add('hidden');
    imgToWordResults.classList.add('hidden');
    imgToWordBtn.disabled = true;
  });

  // ==========================================
  // 7. Office to PDF Tool Logic
  // ==========================================
  const officeToPdfDropZone = document.getElementById('officeToPdfDropZone');
  const officeToPdfFileInput = document.getElementById('officeToPdfFileInput');
  const officeToPdfFileInfo = document.getElementById('officeToPdfFileInfo');
  const officeToPdfFileName = document.getElementById('officeToPdfFileName');
  const officeToPdfFileSize = document.getElementById('officeToPdfFileSize');
  const officeToPdfRemoveBtn = document.getElementById('officeToPdfRemoveBtn');
  const officeToPdfBtn = document.getElementById('officeToPdfBtn');
  const officeToPdfResults = document.getElementById('officeToPdfResults');
  const officeToPdfDownloadBtn = document.getElementById('officeToPdfDownloadBtn');
  const officeToPdfResetBtn = document.getElementById('officeToPdfResetBtn');

  let officeToPdfFile = null;

  setupDragAndDrop(officeToPdfDropZone, officeToPdfFileInput, (file) => {
    officeToPdfFile = file;
    officeToPdfFileName.textContent = file.name;
    officeToPdfFileSize.textContent = formatBytes(file.size);
    officeToPdfFileInfo.classList.remove('hidden');
    officeToPdfBtn.disabled = false;
  });

  officeToPdfRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    officeToPdfFile = null;
    officeToPdfFileInput.value = '';
    officeToPdfFileInfo.classList.add('hidden');
    officeToPdfBtn.disabled = true;
  });

  officeToPdfBtn.addEventListener('click', async () => {
    if (!officeToPdfFile) return;
    officeToPdfBtn.disabled = true;
    const formData = new FormData();
    formData.append('document', officeToPdfFile);

    try {
      const res = await fetch('/api/office-to-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert document to PDF');

      officeToPdfDownloadBtn.href = data.downloadUrl;
      officeToPdfResults.classList.remove('hidden');
    } catch (err) {
      alert(`Office to PDF Error:\n${err.message}`);
    } finally {
      officeToPdfBtn.disabled = false;
    }
  });

  officeToPdfResetBtn.addEventListener('click', () => {
    officeToPdfFile = null;
    officeToPdfFileInput.value = '';
    officeToPdfFileInfo.classList.add('hidden');
    officeToPdfResults.classList.add('hidden');
    officeToPdfBtn.disabled = true;
  });

  // ==========================================
  // 8. PDF to Excel Tool Logic
  // ==========================================
  const pdfToExcelDropZone = document.getElementById('pdfToExcelDropZone');
  const pdfToExcelFileInput = document.getElementById('pdfToExcelFileInput');
  const pdfToExcelFileInfo = document.getElementById('pdfToExcelFileInfo');
  const pdfToExcelFileName = document.getElementById('pdfToExcelFileName');
  const pdfToExcelFileSize = document.getElementById('pdfToExcelFileSize');
  const pdfToExcelRemoveBtn = document.getElementById('pdfToExcelRemoveBtn');
  const pdfToExcelBtn = document.getElementById('pdfToExcelBtn');
  const pdfToExcelResults = document.getElementById('pdfToExcelResults');
  const pdfToExcelDownloadBtn = document.getElementById('pdfToExcelDownloadBtn');
  const pdfToExcelResetBtn = document.getElementById('pdfToExcelResetBtn');

  let pdfToExcelFile = null;

  setupDragAndDrop(pdfToExcelDropZone, pdfToExcelFileInput, (file) => {
    pdfToExcelFile = file;
    pdfToExcelFileName.textContent = file.name;
    pdfToExcelFileSize.textContent = formatBytes(file.size);
    pdfToExcelFileInfo.classList.remove('hidden');
    pdfToExcelBtn.disabled = false;
  });

  pdfToExcelRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pdfToExcelFile = null;
    pdfToExcelFileInput.value = '';
    pdfToExcelFileInfo.classList.add('hidden');
    pdfToExcelBtn.disabled = true;
  });

  pdfToExcelBtn.addEventListener('click', async () => {
    if (!pdfToExcelFile) return;
    pdfToExcelBtn.disabled = true;
    const formData = new FormData();
    formData.append('pdf', pdfToExcelFile);

    try {
      const res = await fetch('/api/pdf-to-excel', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract PDF to Excel');

      pdfToExcelDownloadBtn.href = data.downloadUrl;
      pdfToExcelResults.classList.remove('hidden');
    } catch (err) {
      alert(`PDF to Excel Error:\n${err.message}`);
    } finally {
      pdfToExcelBtn.disabled = false;
    }
  });

  pdfToExcelResetBtn.addEventListener('click', () => {
    pdfToExcelFile = null;
    pdfToExcelFileInput.value = '';
    pdfToExcelFileInfo.classList.add('hidden');
    pdfToExcelResults.classList.add('hidden');
    pdfToExcelBtn.disabled = true;
  });

  // ==========================================
  // UNLOCK PDF TOOL HANDLERS
  // ==========================================
  const unlockDropZone = document.getElementById('unlockDropZone');
  const unlockFileInput = document.getElementById('unlockFileInput');
  const unlockFileInfo = document.getElementById('unlockFileInfo');
  const unlockFileName = document.getElementById('unlockFileName');
  const unlockFileSize = document.getElementById('unlockFileSize');
  const unlockRemoveBtn = document.getElementById('unlockRemoveBtn');
  const unlockBtn = document.getElementById('unlockBtn');
  const unlockResults = document.getElementById('unlockResults');
  const unlockDownloadBtn = document.getElementById('unlockDownloadBtn');
  const unlockResetBtn = document.getElementById('unlockResetBtn');
  let unlockFile = null;

  function handleUnlockFileSelect(file) {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    unlockFile = file;
    unlockFileName.textContent = file.name;
    unlockFileSize.textContent = formatBytes(file.size);
    unlockFileInfo.classList.remove('hidden');
    unlockBtn.disabled = false;
  }

  unlockDropZone.addEventListener('dragover', (e) => { e.preventDefault(); unlockDropZone.classList.add('drag-over'); });
  unlockDropZone.addEventListener('dragleave', () => unlockDropZone.classList.remove('drag-over'));
  unlockDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    unlockDropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleUnlockFileSelect(e.dataTransfer.files[0]);
  });
  unlockFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleUnlockFileSelect(e.target.files[0]);
  });
  unlockRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    unlockFile = null;
    unlockFileInput.value = '';
    unlockFileInfo.classList.add('hidden');
    unlockBtn.disabled = true;
  });

  unlockBtn.addEventListener('click', async () => {
    if (!unlockFile) return;
    unlockBtn.disabled = true;
    const formData = new FormData();
    formData.append('pdf', unlockFile);

    try {
      const res = await fetch('/api/unlock', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlock PDF');

      unlockDownloadBtn.href = data.downloadUrl;
      unlockResults.classList.remove('hidden');
    } catch (err) {
      alert(`Unlock PDF Error:\n${err.message}`);
    } finally {
      unlockBtn.disabled = false;
    }
  });

  unlockResetBtn.addEventListener('click', () => {
    unlockFile = null;
    unlockFileInput.value = '';
    unlockFileInfo.classList.add('hidden');
    unlockResults.classList.add('hidden');
    unlockBtn.disabled = true;
  });

  // Watch for dynamic updates to Ghostscript diagnostic status
  setInterval(() => {
    if (compressSelectedFile) updateCompressButtonState();
    if (pdfToImgSelectedFile) updatePdfToImgButtonState();
  }, 1000);
});
