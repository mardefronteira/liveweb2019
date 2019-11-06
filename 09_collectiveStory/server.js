/*
○ list of connected clients:
  • updates whenever someone connects/disconnects;
  • is attached to username;

○ events for new inputs

○ send data to server
*/
// HTTP Portion
var http = require('http');
var fs = require('fs'); // Using the filesystem module
var httpServer = http.createServer(requestHandler);
var url = require('url');
httpServer.listen(8080);

function requestHandler(req, res) {

	var parsedUrl = url.parse(req.url);
  var path = parsedUrl.pathname;
	if (path == "/") {
		path = "index.html";
	}

	fs.readFile(__dirname + path,
		// Callback function for reading
		function (err, data) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + req.url);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(data);
  		}
  	);
    // Send a log message to the console
    console.log("Got a request " + req.url);
}

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

var Datastore = require('nedb');
var db = new Datastore({filename:"data.db", autoload:true});

var clients = [];


// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
	// We are given a websocket object in our function
	function (socket) {
		console.log("We have a new client: " + socket.id);

// Variables for each user
    var username;
    var participatingStories = [];
    var nextStoryIndex;
    var nextStory = null;
    var nextObject = null;
    var updatedStory = true;
    var currentScene;

// Function to ask for the story after each submitted information
    function getnextStory(thisScene) {

// Do we need to store the scene?
      //currentScene = thisScene;

      
      if (nextStoryIndex >= clients.length - 1) {
        nextStoryIndex = 0;
      } else {
        nextStoryIndex++;
      }
      console.log("next story's creator: "+ nextStoryIndex, clients[nextStoryIndex]);
      checkNextStory();

    }


      function checkNextStory() {
        console.log('checking story for ', username)
        db.find({creator: clients[nextStoryIndex]}, function (err, docs) {
          nextStory = docs[0];
	  console.log(clients[nextStoryIndex]);
	  console.log(docs);

	  if(nextStory != null) {
	    if (currentScene == 'place') nextObject = nextStory.where.name;
	    if (currentScene == 'placeDescription') nextObject = nextStory.where.description;
	    if (currentScene == 'character') nextObject = nextStory.who;
	    if (currentScene == 'action') nextObject = nextStory.what;
	    if (currentScene == 'reason') nextObject = nextStory.why;

	    if (nextObject == null) {
	            socket.emit('waitingUsers', currentScene);
		    console.log(username, " is waiting for ", clients[nextStoryIndex]);
		    setTimeout(checkNextStory,1000);
	    } else {
	            socket.emit('nextStory', nextStory);
	            console.log("sent ", nextStory, " to ", username);
	            participatingStories.push(clients[nextStoryIndex]);
	            console.log(username,"'s participatingStories: ", participatingStories);
	          }
	      	}
        });


    }

    socket.on('setUsername', (data) => {
      username = data;
      console.log(socket.id, ' = ', username);
	socket.username = username;

      var story = {
	creator: socket.id,
        // creator: username,
        where: {
         name: null,
         description: null
        },
        who: null,
        what: null,
        why: null,
        users: [username]
      };

      clients.push(socket.id);
      nextStoryIndex = clients.indexOf(socket.id);
      console.log("clients: ", clients);
      console.log("this client's index: ", nextStoryIndex);

      db.insert(story, function(err, lastVal) {
        // console.log("error: ", err);
        // console.log("lastVal: " + lastVal);
        console.log('saved ',story,' to database.')
      });
    });
    // When this user emits, client side: socket.emit('otherevent',some data);
		socket.on('newPlace', function(data) {
			console.log('received '+ data +' from ' + username);
      db.update({creator: clients[nextStoryIndex]}, {$set: {where: {name: data}}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        // console.log("lastVal: " + lastVal);
        console.log("newPlace: " + data);
      });
      getnextStory("place");
		});
    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('newDescription', function(data) {
      console.log('received '+ data +' from ' + username);
      db.update({creator: clients[clients.indexOf(socket.id)+1]}, {$set: {where: { description: data}}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        // console.log("lastVal: " + lastVal);
        console.log("newPlaceDescription: " + data);
      });
      getnextStory("placeDescription");
    });
    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('newCharacter', function(data) {
      console.log('received '+ data +' from ' + username);
      db.update({creator: username}, {$set: {who: data}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        // console.log("lastVal: " + lastVal);
        console.log("newCharacter: " + data);
      });
      getnextStory("character");
    });
    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('newAction', function(data) {
      console.log('received '+ data +' from ' + username);
      db.update({creator: username}, {$set: {what: data}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        // console.log("lastVal: " + lastVal);
        console.log("newAction: " + data);
      });
      getnextStory("action");
    });
    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('newReason', function(data) {
      console.log('received '+ data +' from ' + username);
      db.update({creator: username}, {$set: {why: data}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        // console.log("lastVal: " + lastVal);
        console.log("newReason: " + data);
      });

      db.find({}, function(err, docs) {
        console.log(err);
        for (var i = 0; i < docs.length; i++) {
      		console.log(docs[i]);
      	}
      })

    });

		socket.on('disconnect', function() {
			console.log("Client has disconnected " + username);
      clients.splice(clients.indexOf(socket.id));
      console.log(clients);
		});

    socket.on('reqUpdate', (data) =>{
      updatedStory = true;
    });
	});

// class Story {
//   constructor(storyId) {
//       title = storyId;
//       where = {
//         name: null,
//         description: null
//       };
//       who = null;
//       what = null;
//       why = null;
//       users = null;
//   }
// }
