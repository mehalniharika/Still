import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sliders,
  Spline,
  Paintbrush,
  Download
} from 'lucide-react';

interface EmptyStateProps {
  onOpenFile: (file: File) => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenFile,
  onLoadSample,
  isLoadingSample
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name))) {
      onOpenFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onOpenFile(file);
    e.target.value = '';
  };

  const features = [
    { num: '01', title: 'PARAMETRIC EDITING', desc: 'Shape light and colour without altering the original.', icon: <Sliders size={16} /> },
    { num: '02', title: 'TONE CURVES', desc: 'Precise spline tonal control across colour channels.', icon: <Spline size={16} /> },
    { num: '03', title: 'SELECTIVE MASKING', desc: 'Paint local adjustments with a live mask overlay.', icon: <Paintbrush size={16} /> },
    { num: '04', title: 'FULL-RES EXPORT', desc: 'Take every considered detail at native resolution.', icon: <Download size={16} /> },
  ];

  return (
    <div className="empty-state-root">
      {/* Landing hero */}
      <section className="landing-hero">
        {/* Copy */}
        <div className="landing-hero-copy">
          <span className="eyebrow">MAKE THE MOMENT STAY.</span>
          <h1>A space to see differently.</h1>
          <p>
            A considered photo editor for colour, light, and detail.
            Built for observation, not distraction.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`dropzone-card${isDragOver ? ' is-drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden-file-input"
            onChange={handleFileInputChange}
          />

          <div className="dropzone-icon-glow">
            <UploadCloud size={34} className="dropzone-icon" />
          </div>

          <h2 className="dropzone-title">DROP AN IMAGE HERE</h2>
          <p className="dropzone-subtitle">
            JPEG · PNG · WEBP&nbsp;&nbsp;·&nbsp;&nbsp;FULL RESOLUTION
          </p>

          <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={15} />
              <span>OPEN PHOTO</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={onLoadSample}
              disabled={isLoadingSample}
            >
              <ImageIcon size={15} />
              <span>{isLoadingSample ? 'GENERATING…' : 'LOAD SAMPLE'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <div className="feature-cards-grid">
        {features.map((f) => (
          <article key={f.num} className="feature-card">
            <div className="feature-card-icon">{f.num}</div>
            <h3 className="feature-card-title">{f.title}</h3>
            <p className="feature-card-desc">{f.desc}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
