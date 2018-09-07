var express = require('express');
var app = express();
var amqp = require('amqplib/callback_api');
var path    = require("path");
app.get('/', function (req, res) {
  console.log('test');
});
app.get('/index', function (req, res){
	res.sendFile(path.join(__dirname + "/index.html"));
	//res.send('<!DOCTYPE html><html><head><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script></head><body><h1>Logowanie</h1><form id="log">Login: <input type="text" name="fLogin" value=""><br>Hasło: <input type="password" name="fHaslo" value=""><br></form><script>function start(){var b = $("<input id=\'loginButton\' type=\'button\' value=\'Zaloguj\'/>");b.bind("click", function(){var form = $("#log > input");var login = form[0].value;var haslo = form[1].value;loguj(login, haslo);alert(login.toString() + " " + haslo);});b.appendTo("#log");}function loguj(login, haslo){alert("dziala");$.get("/test2", {login: login, haslo: haslo} ).done(function(data){});}$(document).ready(function() {start();});</script></body></html>');
});
app.get('/loguj', function (req, res) {
	console.log("start logowanie");
	amqp.connect('amqp://localhost', function(err, conn) {
		conn.createChannel(function(err, ch) {
			ch.assertQueue('', {exclusive: true}, function(err, q) {
				var corr = generateUuid();		  
				var login = req.query.login;
				var haslo = req.query.haslo;
				console.log('login: %s haslo: %s', login, haslo);

				ch.consume(q.queue, function(msg) {
					if (msg.properties.correlationId == corr) {
						console.log('odebrano: %s', msg.content.toString());
						res.send(msg.content.toString());
					}
				}, {noAck: true});

				ch.sendToQueue('rpc_queue',
					new Buffer("logowanie-" + login + ";" + haslo),
					{ correlationId: corr, replyTo: q.queue });
			});
		});
	});
});

app.get('/zlecenie', function (req, res) {
	console.log("start zlecenie");
	amqp.connect('amqp://localhost', function(err, conn) {
		conn.createChannel(function(err, ch) {
			ch.assertQueue('', {exclusive: true}, function(err, q) {
				var corr = generateUuid();				
				var kwota = req.query.kwota;
				var oprocentowanie = req.query.oprocentowanie;
				var raty = req.query.raty;
				var numer = req.query.numer;
				console.log('kwota: %s oprocentowanie: %s raty: %s numer: %s', kwota, oprocentowanie, raty, numer);

				ch.consume(q.queue, function(msg) {
					if (msg.properties.correlationId == corr) {
						console.log('odebrano: %s', msg.content.toString());
						res.send(msg.content.toString());
					}
				}, {noAck: true});

				ch.sendToQueue('rpc_queue',
					new Buffer("pozyczka-" + kwota + ";" + oprocentowanie + ";"+ raty + ";"+ numer),
					{ correlationId: corr, replyTo: q.queue });
			});
		});
	});
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}