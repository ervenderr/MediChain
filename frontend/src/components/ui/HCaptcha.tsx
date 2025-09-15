'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef } from 'react';

interface HCaptchaComponentProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function HCaptchaComponent({ onVerify, onError, onExpire }: HCaptchaComponentProps) {
  const captchaRef = useRef<HCaptcha>(null);

  // Use environment variable for site key, fallback to test key
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

  const handleVerify = (token: string) => {
    onVerify(token);
  };

  const handleError = () => {
    onError?.();
  };

  const handleExpire = () => {
    onExpire?.();
  };

  return (
    <div className="hcaptcha-container">
      <HCaptcha
        ref={captchaRef}
        sitekey={siteKey}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
      />
    </div>
  );
}