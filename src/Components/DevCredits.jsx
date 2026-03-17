import React, { useState, useRef, useCallback } from "react";
import metaAffinityLogo from "../img/metaaffinity.png";

export default function DevCredits() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback((e) => {
    if (e.target === overlayRef.current) setOpen(false);
  }, []);

  return (
    <>
      {/* Logo badge */}
      <div className="dev-credit-badge" onClick={handleOpen} title="Developer Credits">
        <span className="dev-credit-badge-label">Developed by</span>
        <img src={metaAffinityLogo} alt="MetaAffinity" className="dev-credit-logo" />
      </div>

      {/* Credits overlay */}
      {open && (
        <div className="dev-credit-overlay" ref={overlayRef} onClick={handleClose}>
          <div className="dev-credit-modal">
            {/* Animated aurora background */}
            <div className="dev-credit-aurora">
              <div className="aurora-blob aurora-blob-1" />
              <div className="aurora-blob aurora-blob-2" />
              <div className="aurora-blob aurora-blob-3" />
              <div className="aurora-grid" />
            </div>

            {/* Content */}
            <div className="dev-credit-content">
              <div className="dev-credit-logo-ring">
                <img src={metaAffinityLogo} alt="MetaAffinity" className="dev-credit-hero-logo" />
              </div>
              <h2 className="dev-credit-name">Muhammad Imran</h2>
              <p className="dev-credit-role">Full-Stack Developer & 3D Designer</p>

              <div className="dev-credit-links">
                <a href="https://metaaffinity.net" target="_blank" rel="noopener noreferrer" className="dev-credit-link">
                  <span className="dev-credit-link-icon">&#127760;</span>
                  <span>metaaffinity.net</span>
                </a>
                <a href="mailto:metaaffinity@gmail.com" className="dev-credit-link">
                  <span className="dev-credit-link-icon">&#9993;</span>
                  <span>metaaffinity@gmail.com</span>
                </a>
              </div>

              <button className="dev-credit-close-btn" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
