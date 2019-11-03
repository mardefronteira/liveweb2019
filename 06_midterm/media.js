
    /*
            PEERJS
                          */
        console.log('this is aksjdn');

//         // peer server that shawn set up for us
//         var peerServer = new Peer (thisID, {host:'liveweb-new.itp.io', port:9000, path:'/'});
//         var peerGate = false;
//
//         // get id from server
//         peerServer.on('open', (id) => {
//           console.log('my peer ID is: ' + id +', their ID is '+ theirID);
//
//           makeCall(theirID);
//         });
//
//         peerServer.on('error', (err) =>{
//           console.log(err);
//         });
//
//         peerServer.on('call', (incomingCall) => {
//           console.log("got a call!");
//
//
//           //send stream
//           incomingCall.answer(myStream);
//
//           //receive stream
//           incomingCall.on('stream', (remoteStream) => {
//             getStream(remoteStream);
//           });
//         });
//
//         function makeCall(idToCall) {
//           console.log('ligando...');
//           // var call = peerServer.call(idToCall, myStream);
// //>>>>>>>> TypeError: peerServer.call(...) is undefined, mas só às vezes?!?!?!
//
//            peerServer.call(idToCall, myStream).on('stream', (remoteStream) => {
//             getStream(remoteStream);
//           });
//         }

        function getStream(rStream) {
            console.log("got remote stream");

            document.getElementById('thisVideo').style.display = "none";
            document.getElementById('theirVideo').style.display = "block";

            var videoElement = document.getElementById('theirVideo');
            videoElement.srcObject = rStream;
            videoElement.play();
        }

        /*
                  SOCKET.IO
                                  */
      var socket = io.connect("165.227.81.235:8080");

      socket.on('connect', () => {
        console.log("Connected");
      });

      var lastNote = "fakeNote";
      var notesElement;

      socket.on('noteFromServer', (receivedNote) => {
        if (receivedNote !== notesElement.value) {
          notesElement.value = receivedNote;
          console.log("received note: " + receivedNote);
          lastNote = notesElement.value;
        }
      });

      function sendNotes() {
        // console.log(lastNote, notesElement.value, document.getElementById('notes').value);
        if (lastNote !== notesElement.value) {
          socket.emit('noteFromClient', notesElement.value);
          lastNote = notesElement.value;
          console.log("sent note: " + lastNote);
        }
      }
      /*
            GETuSERmEDIA
                            */

        var myStream = null;
        var constraints = {
          audio:true,
          video:true
        };

        var gotMedia = false;

        window.addEventListener('load', function(){
            // Prompt the user for permission, get the stream
            navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
            /* Use the stream */

            // Attach to our video object
            var videoElement = document.getElementById('thisVideo');
            videoElement.srcObject = stream;

            // Wait for the stream to load enough to play
            videoElement.addEventListener('loadedmetadata', function(e) {
              videoElement.play();
            });

            //global for stream
            myStream = stream;

            initRecorder();




            // peer server that shawn set up for us
            var peerServer = new Peer (thisID, {host:'liveweb-new.itp.io', port:9000, path:'/'});
            var peerGate = false;

            // get id from server
            peerServer.on('open', (id) => {
              console.log('my peer ID is: ' + id +', their ID is '+ theirID);

              makeCall(theirID);
            });

            peerServer.on('error', (err) =>{
              console.log(err);
            });

            peerServer.on('call', (incomingCall) => {
              console.log("got a call!");


              //send stream
              incomingCall.answer(myStream);

              //receive stream
              incomingCall.on('stream', (remoteStream) => {
                getStream(remoteStream);
              });
            });

            function makeCall(idToCall) {
              console.log('ligando...');
              // var call = peerServer.call(idToCall, myStream);
            //>>>>>>>> TypeError: peerServer.call(...) is undefined, mas só às vezes?!?!?!

               peerServer.call(idToCall, myStream).on('stream', (remoteStream) => {
                getStream(remoteStream);
              });
            }


          })
          .catch(function(err) {
            /* Handle the error */
            alert(err);
          });

          notesElement = document.getElementById('notes');
          // console.log(typeof(notesElement), notesElement);

          window.setInterval(sendNotes, 100);

       });

       function displayVideo() {
          // console.log("display video:");
          // console.log(displayVid);
          if (document.getElementById('thisVideo').style.display === "none") {
            // console.log("show");
            document.getElementById('thisVideo').style.display = "block";
          } else {
            // console.log("hide");
            document.getElementById('thisVideo').style.display = "none";
          }
        }

