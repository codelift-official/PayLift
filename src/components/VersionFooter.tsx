import React, { useEffect, useState } from 'react';
import { fetchAppVersion } from '../lib/version';

interface VersionInfo {
  version?: string;
  gitSha?: string;
  environment?: string;
}

export const VersionFooter: React.FC = () => {
  const [versionData, setVersionData] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchAppVersion().then((data) => {
      if (isMounted && data) {
        setVersionData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const ver = versionData?.version || '1.0.3';
  const text = `Sahayak Billing v${ver}`;

  return (
    <div
      className="text-xs text-center mt-2 font-mono opacity-85"
      style={{ color: 'var(--text-muted)' }}
    >
      {text}
    </div>
  );
};
