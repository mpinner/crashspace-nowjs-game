//dependencies
var html = require('fs').readFileSync(__dirname+'/helloworld.html');
var mongodb = require('mongodb');

// magic constants
var MONGO_HOST = "127.0.0.1";
var MONGO_PORT = 27017;
var MONGO_ZONE = "test_collection";



var server = require('http').createServer(function(req, res){
	res.end(html);
    });
server.listen(8080);

var nowjs = require("now");
var everyone = nowjs.initialize(server);

everyone.now.distributeMessage = function(message){
	insertToMongo(this.now.name, message);
    everyone.now.receiveMessage(this.now.name, message);
};

function insertToMongo(key, val) {

	var server = new mongodb.Server(MONGO_HOST, MONGO_PORT, {});

	new mongodb.Db('test', server, {}).open(function (error, client) {
	  if (error) throw error;
	  var collection = new mongodb.Collection(client, MONGO_ZONE);
	  collection.insert({name: key, msg: val}, {safe:true},
	                    function(err, objects) {
	    if (err) console.warn(err.message);
	    if (err && err.message.indexOf('E11000 ') !== -1) {
	      // this _id was already inserted in the database
	    }
	  });
	});

}
