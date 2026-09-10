"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const platform_browser_1 = require("@angular/platform-browser");
const http_1 = require("@angular/common/http");
const angularx_social_login_1 = require("@abacritt/angularx-social-login");
const app_1 = require("./app/app");
(0, platform_browser_1.bootstrapApplication)(app_1.AppComponent, {
    providers: [
        (0, http_1.provideHttpClient)(),
        {
            provide: 'SocialAuthServiceConfig',
            useValue: {
                autoLogin: false,
                providers: [
                    {
                        id: angularx_social_login_1.GoogleLoginProvider.PROVIDER_ID,
                        provider: new angularx_social_login_1.GoogleLoginProvider('1096178049960-ldd8mh9kahqs1a88aful1d24l6utjd4k.apps.googleusercontent.com'),
                    },
                ],
            },
        },
    ],
});
