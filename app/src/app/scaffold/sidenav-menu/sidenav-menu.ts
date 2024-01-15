import { Injectable, inject } from "@angular/core";
import { SidenavMenuGroup, SidenavMenuLink, SidenavMenuNode } from "./model";
import { BehaviorSubject, Observable, Subscription, combineLatest, connectable, filter, map, shareReplay } from "rxjs";
import { UserContext } from "src/app/user/user-context";
import { CurrentUser } from "src/app/user/common/user";
import { formatDiscipline } from "src/app/uni/discipline/discipline";
import { Lab } from "src/app/lab/lab";
import { ScaffoldStateService } from "../scaffold-state.service";
import { SidenavMenuComponent } from "./sidenav-menu.component";

const _STATIC_NODES: SidenavMenuNode[] = [
  {
    type: 'link',
    title: 'Home',
    icon: 'home',
    routerLink: ['/home'],
  },
]

@Injectable({ providedIn: 'root' })
export class SidenavMenuRoot {
  readonly scaffoldState = inject(ScaffoldStateService);
  readonly userContext = inject(UserContext);

  readonly isDisabled$ = this.userContext.user.pipe(
    map(user => user == null)
  );

  readonly labsGroup$: Observable<SidenavMenuGroup> = this.userContext.user.pipe(
    filter((u): u is CurrentUser => u != null),
    map(user => {
      return user.labs.items.map(item => this.createLabLink(item))
    }),
    map(links => ({
      type: 'group',
      title: 'Labs',
      children: links
    }))
  );

  readonly nodes$ = combineLatest([this.labsGroup$]).pipe(
    map(([labsGroup]) => [
      ..._STATIC_NODES,
      labsGroup
    ])
  );


  createLabLink(lab: Lab): SidenavMenuLink {
    return {
      type: 'link',
      icon: 'spanner',
      routerLink: [`/lab/${lab.id}`],
      title: `${lab.campus.name} - ${formatDiscipline(lab.discipline)}`
    }
  }

  connect(menu: SidenavMenuComponent): Subscription {
    const syncNodesSubscription = this.nodes$.subscribe(nodes => {
      menu.setNodes(nodes);
    })

    return new Subscription(() => {
      syncNodesSubscription.unsubscribe();
    });
  }
}