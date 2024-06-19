export default function useRTC() {
   const stun_servers = {
      iceServers: [
         {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
         },
      ],
      iceCandidatePoolSize: 10,
   };
   const peer_connection = new RTCPeerConnection(stun_servers);

   peer_connection.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State: ${peer_connection.iceConnectionState}`);
   };

   peer_connection.ontrack = event => {
      console.log("ontrack event received", event);
      if (!streams.remote) {
         streams.remote = new MediaStream();
      }
      if (event.track.kind === "video") {
         console.log("Adding video track to remote stream");
         streams.remote.addTrack(event.track);
         const remote_video = document.querySelector(".remote-stream") as HTMLVideoElement;
         remote_video.srcObject = streams.remote;
      }
   };

   const streams = {
      local: null,
      remote: null,
   } as { local: MediaStream | null; remote: MediaStream | null };

   const offerCandidates = [] as RTCIceCandidate[];

   function sendOffer() {
      if (!navigator.mediaDevices.getUserMedia) {
         alert("getUserMedia not supported");
         return;
      }
      navigator.mediaDevices
         .getUserMedia({
            video: true,
            audio: true,
         })
         .then(async stream => {
            streams.local = stream;

            stream.getTracks().forEach(track => {
               peer_connection.addTrack(track, stream);
            });

            const local_video = document.querySelector(".local-stream") as HTMLVideoElement;
            local_video.srcObject = stream;

            const offer = await peer_connection.createOffer();

            console.log("offer", offer);
            peer_connection.onicecandidate = event => {
               if (!event.candidate) return;

               offerCandidates.push(event.candidate);

               console.log("event.candidate", event.candidate);

               fetch("/api/v1/rtc/offer-candidates", {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                     candidate: JSON.stringify(event.candidate),
                     channel_id: "1",
                  }),
               });
            };
            await peer_connection.setLocalDescription(offer);

            fetch("/api/v1/rtc/offers", {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  offer: {
                     type: offer.type,
                     sdp: offer.sdp,
                  },
                  channel_id: "1",
               }),
            });
         })
         .catch(err => {
            console.error("Error getting user media", err);
         });
   }

   async function sendAnswer() {
      const answer_candidates = [] as RTCIceCandidate[];
      peer_connection.onicecandidate = event => {
         if (!event.candidate) return;

         answer_candidates.push(event.candidate);

         fetch("/api/v1/rtc/answer-candidates", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               candidate: JSON.stringify(event.candidate),
               channel_id: "1",
            }),
         });
      };

      for (const candidate of offerCandidates) {
         console.log("candidate", candidate);
         await peer_connection.addIceCandidate(candidate);
      }

      navigator.mediaDevices
         .getUserMedia({
            video: true,
            audio: true,
         })
         .then(async stream => {
            streams.local = stream;

            stream.getTracks().forEach(track => {
               peer_connection.addTrack(track, stream);
            });

            const local_video = document.querySelector(".local-stream") as HTMLVideoElement;
            local_video.srcObject = stream;

            const answer = await peer_connection.createAnswer();
            console.log("answer", answer);
            await peer_connection.setLocalDescription(answer);

            fetch("/api/v1/rtc/answers", {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  answer: {
                     type: answer.type,
                     sdp: answer.sdp,
                  },
                  channel_id: "1",
               }),
            });
         })
         .catch(err => {
            console.error("Error getting user media", err);
         });
   }

   async function getOffers() {
      const response = await fetch("/api/v1/rtc/offers", {
         method: "GET",
      });
      const body = await response.json();

      console.log("body", body);

      if (body.offers.length === 0) return;
      const offer = new RTCSessionDescription({
         type: "offer", // Since you're dealing with an offer
         sdp: body.offers[0].offer,
      });

      await peer_connection.setRemoteDescription(offer);

      const video = document.querySelector(".remote-stream") as HTMLVideoElement;
      streams.remote = new MediaStream();
      video.srcObject = streams.remote;

      // fetch offer candidates
      const response2 = await fetch("/api/v1/rtc/offer-candidates", {
         method: "GET",
      });

      const body2 = await response2.json();

      console.log("body2.candidates", body2.candidates);

      for (const candidate of body2.candidates) {
         const cand_json = JSON.parse(candidate.candidate);
         const iceCandidate = new RTCIceCandidate({
            candidate: cand_json.candidate,
            sdpMid: cand_json.sdpMid,
            sdpMLineIndex: cand_json.sdpMLineIndex,
         });
         offerCandidates.push(iceCandidate);
         await peer_connection.addIceCandidate(iceCandidate);
      }
   }

   async function getAnswers() {
      const response = await fetch("/api/v1/rtc/answers", {
         method: "GET",
      });
      const body = await response.json();

      if (body.answers.length === 0) return;
      console.log("body.answers", body);
      const answer = new RTCSessionDescription({
         type: "answer", // Since you're dealing with an answer
         sdp: body.answers[0].answer,
      });

      await peer_connection.setRemoteDescription(answer);

      // fetch answer candidates
      const response2 = await fetch("/api/v1/rtc/answer-candidates", {
         method: "GET",
      });

      const body2 = await response2.json();

      console.log("body2.candidates", body2.candidates);

      for (const candidate of body2.candidates) {
         console.log("candidate", candidate);
         const cand_json = JSON.parse(candidate.candidate);
         const iceCandidate = new RTCIceCandidate({
            candidate: cand_json.candidate,
            sdpMid: cand_json.sdpMid,
            sdpMLineIndex: cand_json.sdpMLineIndex,
         });
         await peer_connection.addIceCandidate(iceCandidate);
      }

      streams.remote = new MediaStream();
   }

   function showStream(stream: MediaStream, videoElement: HTMLVideoElement) {
      videoElement.srcObject = stream;
   }

   return {
      peer_connection,
      streams,
      sendOffer,
      showStream,
      getOffers,
      sendAnswer,
      getAnswers,
   };
}
