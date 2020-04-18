/**

mqttWSServer.js - nodeJS MQTT <> Websocket Relay Client

Demonstrates a Mosquito MQTT Client forwarding to Websocket

Concept is to forward ESP8266 wifi Arduino sensor data from an MQTT server
to a Websocket for consumption by web browser based real time graph client

Includes MongoDB aggregation query to compute 3 hour simple moving average

Usage:
  node mqttWSServer.js

Example Messaging in/out flow:

  esp8266.out: [{"ts":1587244500,"tempC":19.6,"tempF":67.28,"h":65,"LDR":1016,"p":101656,"tc2":20.3,"a":4.563207}]
  1 Listner(s) listening to mqttClient message event
  [ [Function: sendMsg] ]
  [ { ts: 1587244500,
      tempC: 19.6,
      tempF: 67.28,
      h: 65,
      LDR: 1016,
      p: 101656,
      tc2: 20.3,
      a: 4.563207,
      pAvg: 101305 } ]


Requires mqtt, ws, mongodb:
  npm install mqtt
  npm install ws
  npm install mongodb

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

// setup mongoDB connection
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var dbname = "weather";
var dbo = null;
var pAvgInterval = 10800; // (secs) 3hour average
var pAvg = 0;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  dbo = db.db(dbname);
});


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

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

// Create a client connection
wss.on('connection', function connection(ws,req) {
  console.log('WS connection()');

  ws.isAlive = true;
  ws.on('pong', heartbeat);
});

mqttClient.on('message', function sendMsg(topic, message, packet) {

  console.log(topic + ": " + message);

  var eventListeners = require('events').EventEmitter.listenerCount(mqttClient,'message');
  console.log(eventListeners + " Listner(s) listening to mqttClient message event");
  console.log(mqttClient.rawListeners('message'));

  // Query mongo DB - compute barometric air pressure 3 hour average
  computeAvg();

  // append avg to JSON message
  if(message.toString().length > 1)
  {
    var jsonObj = JSON.parse(message.toString());
    jsonObj[0]['pAvg'] = pAvg;
    //console.log(jsonObj);
    var jsonStr = JSON.stringify(jsonObj);
  }

  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.send(jsonStr+" ");
  });

});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

wss.on('close', function close() {
  console.log('WS close()');
  clearInterval(interval);
});

wss.on('listening', function connection() {
  console.log('WS listening()');
});

/**
MongoDB Aggregration Query:
Query MongoDB to compute 3hour simple moving average barometric air pressure
*/
var computeAvg = function() {

  var maxts = null;

  dbo.collection('sensorData').find({},{"ts":1}).sort({ts:-1}).limit(1).map( function(d) { return d.ts; } ).toArray(function(err, result) {
    if (err) throw err;
    maxts = result[0];
    //console.log(result[0]);
  });

  var query = dbo.collection('sensorData').aggregate([{ $match: {"ts":{$gte: maxts - pAvgInterval}} },{ $group: { _id : null,avg: { $avg: "$p" } } }]);

  avg = query.toArray(function(err, result) {
    if (err) throw err;
    //console.log(result[0]['avg']);
    pAvg = Math.trunc( result[0]['avg'] );
  });
}
