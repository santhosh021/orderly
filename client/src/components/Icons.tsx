import type { ReactNode } from 'react';

function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const CartIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
  </Svg>
);

export const SearchIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);

export const MenuIcon = () => (
  <Svg>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const CloseIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const UploadIcon = () => (
  <Svg>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Svg>
);

export const ShieldIcon = () => (
  <Svg size={26}>
    <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

export const BoxIcon = () => (
  <Svg size={26}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </Svg>
);

export const TruckIcon = () => (
  <Svg size={26}>
    <path d="M2 6h11v10H2zM13 9h4l3 3v4h-7" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </Svg>
);

/** Icon for a category tile; unknown categories get a generic tag icon. */
export function CategoryIcon({ name }: { name: string }) {
  switch (name.toLowerCase()) {
    case 'audio':
      return (
        <Svg size={26}>
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <rect x="3" y="14" width="4" height="6" rx="1.5" />
          <rect x="17" y="14" width="4" height="6" rx="1.5" />
        </Svg>
      );
    case 'displays':
      return (
        <Svg size={26}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </Svg>
      );
    case 'storage':
      return (
        <Svg size={26}>
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <circle cx="16" cy="15" r="1" />
          <path d="M8 9h4" />
        </Svg>
      );
    case 'office':
      return (
        <Svg size={26}>
          <path d="M6 20v-6a6 6 0 0 1 12 0v6" />
          <path d="M3 20h18M12 14V4" />
        </Svg>
      );
    case 'accessories':
      return (
        <Svg size={26}>
          <rect x="7" y="3" width="10" height="18" rx="5" />
          <path d="M12 3v6" />
        </Svg>
      );
    default:
      return (
        <Svg size={26}>
          <path d="M3 12l9-9h8a1 1 0 0 1 1 1v8l-9 9-9-9z" />
          <circle cx="16" cy="8" r="1.3" />
        </Svg>
      );
  }
}
