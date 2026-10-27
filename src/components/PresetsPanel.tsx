import React, { useState, useMemo } from 'react';
import { PRESET_LOOKS, LOOK_CATEGORIES } from '../engine/presets';
import { PresetLook } from '../types/editor';
import { Check, RotateCcw, Search, X } from 'lucide-react';

interface PresetsPanelProps {
  activePresetId: string | null;
  onSelectPreset: (preset: PresetLook) => void;
  onClearPreset: () => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({
  activePresetId,
  onSelectPreset,
  onClearPreset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PRESET_LOOKS.length };
    LOOK_CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = PRESET_LOOKS.filter(p => p.category === cat.id).length;
      }
    });
    return counts;
  }, []);

  // Filter looks based on category and search query
  const filteredLooks = useMemo(() => {
    return PRESET_LOOKS.filter(preset => {
      const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        preset.name.toLowerCase().includes(q) ||
        preset.subtitle.toLowerCase().includes(q) ||
        preset.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  // Grouped looks for 'all' mode without active search
  const groupedSections = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim()) return null;

    return LOOK_CATEGORIES.filter(cat => cat.id !== 'all').map(cat => ({
      category: cat,
      looks: PRESET_LOOKS.filter(p => p.category === cat.id)
    }));
  }, [selectedCategory, searchQuery]);

  const renderPresetCard = (preset: PresetLook) => {
    const isSelected = preset.id === activePresetId;

    return (
      <div
        key={preset.id}
        className={`preset-card ${isSelected ? 'is-selected' : ''}`}
        onClick={() => onSelectPreset(preset)}
      >
        <div
          className="preset-swatch"
          style={{ background: preset.gradient }}
        />
        <div className="preset-info">
          <span className="preset-name">{preset.name}</span>
          <span className="preset-subtitle">{preset.subtitle}</span>
        </div>
        {isSelected && (
          <div className="preset-active-badge" style={{ marginLeft: 'auto' }}>
            <Check size={14} strokeWidth={3} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <span className="eyebrow">THE EDITOR / TOOL</span>
          <h2 className="panel-title">Looks</h2>
          <p className="panel-desc">Curated tonal recipes and calibrated grades</p>
        </div>
        {activePresetId && (
          <button
            type="button"
            className="action-pill-btn"
            onClick={onClearPreset}
            title="Reset to default unstyled look"
          >
            <RotateCcw size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Category Pills & Search Controls */}
      <div className="presets-controls">
        {/* Search */}
        <div className="presets-search-box">
          <Search size={13} className="presets-search-icon" />
          <input
            type="text"
            className="presets-search-input"
            placeholder="Search looks (e.g. skin, ccd, glow)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="presets-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="presets-category-pills">
          {LOOK_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                className={`preset-category-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                title={cat.description}
              >
                <span>{cat.label}</span>
                <span className="preset-category-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Looks List / Grouped Sections */}
      {groupedSections ? (
        // When viewing 'All', display categorized sections with dividers
        <div>
          {groupedSections.map(({ category, looks }) => (
            <div key={category.id} className="presets-section">
              <div className="presets-category-header">
                <span className="presets-category-title">{category.label}</span>
                <span className="presets-category-count">{looks.length} looks</span>
              </div>
              <div className="presets-grid">
                {looks.map(renderPresetCard)}
              </div>
            </div>
          ))}
        </div>
      ) : filteredLooks.length > 0 ? (
        // When viewing a specific category or search results
        <div className="presets-grid">
          {filteredLooks.map(renderPresetCard)}
        </div>
      ) : (
        <div className="presets-empty-search">
          <p>No looks match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};
