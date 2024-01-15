

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
  children: SidenavMenuNode[];
}

export type SidenavMenuNode = SidenavMenuLink | SidenavMenuGroup;