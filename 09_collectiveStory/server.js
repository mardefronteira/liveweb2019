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

// db.remove({},{multi:true}, function(err,numDeleted){
// 	console.log('deleted ',numDeleted,'stories');
// });


// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
	// We are given a websocket object in our function
	function (socket) {

		console.log("We have a new client: " + socket.id);

		//variables for each client
    var username;
    var participatingStories = [];
    var nextStoryIndex;
    var nextStory = null;
    var nextObject = null;
    var updatedStory = true;
    var currentScene;

    function getnextStory(thisScene) {

      currentScene = thisScene;

      if (nextStoryIndex >= clients.length - 1) {
        nextStoryIndex = 0;
      } else {
        nextStoryIndex++;
      }
      // console.log("next story's creator: " + nextStoryIndex, clients[nextStoryIndex]);
			checkNextStory();

    }


      function checkNextStory() {
				// Find next story in the database
        console.log('checking story for ', username);
        db.find({creator: clients[nextStoryIndex]}, function (err, docs) {
          nextStory = docs[0];
					// console.log(clients[nextStoryIndex]);
					// console.log(docs);

					// Check if the story has been created
					if(nextStory != null) {
						// Assign the next part of the story to the nextObject variable
	          if (currentScene == 'place') nextObject = nextStory.whereName;
	          if (currentScene == 'placeDescription') nextObject = nextStory.whereDescription;
	          if (currentScene == 'character') nextObject = nextStory.who;
	          if (currentScene == 'action') nextObject = nextStory.what;
	          if (currentScene == 'reason') nextObject = nextStory.why;

						// Check if the user has submitted the part of the story that we are waiting for

	          if (nextObject == null) {
							// If story is incomplete
							// Tell client that we are waiting for user input
	            socket.emit('waitingUsers', currentScene);
							console.log(username, " is waiting for ", clients[nextStoryIndex]);

							// Check story again every second
							setTimeout(checkNextStory,1000);
	          } else {
							// If story is complete, send it to the client
	            socket.emit('nextStory', nextStory);
	            console.log("sent ", nextStory, " to ", username);

							// Add received story to participatingStories list
	            participatingStories.push(clients[nextStoryIndex]);
	            console.log(username,"'s participatingStories: ", participatingStories);
	          }
	      	}
        });


    }

		/* When client inserts username */
    socket.on('setUsername', (data) => {
			// Assign username to global variable
      username = data;
      // console.log(socket.id, ' = ', username);
			// socket.username = username;

			// Create story object to be saved in the database
      var story = {
				// Add this user's socket id as the creator, push their username into the
				// authors list, set all other variables to null
				creator: socket.id,
        whereName: null,
        whereDescription: null,
        who: null,
        what: null,
        why: null,
        authors: [username]
      };

			// Push client's id to clients array
      clients.push(socket.id);

			// Set starting story index to the client's own index
      nextStoryIndex = clients.indexOf(socket.id);
      console.log("clients: ", clients);
      // console.log("this client's index: ", nextStoryIndex);

			// Insert sroty into database
      db.insert(story, function(err, lastVal) {
        // console.log("error: ", err);
        // console.log("lastVal: " + lastVal);
        console.log('saved ',story,' to database.')
      });
    });


		// Functions for new information coming from the client
		// socket.on('newPlace', function(data) {
		// 	console.log('received '+ data +' from ' + username);
    //   db.update({creator: clients[nextStoryIndex]}, {$set: {where: {name: data, description: null}}},{}, function(err, lastVal) {
    //     // console.log("error: ", err);
    //     console.log("newPlace for story "+nextStoryIndex+": " + data);
    //   });
    //   getnextStory("place");
		// });
		function trim () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };

		socket.on('newPlace', function(data) {
				console.log('received '+ data +' from ' + username);
				data=data.trim();
				console.log("|",data,"|",data[-1]);
				if (data.slice(-1) == '.' || data.slice(-1) == ',') {
					console.log('slice 0, -1:',data.slice(0,-1));
					data = data.slice(0,-1);

				}
	      db.update({creator: clients[nextStoryIndex]}, {$set: {whereName: data}},{}, function(err, lastVal) {
	        // console.log("error: ", err);
	        console.log("newPlace for story "+nextStoryIndex+": " + data);
	      });
	      getnextStory("place");
			});

    socket.on('newDescription', function(data) {
      console.log('received '+ data +' from ' + username);
			db.update({creator: clients[nextStoryIndex]}, {$set: {whereDescription: data}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        console.log("newDescription for story "+nextStoryIndex+": " + data);
      });
			db.find()
      getnextStory("placeDescription");
    });

    socket.on('newCharacter', function(data) {
			console.log('received '+ data +' from ' + username);
			db.update({creator: clients[nextStoryIndex]}, {$set: {who: data}},{}, function(err, lastVal) {
				// console.log("error: ", err);
        console.log("newCharacter for story "+nextStoryIndex+": " + data);
      });
      getnextStory("character");
    });

    socket.on('newAction', function(data) {
      console.log('received '+ data +' from ' + username);
      db.update({creator: clients[nextStoryIndex]}, {$set: {what: data}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        console.log("newAction for story "+nextStoryIndex+": " + data);
      });
      getnextStory("action");
    });

    socket.on('newReason', function(data) {
      console.log('received '+ data +' from ' + username);
      db.update({creator: clients[nextStoryIndex]}, {$set: {why: data}},{}, function(err, lastVal) {
        // console.log("error: ", err);
        console.log("newReason for story "+nextStoryIndex+": " + data);
			});

			console.log("full stories of " + username);
			// participatingStories.forEach(getFullStory);
// 			var thisStories = [];
// 			console.log(participatingStories);
// //---- this is starting at index 3???
//
// 			for (var j = 0; j <= participatingStories.length - 1; j++) {
// 				console.log(j, participatingStories[j]);
// 				db.find({creator: participatingStories[j]}, function(err, docs) {
// 					//console.log(err);
// 					console.log(username+"'s story number "+j+":")
// 					// console.log(docs[0]);
// 					thisStories.push(docs[0]);
// 				});
// 			}
// 			console.log(username+"'s stories: "+thisStories);
			db.find({}, (err, docs) =>
			{
				var toSend =[];
				// console.log(docs.length);
				for (var i = 0; i < docs.length; i++ ){
					// console.log(docs[i]);
					if (docs[i].why != null) {
						toSend.push(docs[i]);
					}
				}
				socket.emit('clientStories', toSend);
				// console.log(docs);
			});

    });

		// function getFullStory(item, index) {
		// 	console.log("story "+ index +":");
		// 	db.find({creator: item}, function(err, docs) {
		// 		console.log(err);
		// 		console.log(docs[0]);
		// 	});
		// }

/*
		db.find({}, function(err, docs) {
			console.log(err);
			console.log(docs);
		});
*/
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
