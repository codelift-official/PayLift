import React, { useState } from 'react';

interface CatalogImageProps {
  src?: string;
  alt: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
}

export const CatalogImage: React.FC<CatalogImageProps> = ({
  src,
  alt,
  fallbackIcon,
  className = 'w-12 h-12 object-cover rounded-xl',
}) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <div className="flex items-center justify-center shrink-0">{fallbackIcon}</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      loading="lazy"
    />
  );
};
