/**
 * @interface FileBadgeProps
 * @description Properties for the FileBadge component.
 */
interface FileBadgeProps {
  /** The text label to display (e.g., "PDF", "DOCX") */
  label: string;
}

/**
 * FileBadge Atom
 * @description A small, stylized container used to display supported file extensions.
 * @param {FileBadgeProps} props - Component properties.
 * @returns {JSX.Element} The rendered badge.
 */
export const FileBadge = ({ label }: FileBadgeProps) => (
  <span className="text-body-s-strong bg-surface-raised text-text-weaker rounded-md px-3 py-1 tracking-wide uppercase">
    {label}
  </span>
);
