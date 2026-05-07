import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = "Rizqara Extraction" }) => {
  return (
    <div className="premium-loading-container">
      <div className="loading-brand">
        <div className="loading-logo-wrapper">
          <div className="logo-ring"></div>
          <div className="logo-ring-outer"></div>
          <div className="logo-inner">R</div>
        </div>
        <div className="loading-text-group">
          <h1>{message}</h1>
          <div className="loading-bar-wrapper">
            <div className="loading-bar-fill"></div>
          </div>
          <p>Initializing Secure Session...</p>
        </div>
      </div>

      <style jsx="true">{`
        .premium-loading-container {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .loading-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .loading-logo-wrapper {
          position: relative;
          width: 80px; height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-inner {
          font-size: 40px;
          font-weight: 900;
          color: var(--primary);
          z-index: 2;
        }

        .logo-ring {
          position: absolute;
          width: 100%; height: 100%;
          border: 4px solid rgba(139, 0, 0, 0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .logo-ring-outer {
          position: absolute;
          width: 120%; height: 120%;
          border: 2px solid rgba(139, 0, 0, 0.05);
          border-bottom-color: var(--primary);
          border-radius: 50%;
          animation: spin-reverse 2s linear infinite;
          opacity: 0.5;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          to { transform: rotate(-360deg); }
        }

        .loading-text-group {
          text-align: center;
        }

        .loading-text-group h1 {
          font-size: 24px;
          font-weight: 900;
          color: var(--text);
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .loading-bar-wrapper {
          width: 200px;
          height: 4px;
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
          margin: 0 auto 12px;
          overflow: hidden;
        }

        .loading-bar-fill {
          width: 50%;
          height: 100%;
          background: var(--primary);
          border-radius: 10px;
          animation: loading-bar-move 1.5s infinite ease-in-out;
        }

        @keyframes loading-bar-move {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(200%); width: 30%; }
        }

        .loading-text-group p {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
