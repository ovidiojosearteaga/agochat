//app / channel settings
var agoraAppId = "8fb866a7397e4321bf89d6844c6b6aa1";
var channelName = "agora-web-docs-demo";

var cameraVideoProfile = '480p_4';
var screenVideoProfile = '480p_2';

var client = AgoraRTC.createClient(
  {
    mode: "rtc", 
    codec: "h264"
  }
);

var screenClient = AgoraRTC.createClient(
  {
    mode: "rtc",
    code: "vp8"
  }
);

var remoteStreams = {};

var localStreams = {
  camera: {
    id: "",
    stream: {}
  },
  screen: {
    id: "",
    stream: {}
  }
};

var mainStreamId;
var screenShareActive = false;

client.init(
  agoraAppId, 
  () => {
    console.log("AgoraRTC client initialized");
    joinChannel();
  },
  (err) => {
    console.log("[ERROR] : AgoraRTC client init failed", err);
  }
);

client.on(
  'stream-published',
  (evt) => {
    console.log("Publish local stream successfully");
  } 
);

client.on(
  'stream-added', 
  (evt) => {
    var stream = evt.stream;
    var streamId = stream.getId();

    console.log("new stream added: " + streamId);

    if (streamId != localStreams.screen.id) {
      console.log('subscribe to remote stream:' + streamId);

      client.subscribe(
        stream, 
        (err) => 
        {
          console.log("[ERROR] : subscribe stream failed", err);
        }
      );
    }
  }
);

client.on(
  'stream-subscribed',
  (evt) => {
    var remoteStream = evt.stream;
    var remoteId = remoteStream.getId();
    remoteStreams[remoteId] = remoteStream;
    console.log("Subscribe remote stream successfully: " + remoteId);

    if ($('#full-screen-video').is(':empty')) {
      mainStreamId = remoteId;
      remoteStream.play('full-screen-video');
    } else {
      addRemoteStreamMiniView(remoteStream);
    }
  }
);

client.on(
  'peer-leave',
  (evt) => {
    var streamId = evt.stream.getId();
    console.log("Remote stream: " + streamId + "has left");
    
    if (remoteStreams[streamId] != undefined) {
      remoteStreams[streamId].stop();
      delete remoteStreams[streamId];

      if (streamId == mainStreamId) {
        var streamIds = Objec.keys(remoteStreams);
        var randomId = streamIds[Math.floor(Math.random()*streamIds.length)];
        remoteStreams[randomId].stop();
        var remoteContainerID = '#' + randomId + '_container';
        $(remoteContainerID).empty().remove();
        remoteStreams[randomId].play('full-screen-video');
        mainStreamId = randomId;
      
      } else {
        var remoteContainerID = '#' + streamId + '_container';
        $(remoteContainerID).empty().remove();
      }
    }
  }
);

client.on(
  'mute-audio',
  (evt) => {
    console.log("Remote stream: " + evt.uid + "has muted audio");
    const remoteId = evt.uid;
    toggleVisibility('#'+remoteId+'_mute', true);
  }
);

client.on(
  'unmute-audio',
  (evt) => {
    console.log("Remote stream: " + evt.uid + "has un-muted autio");
    const remoteId = evt.uid;
    toggleVisibility('#'+remoteId+'_mute', false);
  }
);

client.on(
  'mute-video',
  (evt) => {
    console.log("Remote stream: " + evt.uid + "has muted video");
    const remoteId = evt.uid;
    if (remoteId != mainStreamId) {
      toggleVisibility('#'+remoteId+'_no-video', true);
    }
  }
);

client.on(
  'unmute-video',
  (evt) => {
    console.log("Remote stream: " + evt.uid + "has un-muted video");
    const remoteId = evt.uid;
    toggleVisibility('#'+remoteId+'_no-video', false);
  }
);

function joinChannel () {
  var token = generateToken();
  var userID = null;
  
  client.join(
    token,
    channelName, 
    userID, 
    (uid) => {
      console.log("User " + uid + " join channel successfully");
      createCameraStream(uid);
      localStreams.camera.id = uid;
    },
    (err) => {
      console.log("[ERROR] : join channel failed", err);
    }
  );

}

function createCameraStream(uid) {

  var localStream = AgoraRTC.createStream({
    streamID: uid,
    audio: true,
    video: true,
    screen: false,
  });

  localStream.setVideoProfile(cameraVideoProfile);
  localStream.init(
    () => {
      console.log("getUserMedia successfully");
      localStream.play("local-video");

      client.publish(localStream, (err) => {
        console.log("[ERROR] : publish local stream error: " + err);
      });

      enableUiControls(localStream);
      localStreams.camera.stream = localStream;
    },
    (err) => {
      console.log("[ERROR] : getUserMedia failed", err);
    }
  );
}

