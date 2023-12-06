import { Provider } from "@angular/core";
import { provideSidenavMenuGroup } from "src/app/scaffold/sidenav-menu.service";



export function provideLabSidenavMenuContext(): Provider[] {
    return [
        provideSidenavMenuGroup({
            id: 'labs', 
            title: 'Lab', 
            links: [
                {commands: ['lab', '']}
            ]
        )
    ]
}