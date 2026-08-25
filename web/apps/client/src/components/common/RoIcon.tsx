import React from "react";

export interface RoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  variant?: "monogram" | "valkyrie" | "poring";
}

/**
 * Ragnarok Online (RO) Brand Vector Icon Component
 * Designed to replace generic shield icons with the iconic Ragnarok Online identity.
 */
export const RoIcon: React.FC<RoIconProps> = ({
  size = 20,
  className = "",
  variant = "monogram",
  ...props
}) => {
  if (variant === "valkyrie") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* Central Holy Sword */}
        <line x1="12" y1="2" x2="12" y2="22" />
        <path d="M9 6h6" />
        <path d="M10 20l2 2 2-2" />
        {/* Valkyrie Wings Left */}
        <path d="M12 7C8.5 4 4 5 3 9c0 4 3.5 7 9 9" />
        <path d="M12 10C9.5 8 6 9 5 12c0 2.5 2.5 4.5 7 5.5" />
        {/* Valkyrie Wings Right */}
        <path d="M12 7c3.5-3 8-2 9 2 0 4-3.5 7-9 9" />
        <path d="M12 10c2.5-2 6-1 7 2 0 2.5-2.5 4.5-7 5.5" />
        {/* Halo Crown */}
        <circle cx="12" cy="7" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (variant === "poring") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* Poring Body */}
        <path d="M12 4C7.5 4 3 8 3 13.5c0 5 4 7.5 9 7.5s9-2.5 9-7.5C21 8 16.5 4 12 4z" />
        {/* Eyes */}
        <circle cx="9" cy="12.5" r="1" fill="currentColor" />
        <circle cx="15" cy="12.5" r="1" fill="currentColor" />
        {/* Smile */}
        <path d="M10.5 15.5c.8.5 2.2.5 3 0" />
        {/* Poring Leaf / Sprout */}
        <path d="M12 4c0-2 1.5-2.5 2.5-2.5" />
      </svg>
    );
  }

  // Default: Iconic Ragnarok Online "RO" Winged Monogram & Crest
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer Winged / Gothic Flourish Framing Accents */}
      <path
        d="M2.5 6.5C4 4 6.5 3 9 3.5c-.8.8-1.2 1.8-1.2 3 0 .4.05.8.15 1.2-1.8-.1-3.6-.5-5.4-1.2z"
        opacity="0.8"
      />
      <path
        d="M21.5 6.5C20 4 17.5 3 15 3.5c.8.8 1.2 1.8 1.2 3 0 .4-.05.8-.15 1.2 1.8-.1 3.6-.5 5.4-1.2z"
        opacity="0.8"
      />

      {/* Stylized 'R' Letter with Norse Wing Serifs & Sharp Counter */}
      <path
        d="M4.5 4.5h5.2c2.4 0 4.1 1.4 4.1 3.6 0 1.6-.9 2.8-2.3 3.3l3.2 6.1c.4.8.9 1 1.8 1.1v.9h-4.2l-3-5.8H7.2v4.8c0 .6.3.9 1 .9h.6v.9H4.5v-.9h.6c.7 0 1-.3 1-.9V6.3c0-.6-.3-.9-1-.9h-.6v-.9zm2.7 6.1h2.4c1.4 0 2.2-.8 2.2-2 0-1.2-.8-1.9-2.2-1.9H7.2v3.9z"
      />

      {/* Stylized 'O' Norse Rune Ring nestled beside 'R' with Top/Bottom Diamond Spurs */}
      <path
        d="M17.5 6.5c2.8 0 4.8 2.3 4.8 5.5s-2 5.5-4.8 5.5c-2.8 0-4.8-2.3-4.8-5.5s2-5.5 4.8-5.5zm0 1.8c-1.7 0-2.8 1.6-2.8 3.7s1.1 3.7 2.8 3.7 2.8-1.6 2.8-3.7-1.1-3.7-2.8-3.7z"
      />

      {/* Iconic Ragnarok Cross / Holy Sparkle Star on Top Right */}
      <polygon
        points="20.5,2 21.2,3.8 23,4.5 21.2,5.2 20.5,7 19.8,5.2 18,4.5 19.8,3.8"
      />

      {/* Bottom Midgard Rune Accent Line */}
      <path
        d="M6 21.5h12c-.5-.6-1.2-.9-2.2-.9H8.2c-1 0-1.7.3-2.2.9z"
        opacity="0.6"
      />
    </svg>
  );
};
