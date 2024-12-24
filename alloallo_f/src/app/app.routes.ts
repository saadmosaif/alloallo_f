import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { VideoCallComponent } from './components/video-call/video-call.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Home Page
  { path: 'video-call', component: VideoCallComponent }, // Video Call Page
  { path: '**', redirectTo: '' }, // Redirect to Home
];
