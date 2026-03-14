/**
 * LITTLE BLISS – AI Baby Try-On Feature
 * Uses Google Gemini 1.5 Flash API for image generation
 *
 * Flow:
 * 1. User clicks "Try on Your Baby" on a product card
 * 2. Modal opens with product info pre-loaded
 * 3. User uploads baby photo
 * 4. Both images + prompt sent to Gemini API
 * 5. AI-generated image result is shown
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  let currentProduct = { title: '', image: '' };
  let babyPhotoBase64 = '';
  let babyPhotoMime = 'image/jpeg';

  // ── Open/Close Modal ────────────────────────────────────────
  window.openAiTryon = function (product) {
    if (!window.LITTLE_BLISS || !window.LITTLE_BLISS.aiTryonEnabled) return;

    currentProduct = product || { title: '', image: '' };

    var modal = document.getElementById('ai-tryon-modal');
    if (!modal) return;

    // Reset state
    resetAiTryonInternal();

    // Set product name in subtitle
    var nameEl = document.getElementById('ai-product-name');
    if (nameEl && currentProduct.title) {
      nameEl.textContent = 'Outfit: ' + currentProduct.title;
    }

    // Show product image in preview if available
    if (currentProduct.image) {
      var productPreview = document.getElementById('ai-product-preview');
      if (productPreview) {
        productPreview.src = currentProduct.image;
      }
    }

    // Check API key
    var apiKey = window.LITTLE_BLISS.geminiApiKey;
    if (!apiKey || apiKey.trim() === '') {
      document.getElementById('ai-upload-zone').style.display = 'none';
      document.getElementById('ai-no-key').style.display = 'block';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeAiTryon = function () {
    var modal = document.getElementById('ai-tryon-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  window.resetAiTryon = function () {
    resetAiTryonInternal();
  };

  function resetAiTryonInternal() {
    babyPhotoBase64 = '';

    // Reset file input
    var fileInput = document.getElementById('ai-baby-photo');
    if (fileInput) fileInput.value = '';

    // Hide all states except upload
    setVisible('ai-upload-zone', true);
    setVisible('ai-preview-row', false);
    setVisible('ai-generate-btn', false);
    setVisible('ai-loading', false);
    setVisible('ai-result', false);
    setVisible('ai-error', false);
    setVisible('ai-no-key', false);

    // Reset product preview
    var productPreview = document.getElementById('ai-product-preview');
    if (productPreview) productPreview.src = '';
  }

  // ── File Upload Handler ─────────────────────────────────────
  window.handleBabyPhotoUpload = function (event) {
    var file = event.target.files[0];
    if (!file) return;

    // Validate
    var maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showError('Photo is too large (max 5MB). Please choose a smaller image.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file (JPG or PNG).');
      return;
    }

    babyPhotoMime = file.type;

    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      // Extract base64 without data URL prefix
      babyPhotoBase64 = dataUrl.split(',')[1];

      // Show preview
      var babyPreview = document.getElementById('ai-baby-preview');
      if (babyPreview) babyPreview.src = dataUrl;

      // Show product preview if we have it
      if (currentProduct.image) {
        var productPreview = document.getElementById('ai-product-preview');
        if (productPreview) productPreview.src = currentProduct.image;
      }

      setVisible('ai-upload-zone', false);
      setVisible('ai-preview-row', true);
      setVisible('ai-generate-btn', true);
    };
    reader.readAsDataURL(file);
  };

  // ── Generate AI Try-On ──────────────────────────────────────
  window.generateAiTryon = async function () {
    var apiKey = window.LITTLE_BLISS && window.LITTLE_BLISS.geminiApiKey;
    if (!apiKey) {
      showError('Gemini API key is not configured. Please contact the store admin.');
      return;
    }

    if (!babyPhotoBase64) {
      showError('Please upload your baby\'s photo first.');
      return;
    }

    // Show loading
    setVisible('ai-preview-row', false);
    setVisible('ai-generate-btn', false);
    setVisible('ai-loading', true);

    var productName = currentProduct.title || 'this baby outfit';
    var prompt = 'Generate a cute, realistic, and fun illustration-style image showing a baby wearing or holding "' + productName + '". The baby in the reference photo should be the subject. Keep the baby\'s facial features and expression. Make the image warm, playful, and suitable for a baby clothing store. The outfit should be clearly visible. Do not add any text or watermarks.';

    try {
      var parts = [
        {
          inline_data: {
            mime_type: babyPhotoMime,
            data: babyPhotoBase64
          }
        },
        {
          text: prompt
        }
      ];

      // ── Gemini 2.0 Flash (imagen model for generation) ──────
      // We use gemini-2.0-flash-exp which supports image output
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=' + apiKey;

      var body = {
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      };

      var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        var errMsg = (errData.error && errData.error.message) || ('API Error ' + response.status);
        throw new Error(errMsg);
      }

      var data = await response.json();

      // Extract generated image from response
      var candidates = data.candidates || [];
      var imagePart = null;

      outer:
      for (var c = 0; c < candidates.length; c++) {
        var content = candidates[c].content;
        if (content && content.parts) {
          for (var p = 0; p < content.parts.length; p++) {
            if (content.parts[p].inline_data) {
              imagePart = content.parts[p].inline_data;
              break outer;
            }
          }
        }
      }

      if (!imagePart) {
        // Fallback: try text response with description
        var textPart = null;
        for (var c2 = 0; c2 < candidates.length; c2++) {
          var content2 = candidates[c2].content;
          if (content2 && content2.parts) {
            for (var p2 = 0; p2 < content2.parts.length; p2++) {
              if (content2.parts[p2].text) {
                textPart = content2.parts[p2].text;
                break;
              }
            }
          }
        }
        throw new Error('No image was generated. The AI returned: ' + (textPart ? textPart.substring(0, 100) : 'no response.'));
      }

      var imageDataUrl = 'data:' + imagePart.mime_type + ';base64,' + imagePart.data;

      // Show result
      setVisible('ai-loading', false);
      var resultImg = document.getElementById('ai-result-img');
      if (resultImg) resultImg.src = imageDataUrl;

      var downloadBtn = document.getElementById('ai-download-btn');
      if (downloadBtn) downloadBtn.href = imageDataUrl;

      setVisible('ai-result', true);

    } catch (err) {
      console.error('[Little Bliss AI Try-On]', err);
      showError(err.message || 'Something went wrong. Please try again.');
    }
  };

  // ── Helpers ─────────────────────────────────────────────────
  function setVisible(id, visible) {
    var el = document.getElementById(id);
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  function showError(msg) {
    setVisible('ai-loading', false);
    setVisible('ai-preview-row', false);
    setVisible('ai-generate-btn', false);
    document.getElementById('ai-error-msg').textContent = msg;
    setVisible('ai-error', true);
  }

  // ── Drag & Drop on Upload Zone ──────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var zone = document.getElementById('ai-upload-zone');
    if (!zone) return;

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('dragover');
      var files = e.dataTransfer.files;
      if (files && files.length > 0) {
        var input = document.getElementById('ai-baby-photo');
        // Simulate file input change
        var dt = new DataTransfer();
        dt.items.add(files[0]);
        input.files = dt.files;
        handleBabyPhotoUpload({ target: input });
      }
    });
  });

  // ── Keyboard Close ───────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAiTryon();
  });

})();
