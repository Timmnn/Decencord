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

   const streams = {
      local: null,
      remote: [],
   } as { local: MediaStream | null; remote: MediaStream[] };

   function startLocalStream() {
      if (!navigator.mediaDevices.getUserMedia) {
         alert("getUserMedia not supported");
         return;
      }
      navigator.mediaDevices
         .getUserMedia({
            video: true,
            audio: true,
         })
         .then(stream => {
            streams.local = stream;

            stream.getTracks().forEach(track => {
               peer_connection.addTrack(track, stream);
            });

            makeOffer();
         })
         .catch(err => {
            console.error("Error getting user media", err);
         });
   }

   function listenForRemoteStream() {
      peer_connection.ontrack = event => {
         for (const stream of event.streams) {
            const corresponding_stream = streams.remote.find(s => s.id === stream.id);
            if (corresponding_stream) {
               stream.getTracks().forEach(track => {
                  corresponding_stream.addTrack(track);
               });
            }
         }
      };
   }

   const offerCandidates = [] as RTCIceCandidate[];

   async function makeOffer() {
      const offer = await peer_connection.createOffer();
      peer_connection.onicecandidate = event => {
         if(!event.candidate) return;

         offerCandidates.push(event.candidate);

         fetch("/api/v1/add-ice-candidate", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               candidate: event.candidate.toJSON(),
               channel_id: "1"
            }),
         });
      };
      await peer_connection.setLocalDescription(offer);

      fetch("/api/v1/make-offer", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            offer: {
               type: offer.type,
               sdp: offer.sdp,
            },
            channel_id: "1"
         }),
      });

      // wait for answer using websocket


   }


   async function fetchOffers() {
      const response = await fetch("/api/v1/rtc/offers", {
         method: "GET",
      });
      const offers = await response.json();

      if(offers.length === 0) {
         setTimeout(fetchOffers, 5000);
         return;
      }

      makeAnswer(offers.answers[0].offer);
   }


   async function makeAnswer(offer_str: string) {
      console.log("making answer", offer_str);
      const offer = new RTCSessionDescription({
         type: "offer", // Since you're dealing with an offer
         sdp: offer_str
     });
      await peer_connection.setRemoteDescription(offer);

      const answer = await peer_connection.createAnswer();
      await peer_connection.setLocalDescription(answer);

      fetch("/api/v1/rtc/answer", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            answer: {
               type: answer.type,
               sdp: answer.sdp,
            },
            channel_id: "1"
         }),
      });
   }


   function showStream(stream: MediaStream, videoElement: HTMLVideoElement) {
      videoElement.srcObject = stream;
   }

   return {
      peer_connection,
      streams,
      startLocalStream,
      listenForRemoteStream,
      showStream,
      fetchOffers,
   };
}
