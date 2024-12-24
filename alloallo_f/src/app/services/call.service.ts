import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class CallService {
  private ws: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private readonly config: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };
  

  private readonly webSocketUrl = 'ws://192.168.0.110:8080/ws'; // Replace with your WebSocket server URL

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  connectToWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already open or connecting.');
      return;
    }

    this.ws = new WebSocket(this.webSocketUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Message received via WebSocket:', message);

      switch (message.type) {
        case 'offer':
          this.handleOffer(message.offer);
          break;
        case 'answer':
          this.handleAnswer(message.answer);
          break;
        case 'candidate':
          this.addIceCandidate(message.candidate);
          break;
        default:
          console.error('Unknown message type:', message.type);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.reason);
      this.reconnectWebSocket();
    };
  }

  reconnectWebSocket(): void {
    setTimeout(() => {
      console.log('Reconnecting WebSocket...');
      this.connectToWebSocket();
    }, 3000);
  }

  resetWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log('WebSocket reset and closed.');
  }

  sendMessage(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    } else {
      console.error('Cannot send message, WebSocket is not open.');
    }
  }

  async initLocalStream(videoElement: HTMLVideoElement): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Local stream initialization skipped in non-browser environment.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia is not supported by this browser.');
      alert('Your browser does not support WebRTC. Please use a modern browser like Chrome or Firefox.');
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      videoElement.srcObject = this.localStream;
      videoElement.play();
      console.log('Local stream initialized');
    } catch (error: any) {
      console.error('Error accessing local media devices:', error);

      if (error.name === 'NotAllowedError') {
        alert('Camera and microphone access was denied. Please allow permissions.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera or microphone found. Please connect a device and try again.');
      } else {
        alert('An unexpected error occurred while accessing your media devices.');
      }
    }
  }

  async createConnection(localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement): Promise<void> {
    this.peerConnection = new RTCPeerConnection(this.config);

    this.localStream?.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        remoteVideo.srcObject = this.remoteStream;
      }
      this.remoteStream.addTrack(event.track);
      console.log('Remote track added:', event.track);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage('candidate', { candidate: event.candidate });
        console.log('Local ICE candidate:', event.candidate);
      }
    };
  }

  async createOffer(caller: string, callee: string): Promise<void> {
    const offer = await this.peerConnection!.createOffer({ iceRestart: true });
    await this.peerConnection!.setLocalDescription(offer);

    this.sendMessage('offer', { caller, callee, offer });
    console.log('Offer created and sent');
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        console.error('Peer connection is not initialized');
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendMessage('answer', { answer });
      console.log('Answer created and sent');
    } catch (error) {
      console.error('Error handling the offer:', error);
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        console.error('Peer connection is not initialized');
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Answer set successfully');
    } catch (error) {
      console.error('Error handling the answer:', error);
    }
  }

  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      await this.peerConnection!.addIceCandidate(candidate);
      console.log('Remote ICE candidate added:', candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  resetConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      this.localStream = null;
      this.remoteStream = null;
    }
    console.log('Peer connection reset');
  }
}
