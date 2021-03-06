'use strict';

var express = require('express'),
	http = require('http'),
	app = express(),
	server = http.createServer(app),
	env = require("../config/env.json");

server.listen(process.env.PORT || 8000);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/client.js', (req, res) => {
  res.sendFile(__dirname + '/client.js');
});
app.get('/index.css', (req, res) => {
  res.sendFile(__dirname + '/index.css');
});

var najax = require('najax');
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: server });

let gapi = 'https://www.googleapis.com/customsearch/v1?q=:q:&cx=' + encodeURI(process.env.CX) + '&safe=high&num=1&start=:start:&searchType=image&key=' + process.env.KEY;

// utils
function getRandomInt(min, max) {
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function searchImage(word){
  let req_url = gapi.replace(/:q:/, encodeURI(word))
					.replace(/:start:/, getRandomInt(1,100).toString(10));
  let req_obj = {
	success: false,
	type: 'bot',
	text: 'Sorry, but some error has occured.',
	cmd: 'gochi',
  };
  
  najax({
	url: req_url,
	type: 'GET',
	dataType: 'json',
	timeout: 5000,
	success: (data) => {
	  if(data.searchInformation.totalResults > 0){
		req_obj.success = true;
		req_obj.text = data.items[0].link;
	  }
	  else{
		req_obj.success = false;
		req_obj.text = 'No images are found :-(';
	  }
	},
	error: () => {
	}
  }).always(() => {
	let resp = JSON.stringify(req_obj);
	wss.broadcast(resp);
  });
}

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
	client.send(data);
  });
};

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
	let message = JSON.parse(data);
	// Broadcast to everyone.
	let resp = JSON.stringify({
	  'success': true,
	  'type': 'message',
	  'text': message.text
	});
	wss.broadcast(resp);

	// bot mentioned
	let bot_mention_pat = /^@?bot[\s　]|^bot:/;
	if(bot_mention_pat.test(message.text)){
	  let cmd = message.text.match(/^.?bot.(.*)/)[1];
	  let word;
	  // ping command
	  if(cmd === 'ping'){
		let resp = JSON.stringify({
		  success: true,
		  type: 'bot',
		  text: 'pong',
		  cmd: 'ping',
		});
		wss.broadcast(resp);
	  }
	  else if((word = cmd.match(/^[\s　]*image[\s　]+(.*)/)) !== null){
		searchImage(word[1]);
	  }
	  else if(/ぴょん|ぽい/g.test(cmd)){
		let resp = JSON.stringify({
		  success: true,
		  type: 'bot',
		  text: 'bot: あぁ^〜心がぴょんぴょんするんじゃ^〜',
		  cmd: 'ping',
		});
		wss.broadcast(resp);
		searchImage('ごちうさ');
	  }
	}
  });
});
