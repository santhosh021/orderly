import { useEffect, useState, type CSSProperties } from 'react';
import type { Product } from '../types';

interface Props {
  product: Pick<Product, 'id' | 'name' | 'imageUrl'>;
  className?: string;
}

/** Shows the product photo; if there is none (or it fails to load) a coloured initial is shown instead. */
export default function ProductImage({ product, className = '' }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [product.imageUrl]);

  if (!product.imageUrl || failed) {
    return (
      <div
        className={`img-fallback ${className}`}
        style={{ '--hue': String((product.id * 47) % 360) } as CSSProperties}
      >
        {product.name.trim().charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
