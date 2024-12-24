import { Component, ElementRef, ViewChild } from '@angular/core';
import { CallService } from '../../services/call.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css'],
})
export class VideoCallComponent {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  constructor(private callService: CallService) {}

  async ngOnInit(): Promise<void> {
    this.callService.connectToWebSocket();
  }

  async startCall(): Promise<void> {
    const localVideo = this.localVideoRef.nativeElement;
    const remoteVideo = this.remoteVideoRef.nativeElement;

    await this.callService.initLocalStream(localVideo);
    await this.callService.createConnection(localVideo, remoteVideo);

    // Simulated caller/callee IDs
    await this.callService.createOffer('peerA', 'peerB');
  }
}
