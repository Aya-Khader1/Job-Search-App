import { Component, AfterViewInit } from '@angular/core';
import { Auth } from './services/auth';

declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<div id="google-btn"></div>`,
})
export class AppComponent implements AfterViewInit {
  constructor(private readonly authService: Auth) {}
  ngAfterViewInit() {
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);

        google.accounts.id.initialize({
          client_id: '1013808888673-gcpid44tkufji8aa3e79am0a2kfpgmha.apps.googleusercontent.com',

          callback: async (response: any) => {
            console.log('ID TOKEN:', response.credential);
            await this.authService.googleLogin(response.credential);
          },
        });

        google.accounts.id.renderButton(document.getElementById('google-btn'), {
          theme: 'outline',
          size: 'large',
        });
      }
    }, 100);
  }
}
