

interface _SidenavMenuNode {
  readonly type: 'link' | 'group';
  readonly title: string;
}

export interface SidenavMenuLink extends _SidenavMenuNode {
  readonly type: 'link';
  /**
   * A router link (relative to root)
   */
  readonly routerLink: any[];

  readonly icon?: string;
}

export interface SidenavMenuGroup extends _SidenavMenuNode {
  readonly type: 'group';
  readonly routerLink?: any[];
  children: SidenavMenuNode[];
}

export function isFixedGroup(group: SidenavMenuGroup) {
  return Array.isArray(group.routerLink);
}

export type SidenavMenuNode = SidenavMenuLink | SidenavMenuGroup;