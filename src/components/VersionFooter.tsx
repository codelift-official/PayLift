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

  if (!versionData || !versionData.version) {
    return null;
  }

  const ver = versionData.version;
  const env = versionData.environment || 'Production';
  const text = versionData.gitSha
    ? `Billify v${ver} (${versionData.gitSha}) · ${env}`
    : `Billify v${ver} · ${env}`;

  return (
    <div
      className="text-xs text-center mt-4"
      style={{ color: 'var(--text-muted)' }}
    >
      {text}
    </div>
  );
};
