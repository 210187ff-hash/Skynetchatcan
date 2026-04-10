/**
 * WebRTC Adapter Utility
 * Helps in detecting local IP addresses via WebRTC leaks (common in browsers).
 */

export const getLocalIP = (): Promise<string> => {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer));
    
    pc.onicecandidate = (ice) => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) {
        resolve('127.0.0.1');
        return;
      }
      const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)?.[1];
      pc.onicecandidate = null;
      pc.close();
      resolve(myIP || '127.0.0.1');
    };

    // Timeout fallback
    setTimeout(() => {
      pc.close();
      resolve('127.0.0.1');
    }, 1000);
  });
};