var audioCtx;
var canvas;
var canvasCtx;
var clipsSection;
var stopButton;
var recButton;
    //main block for doing the audio recording
  function initRecorder() {
      console.log('starting recorder.');
      // set up basic variables for app

      recButton = document.getElementById('recButton');
      stopButton = document.getElementById('stopButton');
      clipsSection = document.getElementById('soundClips');
       canvas = document.getElementById('canvas');
       canvasCtx = canvas.getContext('2d');
       audioCtx = new (window.AudioContext || webkitAudioContext)();


      // disable stop button while not recording
      stopButton.disabled = true;
      var constraints = { audio: true };
      var chunks = [];

      var onSuccess = function(stream) {
        var mediaRecorder = new MediaRecorder(stream);

        visualize(stream);

        recButton.onclick = function() {
          mediaRecorder.start();
          console.log(mediaRecorder.state);
          console.log("recorder started");
          recButton.style.background = "red";

          stopButton.disabled = false;
          recButton.disabled = true;
        }

        stopButton.onclick = function() {
          mediaRecorder.stop();
          console.log(mediaRecorder.state);
          console.log("recorder stopped");
          recButton.style.background = "";
          recButton.style.color = "";
          // mediaRecorder.requestData();

          stopButton.disabled = true;
          recButton.disabled = false;
        }

        mediaRecorder.onstop = function(e) {
          console.log("data available after MediaRecorder.stop() called.");

          var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
          console.log(clipName);
          var clipContainer = document.createElement('article');
          var clipLabel = document.createElement('p');
          var audio = document.createElement('audio');
          var deleteButton = document.createElement('button');

          clipContainer.classList.add('clip');
          audio.setAttribute('controls', '');
          deleteButton.textContent = 'delete';
          deleteButton.className = 'delete';

          if(clipName === null) {
            clipLabel.textContent = 'My unnamed clip';
          } else {
            clipLabel.textContent = clipName;
          }

          clipContainer.appendChild(audio);
          clipContainer.appendChild(clipLabel);
          clipContainer.appendChild(deleteButton);
          clipsSection.appendChild(clipContainer);

          audio.controls = true;
          var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
          chunks = [];
          var audioURL = window.URL.createObjectURL(blob);
          audio.src = audioURL;
          console.log("recorder stopped");

          deleteButton.onclick = function(e) {
            evtTgt = e.target;
            evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
          }

          clipLabel.onclick = function() {
            var existingName = clipLabel.textContent;
            var newClipName = prompt('Enter a new name for your sound clip?');
            if(newClipName === null) {
              clipLabel.textContent = existingName;
            } else {
              clipLabel.textContent = newClipName;
            }
          }
        }

        mediaRecorder.ondataavailable = function(e) {
          chunks.push(e.data);
        }
      }

      var onError = function(err) {
        console.log('The following error occured: ' + err);
      }

      navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

    }

    function visualize(stream) {
      var source = audioCtx.createMediaStreamSource(stream);

      var analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      var bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);
      //analyser.connect(audioCtx.destination);

      draw()

      function draw() {
        WIDTH = canvas.width
        HEIGHT = canvas.height;

        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;


        for(var i = 0; i < bufferLength; i++) {

          var v = dataArray[i] / 128.0;
          var y = v * HEIGHT/2;

          if(i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();

      }
    }
