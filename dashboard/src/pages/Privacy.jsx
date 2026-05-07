import React from 'react';
import './Privacy.css';

const Privacy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: May 7, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to Rizqara Extraction. We value your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our Chrome Extension and Dashboard.
          </p>
        </section>

        <section>
          <h2>2. Data Collection</h2>
          <p><strong>Chrome Extension:</strong> When using the extension, we extract publicly available business information from Google Maps (names, phones, websites). This data is stored locally in your browser and synced to your secure dashboard.</p>
          <p><strong>Account Information:</strong> When you register, we collect your name, email address, and authentication credentials.</p>
        </section>

        <section>
          <h2>3. How We Use Your Data</h2>
          <p>We use the collected data specifically for:</p>
          <ul>
            <li>Providing and maintaining the lead extraction service.</li>
            <li>Syncing your leads across devices via the Rizqara Dashboard.</li>
            <li>Enforcing usage limits based on your subscription plan.</li>
            <li>Improving the accuracy of our lead enrichment algorithms.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Sharing & Security</h2>
          <p><strong>No Selling:</strong> We do not sell, trade, or rent your personal or extracted lead data to third parties.</p>
          <p><strong>Security:</strong> We implement industry-standard encryption and security measures to protect your data from unauthorized access or disclosure.</p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal data at any time through your account settings on the Rizqara Dashboard.</p>
        </section>

        <section>
          <h2>6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us via your Rizqara support channel.</p>
        </section>

        <div className="footer-links">
          <a href="/login">Return to Login</a>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
