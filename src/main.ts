import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

// iOS Safari ignores user-scalable=no; its own pinch gesture events can still be cancelled.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (event) => event.preventDefault(), { passive: false });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
