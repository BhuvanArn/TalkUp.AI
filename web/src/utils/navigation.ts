import { NavItem } from '@/types/navigation';

/**
 * Organizes navigation items with proper ordering
 *
 * @param items - Array of navigation items to organize
 * @returns Array of navigation items, filtered and sorted by order
 */
export function organizeNavigation(items: NavItem[]): NavItem[] {
  const visibleItems = items.filter((item) => item.showInNav !== false);

  visibleItems.sort((a, b) => (a.order || 0) - (b.order || 0));

  return visibleItems;
}

/**
 * Finds a navigation item by route path
 *
 * @param items - Array of navigation items to search
 * @param path - Route path to find
 * @returns Navigation item if found, undefined otherwise
 */
export function findNavItem(
  items: NavItem[],
  path: string,
): NavItem | undefined {
  for (const item of items) {
    if (item.to === path) {
      return item;
    }
    if (item.children) {
      const found = findNavItem(item.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Checks if a route path is currently active
 *
 * @param currentPath - Current route path
 * @param itemPath - Navigation item path
 * @returns True if the path is active
 */
export function isNavItemActive(
  currentPath: string,
  itemPath: string,
): boolean {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(itemPath);
}