function initScreenShare() {
  screenClient.init(
    agoraAppId,
    () => {
      console.log("AgoraRTC screen client initialized");
      joinChannelAsScreenChannel();
      screenShareActive = true;
    },
    (err) => {
      console.log("[ERROR] : AgoraRTC screenClient init failed", err);
    }
  );
}

function joinChannelAsScreenChannel() {
  var token = generateToken();
  var userID = null;

  screenClient.join(
    token, 
    channelName, 
    userID, 
    (uid) => {
      localStreams.screen.id = uid;

      var screenStream = AgoraRTC.createStream({
        streamId: uid,
        audio: false,
        video: false,
        screen: true,
        extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg',
        mediaSource: 'screen',
      });

      screenStream.setVideoProfile(screenVideoProfile);
      screenStream.init(
        () => {
          console.log("getScreen successfully");
          localStreams.screen.stream = screenStream;
          $("#screen-share-btn").prop("disabled", false);
          screenClient.publish(screenStream, () => {
            console.log("[ERROR] : publish screenstream error: ", err);
          });
        },
        (err) => {
          console.log("[ERROR] : getScreen failed", err);
          localStreams.screen.id = "";
          localStreams.screen.stream = {};
          screenShareActive = false;
          toggleScreenShareBtn()
        }
      );
    },
    (err) => {
      console.log("[ERROR] : join channel as screen-share failed", err);
    }
  );

  screenClient.on('stream-published', (evt) => {
    console.log("Publish screen stream successfully");
    localStreams.camera.stream.disableVideo();
    localStreams.camera.stream.stop();

    remoteStreams[mainStreamId].stop();
    addRemoteStreamMiniView(remoteStreams[mainStreamId]);

    $("#video-btn").prop("disabled", true);
  });

  screenClient.on('stopScreenSharing', (evt) => {
    console.log("screen sharing stopped", err);
  });
}

function stopScreenShare() {
  localStreams.screen.stream.disableVideo();
  localStreams.screen.stream.stop();
  localStreams.camera.stream.enableVideo();
  localStreams.camera.stream.play('local-video');

  $("#video-btn").prop("disabled", false);
  screenClient.leave(
    () => {
      screenShareActive = false;
      console.log("screen client leaves channel");
      $("#screen-share-btn").prop("disabled", false);
      screenClient.unpublish(localStreams.screen.stream);
      localStreams.screen.stream.close();
      localStreams.screen.id = "";
      localStreams.screen.stream = {};
    },
    (err) => {
      console.log("client leave failed", err);
    }
  );
}

function addRemoteStreamMiniView(remoteStream) {
  var streamId = remoteStream.getId();

  $("#remote-streams").append(
    $("<div/>", {'id': streamId + '_container', 'class': 'remote-stream-container col'}).append(
      $("<div/>", {'id': streamId + '_mute', 'class': 'mute-overlay'}).append(
        $("<i/>", {'class': 'fas fa-microphone-slash'})
      ),
      $("<div/>", {'id': streamId + '_no-video', 'class': 'no-video-overlay text-center'}).append(
        $("<i/>", {'class': 'fas fa-user'})
      ),
      $("<div/>", {'id': 'agora_remote_' + streamId, 'class': 'remote-video'})
    )
  );

  remoteStream.play('agora_remote_' + streamId);

  var containerId = '#' + streamId + '_container';
  $(containerId).dblclick(function() {

    remoteStreams[mainStreamId].stop();
    addRemoteStreamMiniView(remoteStreams[mainStreamId]);
    $(containerId).empty().remove();
    
    remoteStreams[streamId].stop();
    remoteStreams[streamId].play('full-screen-video');
    mainStreamId = streamId;

  });
}

function leaveChannel() {

  if (screenShareActive) {
    stopScreenShare();
  }

  client.leave(
    () => {
      console.log("client leaves channel");
      localStreams.camera.stream.stop();
      client.unpublish(localStreams.camera.stream);
      localStreams.camera.stream.close();
      $("#remote-streams").empty();

      $("#mic-btn").prop("disabled", true);
      $("#video-btn").prop("disabled", true);
      $("#screen-share-btn").prop("disabled", true);
      $("#exit-btn").prop("disabled", true);

      toggleVisibility("#mute-overlay", false);
      toggleVisibility("#no-local-video", false);
    },
    (err) => {
      console.log("client leave failed", err);
    }
  );
}

function generateToken() {
  return null;
}
