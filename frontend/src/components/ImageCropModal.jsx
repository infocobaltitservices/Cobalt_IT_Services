import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function cropImageToDataUrl(src, crop) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = crop.outputWidth;
  canvas.height = crop.outputHeight;
  const context = canvas.getContext("2d");

  const targetAspect = crop.outputWidth / crop.outputHeight;
  const imageAspect = image.width / image.height;

  let baseSourceWidth;
  let baseSourceHeight;

  if (imageAspect > targetAspect) {
    baseSourceHeight = image.height;
    baseSourceWidth = image.height * targetAspect;
  } else {
    baseSourceWidth = image.width;
    baseSourceHeight = image.width / targetAspect;
  }

  const sourceWidth = Math.min(image.width, baseSourceWidth / crop.zoom);
  const sourceHeight = Math.min(image.height, baseSourceHeight / crop.zoom);
  const maxSourceX = Math.max(image.width - sourceWidth, 0);
  const maxSourceY = Math.max(image.height - sourceHeight, 0);
  const sourceX = clamp(maxSourceX * crop.xPercent, 0, maxSourceX);
  const sourceY = clamp(maxSourceY * crop.yPercent, 0, maxSourceY);

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function ImageCropModal({ isOpen, onClose, onSave, aspect = 1, outputWidth = 1200, outputHeight = 1200 }) {
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [xPercent, setXPercent] = useState(0);
  const [yPercent, setYPercent] = useState(0);
  const [saving, setSaving] = useState(false);
  const objectUrlRef = useRef("");

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSource("");
      setZoom(1);
      setXPercent(0);
      setYPercent(0);
      setSaving(false);
    }
  }, [isOpen]);

  const viewportStyle = useMemo(
    () => ({
      aspectRatio: `${aspect}`,
    }),
    [aspect]
  );

  if (!isOpen) {
    return null;
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    objectUrlRef.current = URL.createObjectURL(file);
    setSource(objectUrlRef.current);
    setZoom(1);
    setXPercent(0);
    setYPercent(0);
  }

  async function handleSave() {
    if (!source) return;
    setSaving(true);
    try {
      const dataUrl = await cropImageToDataUrl(source, {
        zoom,
        xPercent,
        yPercent,
        aspect,
        outputWidth,
        outputHeight,
        viewportWidth: outputWidth,
        viewportHeight: outputHeight,
      });
      await onSave(dataUrl);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal admin-crop-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-head">
          <strong>Crop image</strong>
          <button type="button" className="admin-close-button" onClick={onClose} aria-label="Close crop modal">
            ×
          </button>
        </div>
        <div className="admin-crop-body">
          <label className="admin-upload-button">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            Choose image
          </label>

          <div className={`admin-crop-preview ${source ? "has-image" : ""}`} style={viewportStyle}>
            {source ? (
              <img
                className="admin-crop-preview-image"
                src={source}
                alt="Crop preview"
                style={{
                  transform: `scale(${zoom})`,
                  objectPosition: `${xPercent * 100}% ${yPercent * 100}%`,
                }}
              />
            ) : (
              <span>Select an image to start cropping</span>
            )}
          </div>

          <div className="admin-crop-controls">
            <label>
              Zoom
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </label>
            <label>
              Horizontal
              <input type="range" min="0" max="1" step="0.01" value={xPercent} onChange={(event) => setXPercent(Number(event.target.value))} />
            </label>
            <label>
              Vertical
              <input type="range" min="0" max="1" step="0.01" value={yPercent} onChange={(event) => setYPercent(Number(event.target.value))} />
            </label>
          </div>
        </div>

        <div className="admin-modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={handleSave} disabled={!source || saving}>
            {saving ? "Saving..." : "Use image"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
