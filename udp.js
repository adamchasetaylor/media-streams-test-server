const http = require('http');
const WebSocket = require('ws');

const dgram = require('dgram');
const rtp = dgram.createSocket('udp4');
let streamer;

const EventEmitter = require('events');
class Streamer extends EventEmitter { }
let streamSids = [];

streamSidsAdd = (value) => {
  console.log("ADD",value)
  streamSids.push(value);
}

streamSidsRemove = (value) => { 
  console.log("REMOVE",value)
  streamSids = streamSids.filter(function(ele){ 
      return ele != value; 
  });
}

const UDP_PORT = 9000;
const HTTP_PORT = 5000;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// From Yellowstone: https://github.com/mbullington/yellowstone
const parseRTPPacket = (buffer) => {
  const padding = (buffer[0] >> 5) & 0x01
  const hasExtensions = (buffer[0] >> 4) & 0x01;
  const marker = (buffer[1]) >>> 7;
  const payloadType = buffer[1] & 0x7f;
  const num_csrc_identifiers = (buffer[0] & 0x0F);

  const payload = buffer.slice((num_csrc_identifiers * 4) + (hasExtensions ? 16 : 12));
  const { length } = payload;

  return {
    id: buffer.readUInt16BE(2),
    timestamp: buffer.readUInt32BE(4),
    marker,
    payload,
    length,
    payloadType
  };
}

const setupStreamer = (ws, streamSid) => {
  streamer = new Streamer();

  streamer.on('stream', (message) => {
    for(ss of streamSids)
    {
      const payload = Buffer.from(message).toString('base64');

      const ev = JSON.stringify({
        event: 'media',
        media: {
          payload: payload,
        },
        streamSid: ss
      });

      ws.send(ev);
    }
  });
}


wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const msg = JSON.parse(message);
    if (msg.event == "connected") {
      console.log("connected", msg);
    }
    else if (msg.event == "start") {
      console.log("start", msg);
      streamSidsAdd(msg.streamSid);
      setupStreamer(ws, msg.streamSid);
    }
    else if(msg.event == "stop")
    {
      console.log("stop", msg);
      streamSidsRemove(msg.streamSid);
    }
    else if(msg.event == "closed")
    {
      streamSid = null;
    }
  })
});
wss.on('close', function close() {
  console.log('Connection Closed');
});

// Listening event. This event will tell the server to listen on the given address.
rtp.on('listening', function () {
  var address = rtp.address();
  console.log('UDP Server listening on ' + address.address + ":" + address.port);
});
server.on('listening', function () {
  var address = server.address();
  console.log('HTTP/WS Server listening on ' + address.address + ":" + address.port);
})

// Message event. This event is automatically executed when this server receives a new message
// That means, when we use FUDPPing::UDPEcho in Unreal Engine 4 this event will trigger.
rtp.on('message', function (message, remote) {
  //console.log('Message received from ' + remote.address + ':' + remote.port +' - ' + message.toString());
  if(streamer){
    const pkt = parseRTPPacket(message);
    streamer.emit("stream", pkt.payload);
  }
  rtp.send(message, 0, message.length, remote.port, remote.address, function (err, bytes) {
    if (err) throw err;
    //console.log('UDP message sent to ' + remote.address +':'+ remote.port + '\n');
  });
});

// Error event. Something bad happened. Prints out error stack and closes the server.
rtp.on('error', (err) => {
  //console.log(`server error:\n${err.stack}`);
  rtp.close();
});


server.listen(HTTP_PORT);
rtp.bind(UDP_PORT);