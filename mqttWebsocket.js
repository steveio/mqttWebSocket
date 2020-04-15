/**

mqttWSServer.js - nodeJS MQTT <> Websocket Relay Client

Demonstrates a Mosquito MQTT Client forwarding to Websocket

Concept is to forward ESP8266 wifi Arduino sensor data from an MQTT server
to a Websocket for consumption by web browser based real time graph client

Usage:
  node mqttWSServer.js

Requires mqtt, ws:
  npm install mqtt
  npm install ws

*/

var rx_msg = [];

// setup Websocket Server
const WebSocket = require('ws');
var ws_host = "127.0.0.1";
var ws_port = "8080";
const wss = new WebSocket.Server({ host: ws_host, port: ws_port });
var ws = null;

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

var mqttClient = mqtt.connect(url, options);

mqttClient.on('connect', function() {
    console.log('MQTT client connect(): '+mqttClient.connected);
    mqttClient.subscribe(mqtt_channel_out, function() {});
});


// Create a client connection
wss.on('connection', function connection(ws,req) {
  console.log('WS connection()');
  //console.log(ws);
  //console.log(req);

  mqttClient.on('message', function sendMsg(topic, message, packet) {

    console.log(topic + ": " + message);

    // bug - on each browser refresh as new listener is registered
    var eventListeners = require('events').EventEmitter.listenerCount(mqttClient,'message');
    console.log(eventListeners + " Listner(s) listening to mqttClient message event");
    //console.log(mqttClient.rawListeners('message'));

    ws.send(message+" ");
  });
});

wss.on('close', function connection() {
  console.log('WS close()');
});

wss.on('close', function connection() {
  console.log('WS close()');
});

wss.on('listening', function connection() {
  console.log('WS listening()');
});
