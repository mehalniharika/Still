import React, { useState, useRef } from 'react';
import { NormalizedRect } from '../types/editor';

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  cropRect: NormalizedRect;
  aspectRatio: number | null; // null = freeform, or width / height
  onChange: (rect: NormalizedRect) => void;
  viewportTransform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}

type HandleType =
  | 'move'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export const CropOverlay: React.FC<CropOverlayProps> = ({
  imageWidth,
  imageHeight,
  cropRect,
  aspectRatio,
  onChange,
  viewportTransform
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    initialRect: NormalizedRect;
  } | null>(null);

  const { scale, offsetX, offsetY } = viewportTransform;

  // Screen coordinates of the image box
  const imgScreenW = imageWidth * scale;
  const imgScreenH = imageHeight * scale;

  // Screen coordinates of the crop rectangle
  const cropLeft = offsetX + cropRect.x * imgScreenW;
  const cropTop = offsetY + cropRect.y * imgScreenH;
  const cropWidth = cropRect.width * imgScreenW;
  const cropHeight = cropRect.height * imgScreenH;

  const handlePointerDown = (handle: HandleType, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialRect: { ...cropRect }
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const { handle, startX, startY, initialRect } = dragRef.current;
    const deltaX = (e.clientX - startX) / imgScreenW;
    const deltaY = (e.clientY - startY) / imgScreenH;

    let newX = initialRect.x;
    let newY = initialRect.y;
    let newW = initialRect.width;
    let newH = initialRect.height;

    const minSize = 0.05; // 5% minimum crop dimension

    if (handle === 'move') {
      newX = Math.max(0, Math.min(1 - newW, initialRect.x + deltaX));
      newY = Math.max(0, Math.min(1 - newH, initialRect.y + deltaY));
    } else {
      // Resize handles
      if (handle.includes('right')) {
        newW = Math.max(minSize, Math.min(1 - initialRect.x, initialRect.width + deltaX));
      }
      if (handle.includes('bottom')) {
        newH = Math.max(minSize, Math.min(1 - initialRect.y, initialRect.height + deltaY));
      }
      if (handle.includes('left')) {
        const potentialW = initialRect.width - deltaX;
        if (potentialW >= minSize && initialRect.x + deltaX >= 0) {
          newX = initialRect.x + deltaX;
          newW = potentialW;
        }
      }
      if (handle.includes('top')) {
        const potentialH = initialRect.height - deltaY;
        if (potentialH >= minSize && initialRect.y + deltaY >= 0) {
          newY = initialRect.y + deltaY;
          newH = potentialH;
        }
      }

      // Aspect ratio lock (if specified)
      if (aspectRatio !== null && aspectRatio > 0) {
        // Pixel aspect ratio = (newW * imageWidth) / (newH * imageHeight)
        // target: (newW * imageWidth) / (newH * imageHeight) = aspectRatio
        // newH = (newW * imageWidth) / (imageHeight * aspectRatio)
        const targetH = (newW * imageWidth) / (imageHeight * aspectRatio);
        if (newY + targetH <= 1) {
          newH = targetH;
        } else {
          newH = 1 - newY;
          newW = (newH * imageHeight * aspectRatio) / imageWidth;
        }
      }
    }

    onChange({
      x: Math.max(0, Math.min(1 - minSize, newX)),
      y: Math.max(0, Math.min(1 - minSize, newY)),
      width: Math.max(minSize, Math.min(1, newW)),
      height: Math.max(minSize, Math.min(1, newH))
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      dragRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="crop-overlay-root"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Dimmed Surrounds */}
      {/* Top */}
      <div
        className="crop-dimmed"
        style={{
          left: offsetX,
          top: offsetY,
          width: imgScreenW,
          height: Math.max(0, cropTop - offsetY)
        }}
      />
      {/* Bottom */}
      <div
        className="crop-dimmed"
        style={{
          left: offsetX,
          top: cropTop + cropHeight,
          width: imgScreenW,
          height: Math.max(0, offsetY + imgScreenH - (cropTop + cropHeight))
        }}
      />
      {/* Left */}
      <div
        className="crop-dimmed"
        style={{
          left: offsetX,
          top: cropTop,
          width: Math.max(0, cropLeft - offsetX),
          height: cropHeight
        }}
      />
      {/* Right */}
      <div
        className="crop-dimmed"
        style={{
          left: cropLeft + cropWidth,
          top: cropTop,
          width: Math.max(0, offsetX + imgScreenW - (cropLeft + cropWidth)),
          height: cropHeight
        }}
      />

      {/* Active Crop Box */}
      <div
        className="crop-box"
        style={{
          left: cropLeft,
          top: cropTop,
          width: cropWidth,
          height: cropHeight
        }}
        onPointerDown={(e) => handlePointerDown('move', e)}
      >
        {/* Rule-of-Thirds Grid */}
        <div className="crop-grid-line crop-grid-h1" />
        <div className="crop-grid-line crop-grid-h2" />
        <div className="crop-grid-line crop-grid-v1" />
        <div className="crop-grid-line crop-grid-v2" />

        {/* 4 Corner Handles */}
        <div
          className="crop-handle crop-handle-tl"
          onPointerDown={(e) => handlePointerDown('top-left', e)}
        />
        <div
          className="crop-handle crop-handle-tr"
          onPointerDown={(e) => handlePointerDown('top-right', e)}
        />
        <div
          className="crop-handle crop-handle-bl"
          onPointerDown={(e) => handlePointerDown('bottom-left', e)}
        />
        <div
          className="crop-handle crop-handle-br"
          onPointerDown={(e) => handlePointerDown('bottom-right', e)}
        />

        {/* 4 Edge Handles */}
        <div
          className="crop-handle-edge crop-handle-top"
          onPointerDown={(e) => handlePointerDown('top', e)}
        />
        <div
          className="crop-handle-edge crop-handle-bottom"
          onPointerDown={(e) => handlePointerDown('bottom', e)}
        />
        <div
          className="crop-handle-edge crop-handle-left"
          onPointerDown={(e) => handlePointerDown('left', e)}
        />
        <div
          className="crop-handle-edge crop-handle-right"
          onPointerDown={(e) => handlePointerDown('right', e)}
        />
      </div>
    </div>
  );
};
