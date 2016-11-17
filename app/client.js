'use strict';

var ws = new WebSocket('ws://localhost:3000');

$(function () {
  var addMessage = function(text){
	$('#messages')
	  .append($('<li>')
		.append($('<span class="message">').text(text)));
  }
  
  $('form').submit(function(){
	var $this = $(this);
	let msg = $('#m').val();
	$('#m').val('');

	ws.send(JSON.stringify({'text': msg}));
	return false;
  });
  ws.onmessage = function(msg){
	let resp = JSON.parse(msg.data);
	let text = '';
	if(resp.type === 'message'){
	  addMessage(resp.text);
	}
	else{
	  switch(resp.cmd){
		case 'ping':
		  addMessage(resp.text);
		  break;
		case 'gochi':
		  if(resp.success){
			$('#messages')
			  .append($('<li>')
				.append($('<span class="message">')
				  .append($('<a>')
					.attr({'href': resp.text, 'target': 'blank'})
					.append($('<img />', { src: resp.text })))));
		  }
		  else{
			addMessage('bot: ' + resp.text);
		  }			
		  break;
	  }
	}
  };
  ws.onerror = function(err){
	console.log("err", err);
  };
  ws.onclose = function close() {
	console.log('disconnected');
  };
});
