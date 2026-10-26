import React from 'react';
import { HistoryStep } from '../types/editor';
import { History, Check, Clock, RotateCcw } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryStep[];
  currentIndex: number;
  onJumpToStep: (index: number) => void;
  onResetAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onJumpToStep,
  onResetAll
}) => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">View Edits (History)</h3>
          <p className="panel-desc">Parametric non-destructive edit ledger</p>
        </div>
        {history.length > 1 && (
          <button
            type="button"
            className="action-pill-btn btn-danger-text"
            onClick={onResetAll}
            title="Reset all edits back to original photo"
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      <div className="history-list">
        {history.map((step, idx) => {
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;
          const timeStr = new Date(step.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div
              key={step.id}
              className={`history-item ${isCurrent ? 'is-current' : ''} ${isFuture ? 'is-future' : ''}`}
              onClick={() => onJumpToStep(idx)}
            >
              <div className="history-step-indicator">
                {isCurrent ? (
                  <div className="step-circle current">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className={`step-circle ${isFuture ? 'future' : 'past'}`} />
                )}
                {idx < history.length - 1 && <div className="step-line" />}
              </div>

              <div className="history-step-details">
                <div className="history-step-top">
                  <span className="history-step-title">{step.label}</span>
                  <span className="history-step-index">#{idx}</span>
                </div>
                <div className="history-step-meta">
                  <Clock size={11} />
                  <span>{timeStr}</span>
                  {idx === 0 && <span className="history-root-tag">ORIGINAL</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
