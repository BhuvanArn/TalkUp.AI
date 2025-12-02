/**
 * Props for the Sidebar component.
 */
export interface SidebarProps {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Function to set the collapsed state */
  setIsCollapsed: (collapsed: boolean) => void;
}

/**
 * Props for the Navigation component
 */
export interface NavigationProps {
  isCollapsed?: boolean;
}
