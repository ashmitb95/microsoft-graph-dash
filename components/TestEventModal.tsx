import { useState } from 'react';
import TestEventGenerator from './TestEventGenerator';
import './TestEventModal.css';

const TestEventModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="test-events-cta"
      >
        Generate Test Events
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Generate Test Calendar Events</h2>
              <button
                className="modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <TestEventGenerator />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestEventModal;

