/**

mqttWSServer.js - nodeJS MQTT <> Websocket Relay Client

Demonstrates a Mosquito MQTT Client forwarding to Websocket

Requires mqtt, ws:
  npm install mqtt --save
  npm install ws


*/

var rx_msg = [];

// setup Websocket Server
const WebSocket = require('ws');
var ws_host = "127.0.0.1";
var ws_port = "8080";
const wss = new WebSocket.Server({ host: ws_host, port: ws_port });


// Setup MQTT Client
var mqtt = require('mqtt'), url = require('url');
var mqtt_url = url.parse(process.env.MQTT_URL || 'mqtt://192.168.1.127:1883');
var auth = (mqtt_url.auth || ':').split(':');
var url = "mqtt://" + mqtt_url.host;
var mqtt_channel_in = "esp8266.in";
var mqtt_channel_out = "esp8266.out";


//username: auth[0] + ":" + auth[0] if you are on a shared instance
var options = {
  port: mqtt_url.port,
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  username: auth[0],
  password: auth[1],
};

// Create a client connection
wss.on('connection', function connection(ws) {
  console.log('MQTT init()');
  //ws.send("{\"msg\": \"WS Server HELLO\"}");
  var client = mqtt.connect(url, options);
  client.on('connect', function() {
      client.subscribe(mqtt_channel_out, function() {
        client.on('message', function(topic, message, packet) {
          console.log(topic + ": " + message);
          ws.send(message+" ");
        });
      });
  });

});
