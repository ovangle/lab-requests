import { Location, PlatformLocation } from '@angular/common';
import { InjectionToken, Provider } from '@angular/core';
import urlJoin from 'url-join';

/**
 * A value for the app base href that includes the origin of the currently loaded page
 */
export const APP_BASE_URL = new InjectionToken<string>('APP_BASE_URL');

export function provideAppBaseUrl(): Provider {
    return {
        provide: APP_BASE_URL,
        useFactory: (platformLocation: PlatformLocation, ngLocation: Location) => {
            let origin = `${platformLocation.protocol}${platformLocation.hostname}`
            if (![ '80', '443' ].includes(platformLocation.port)) {
                origin += `:${platformLocation.port}`
            }
            console.log('origin', origin);
            return urlJoin(origin, ngLocation.prepareExternalUrl('/'))
        },
        deps: [ PlatformLocation, Location ]
    }
};