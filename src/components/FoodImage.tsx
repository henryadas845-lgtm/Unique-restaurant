import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { sanitizeImageUrl } from '../utils/format';

interface FoodImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
}) => {
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeImageUrl(src);

  if (!safeSrc || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-neutral-100 text-neutral-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <UtensilsCrossed className="w-8 h-8 mb-2 text-orange-500/70" strokeWidth={1.5} />
        <span className="text-xs font-medium text-neutral-500 line-clamp-2 max-w-[180px]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
