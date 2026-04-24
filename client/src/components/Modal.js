import React from 'react';

export default function Modal({ title, children, onClose, onSave, saveLabel = 'Save' }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          {onSave && <button className="btn btn-save" onClick={onSave}>{saveLabel}</button>}
        </div>
      </div>
    </div>
  );
}
