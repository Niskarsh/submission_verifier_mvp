import React from 'react';
import './CollapsibleSection.css';

function CollapsibleSection({ title, status, isCollapsed, onToggle, children }) {
  return (
    <div className="collapsible-section">
      <div className="collapsible-header" onClick={onToggle}>
        <h3>
          {title} <span className="section-status">{status}</span>
          <span className="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
        </h3>
      </div>
      {!isCollapsed && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleSection;
