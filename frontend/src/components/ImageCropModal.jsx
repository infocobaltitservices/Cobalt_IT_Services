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

function getPlacement(containerWidth, containerHeight, imageWidth, imageHeight, zoom, xPercent, yPercent) {
  const fitScale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const width = imageWidth * fitScale * zoom;
  const height = imageHeight * fitScale * zoom;
  const centerLeft = (containerWidth - width) / 2;
  const centerTop = (containerHeight - height) / 2;
  const panX = (Math.abs(containerWidth - width) / 2) * xPercent;
  const panY = (Math.abs(containerHeight - height) / 2) * yPercent;

  return {
    width,
    height,
    left: centerLeft + panX,
    top: centerTop + panY,
  };
}

async function cropImageToDataUrl(src, crop) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = crop.outputWidth;
  canvas.height = crop.outputHeight;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const placement = getPlacement(canvas.width, canvas.height, image.width, image.height, crop.zoom, crop.xPercent, crop.yPercent);
  context.drawImage(image, placement.left, placement.top, placement.width, placement.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function ImageCropModal({ isOpen, onClose, onSave, aspect = 1, outputWidth = 1200, outputHeight = 1200 }) {
  const [source, setSource] = useState("");
  const [imageMeta, setImageMeta] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [xPercent, setXPercent] = useState(0);
  const [yPercent, setYPercent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewBox, setPreviewBox] = useState({ width: 0, height: 0 });
  const previewRef = useRef(null);
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
      setImageMeta(null);
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

  useEffect(() => {
    if (!previewRef.current || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (!box) return;
      setPreviewBox({ width: box.width, height: box.height });
    });

    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  const previewPlacement = useMemo(() => {
    if (!imageMeta?.width || !imageMeta?.height || !previewBox.width || !previewBox.height) return null;
    return getPlacement(previewBox.width, previewBox.height, imageMeta.width, imageMeta.height, zoom, xPercent, yPercent);
  }, [imageMeta, previewBox.height, previewBox.width, xPercent, yPercent, zoom]);

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
    loadImage(objectUrlRef.current)
      .then((image) => setImageMeta({ width: image.width, height: image.height }))
      .catch(() => setImageMeta(null));
  }

  function handleReset() {
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

          <div className={`admin-crop-preview ${source ? "has-image" : ""}`} style={viewportStyle} ref={previewRef}>
            {source ? (
              previewPlacement ? (
                <img
                  className="admin-crop-preview-image"
                  src={source}
                  alt="Crop preview"
                  style={{
                    position: "absolute",
                    width: `${previewPlacement.width}px`,
                    height: `${previewPlacement.height}px`,
                    left: `${previewPlacement.left}px`,
                    top: `${previewPlacement.top}px`,
                  }}
                />
              ) : (
                <img className="admin-crop-preview-image" src={source} alt="Crop preview" />
              )
            ) : (
              <span>Select an image to start cropping</span>
            )}
          </div>

          <div className="admin-crop-controls">
            <label>
              Zoom
              <input type="range" min="0.5" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </label>
            <label>
              Horizontal
              <input type="range" min="-1" max="1" step="0.01" value={xPercent} onChange={(event) => setXPercent(Number(event.target.value))} />
            </label>
            <label>
              Vertical
              <input type="range" min="-1" max="1" step="0.01" value={yPercent} onChange={(event) => setYPercent(Number(event.target.value))} />
            </label>
            <button type="button" className="btn secondary" onClick={handleReset} disabled={!source}>
              Reset crop
            </button>
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
