import { Injectable, inject } from "@angular/core";
import { SidenavMenuGroup, SidenavMenuLink, SidenavMenuNode } from "./model";
import { BehaviorSubject, Observable, Subscription, combineLatest, connectable, defer, filter, map, shareReplay } from "rxjs";
import { UserContext } from "src/app/user/user-context";
import { CurrentUser } from "src/app/user/common/user";
import { formatDiscipline } from "src/app/uni/discipline/discipline";
import { Lab } from "src/app/lab/lab";
import { ScaffoldStateService } from "../scaffold-state.service";
import { SidenavMenuComponent } from "./sidenav-menu.component";
import { ResearchPlan } from "src/app/research/plan/research-plan";
import { ActivatedRoute } from "@angular/router";

const _STATIC_NODES: SidenavMenuNode[] = [
  {
    type: 'link',
    title: 'Home',
    icon: 'home',
    routerLink: [ '/user', 'home' ],
  },
]

@Injectable({ providedIn: 'root' })
export class SidenavMenuRoot {
  readonly userContext = inject(UserContext);
  readonly _activatedRoute = inject(ActivatedRoute);
  get _rootRoute() {
    let r = this._activatedRoute;
    while (r.parent != null) {
      r = r.parent;
    }
    return r;
  }

  readonly isDisabled$ = this.userContext.user.pipe(
    map(user => user == null)
  );

  readonly _currentUser = defer(() => this.userContext.user.pipe(
    filter((u): u is CurrentUser => u != null)
  ));

  readonly labsGroup$: Observable<SidenavMenuGroup> = this._currentUser.pipe(
    map(user => {
      return user.labs.items.map(item => this.createLabLink(item))
    }),
    map(links => ({
      type: 'group',
      title: 'Labs',
      children: links
    }))
  );

  readonly plansGroup$: Observable<SidenavMenuGroup> = this._currentUser.pipe(
    map(user => user.plans.items.map(item => this.createResearchPlanLink(item))),
    map(links => ({
      type: 'group',
      title: 'Plans',
      children: [
        ...links,
        { type: 'link', title: 'create', routerLink: [ 'research', 'create' ] }
      ]
    }))
  );

  readonly nodes$ = combineLatest([ this.labsGroup$, this.plansGroup$ ]).pipe(
    map(([ labsGroup, plansGroup ]) => [
      ..._STATIC_NODES,
      labsGroup,
      plansGroup
    ])
  );


  createLabLink(lab: Lab): SidenavMenuLink {
    return {
      type: 'link',
      icon: 'spanner',
      routerLink: [ `/lab/${lab.id}` ],
      title: `${lab.campus.name} - ${formatDiscipline(lab.discipline)}`
    }
  }

  createResearchPlanLink(plan: ResearchPlan): SidenavMenuLink {
    return {
      type: 'link',
      icon: '',
      routerLink: [ `/plans/${plan.id}` ],
      title: `${plan.title}`
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