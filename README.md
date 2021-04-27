# Media Streams Test Server

Send Audio from Desktop Linux Box (Pandora/Spotify) to Twilio, allow access to Media Stream via Web Socket

1. Setup Websocket/HTTP Server on TCP/5000
2. Setup RTP Receiver on UDP/9000
3. Stream Audio from Linux Box (tested with PopOS Linux) and point to UDP/9000

To Setup

1. npm install
2. start your Media Player (Pandora/Spotify)
3. `./stream.sh` to setup RTP Streaming to UDP/9000
4. `node udp.js` to listen for RTP on UDP/9000, and listen WS Connections on TCP/5000
