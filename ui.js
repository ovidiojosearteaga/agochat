//UI buttons

function enableUiControls(localStream) {

  $("#mic-btn").prop("disabled", false);
  $("#video-btn").prop("disabled", false);
  $("#screen-share-btn").prop("disabled", false);
  $("#exit-btn").prop("disabled", false);

  $("#mic-btn").click(function() {
    toggleMic(localStream);
  });

  $("#video-btn").click(function () {
    toggleVideo(localStream);
  });

  $("#screen-share-btn").click(function() {
    toggleScreenShareBtn();
    $(this).prop("disabled", true);
    if (screenShareActive) {
      stopScreenShare();
    } else {
      initScreenShare();
    }
  });

  $("#exit-btn").click(function() {
    console.log("so sad to see you leave the channel");
    leaveChannel();
  });

  $(document).keypress(function(e) {
    switch (e.key) {
      
      case "m":
        console.log("squick toggle the mic");
        toggleMic(localStream);
        break;

      case "v":
        console.log("quick toggle the video");
        toggleVideo(localStream);
        break;

      case "s":
        console.log("initilizing screen share");
        toggleScreenShareBtn(); //set screen share button icon
        $("#screen-share-btn").prop("disabled", true);
        if (screenShareActive) {
          stopScreenShare();
        } else {
          initScreenShare();
        }
        break;

      case "q":
        console.log("so sad to see you quit the channel");
        leaveChannel();
        break;
    }

    if (e.key === "r") {
      windows.history.back();
    }
  });

}

function toggleColorBtn(btn) {
  btn.toggleClass("btn-dark").toggleClass("btn-danger");
}

function toggleScreenShareBtn() {
  $("#screen-share-btn").toggleClass("btn-danger");
  $("#creen-share-icon").toggleClass("fa-share-square").toggleClass("fa-times-circle");
}

function toggleVisibility(elementID, visible) {
  if (visible) {
    $(elementID).attr("style", "display:block");
  } else {
    $(elementID).attr("style", "display:none");
  }
}

function toggleMic(localStream) {
  toggleColorBtn($("#mic-btn"));
  $("#mic-icon").toggleClass("fa-microphone").toggleClass("fa-microphone-slash");
  if ($("#mic-icon").hasClass('fa-microphone')) {
    localStream.unmuteAudio();
    toggleVisibility("#mute-overlay", false);
  } else {
    localStream.muteAudio();
    toggleVisibility("#mute-overlay", true);
  }
}

function toggleVideo(localStream) {
  toggleColorBtn($("#video-btn"));
  $("#video-icon").toggleClass('fa-video').toggleClass('fa-video-slash');
  if ($("#video-icon").hasClass('fa-video')) {
    localStream.unmuteVideo();
    toggleVisibility("#no-local-video", false);
  } else {
    localStream.muteVideo();
    toggleVisibility("#no-local-video");
  }
}

