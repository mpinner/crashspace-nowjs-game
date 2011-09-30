// nowjs rtt hackathon entry
// author: @mpinner, @atxmb0mb, @rknla
// team: @crashspacela
// we learnt some serious JS, NodeJs, and NowJs
// we learnt a little Mongo, JQuery, and FlickrApi

//dependencies
var html = require('fs').readFileSync(__dirname+'/helloworld.html');
var sys= require('sys');

// rpc (npm install now)
var nowjs = require("now");

// persistence is fun (npm install mongodb)
var mongodb = require('mongodb');

// https://github.com/ciaranj/flickrnode
var FlickrAPI= require('flickr').FlickrAPI;

// magic constants
var PORT = 8080;
var MONGO_HOST = "127.0.0.1";
var MONGO_PORT = 27017;
var MONGO_ZONE = "test_collection";
var FLICKR_API_TOKEN = "2d78d121218ef3c05ef658a213fe4f72";

//establish your flickr api cred
var flickr = new FlickrAPI(FLICKR_API_TOKEN);

// bind 8080;
var server = require('http').createServer(function(req, res){
	res.end(html);
    });
server.listen(PORT);

// configure nowjs
var everyone = nowjs.initialize(server);

// this method is called by our clients using nowjs magic
everyone.now.distributeMessage = function(message){
	console.warn(this.user.cookie);
	insertToMongo(this.now.name, message);
   // everyone.now.receiveMessage(this.now.name, message);
    fetchFlickrUrl(message,this.now.name);
};

everyone.now.grabLatest = grabLastFromMongo;

function grabLastFromMongo() {
	
	val = 1;

	// establish connection
	var server = new mongodb.Server(MONGO_HOST, MONGO_PORT, {});

	// create session 
	new mongodb.Db('test', server, {}).open(function (error, client) {
		if (error) throw error;
		var collection = new mongodb.Collection(client, MONGO_ZONE);
		 
		// insert
		collection.find().sort({$natural:-1}).limit(val).toArray(function(err, docs) {
    	    sys.puts(sys.inspect(docs));
    	    for (i = 0; i < docs.length; i++){
    	        fetchFlickrUrl(docs[i].msg, docs[i].name);
    	    }
		});
	});
	return;
}



// record what the use does... bc we can and it was easy
// todo: better connection management 
function insertToMongo(key, val) {

	// establish connection
	var server = new mongodb.Server(MONGO_HOST, MONGO_PORT, {});

	// create session 
	new mongodb.Db('test', server, {}).open(function (error, client) {
	if (error) throw error;
	var collection = new mongodb.Collection(client, MONGO_ZONE);
	 
	// insert
	collection.insert(
			{name: key, msg: val}, 
			{safe:true},
	        function(err, objects) 
	        {
			  if (err) console.warn(err.message);
			  if (err && err.message.indexOf('E11000 ') !== -1) {
				  // this _id was already inserted in the database
			  }
	        });
	});
	
	return;
}

// grab a flickr images for each word in the entered text and call client method everyone.now.receivePhoto(url)
function fetchFlickrUrl(keyword, name) {
    sys.puts(keyword);

    latIndex = -1; // keyword.indexOf('latitude') ;
    longIndex = keyword.indexOf('longitude') ;
    if (latIndex != -1) {
        latitude = keyword.substring(latIndex);
        latitude = latitude.toString().split(' ',1);
        latitude = latitude.toString().split('=',2)[1];
        sys.puts(latitude);
        if (longIndex != -1) {
	        longitude = keyword.substring(longIndex);
	        longitude = longitude.toString().split(' ',1);
	        longitude = longitude.toString().split('=',2)[1];
	        sys.puts(longitude);
	    	flickr.photos.search({extras:'url_t,tags',lat:latitude,lon:longitude,per_page:1 },  
	    		function(error, results) {
	    	    	sys.puts(sys.inspect(results));
	    	        //sys.puts(results.photo[0].url_sq);
	    	        everyone.now.receivePhoto(results.photo[0].url_t, latitude.substring(0,4)+","+longitude.substring(0,6), name);
	    	});
        }
    }
	        
	var tag = keyword.split(' ');
	if (tag.length > 2){
		for(i = 0; i < tag.length-2; i++){
			myTag = tag[i];
			flickr.photos.search(
					{tags:myTag,extras:'url_sq,tags',per_page:1 }, makeClientFlickrCallback(myTag, name)  
			);
		}
	}
	
	return;	
}

var makeClientFlickrCallback = function (text, name) {
	return function(error, results) 
	{
        sys.puts(sys.inspect(results));
        //sys.puts(results.photo[0].url_sq);
        everyone.now.receivePhoto(results.photo[0].url_sq, text, name);
        //      JSON.parse(results);
        //sys.puts(sys.inspect(obj));
      
      };
};
