const root = document.getElementById('root');
const usernameInput = document.getElementById('username');
const button = document.getElementById('join_leave');
const shareScreen = document.getElementById('share_screen');
const toggleChat = document.getElementById('toggle_chat');
const container = document.getElementById('container');
const count = document.getElementById('count');
const chatScroll = document.getElementById('chat-scroll');
const chatContent = document.getElementById('chat-content');
const chatInput = document.getElementById('chat-input');
const blur_bg = document.getElementById('blur-background');
//const muteUnmute = document.getElementById('mute_unmute');
const videooffon = document.getElementById('video_on_off');
let connected = false;
let room;
let chat;
let conv;
let screenTrack;
let audioTrack;
let videoTrack;
let dataTrack;
let lastSpeakerSID = null;


function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById('local').firstChild;
        let trackElement = track.attach();
        trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
        video.appendChild(trackElement);

//video on off

videooffon.addEventListener('click', event => {
      if (track.isEnabled) {
        track.disable();
        videooffon.innerHTML = 'Unmute and Turn Video On';
      } else {
        track.enable();
        videooffon.innerHTML = 'Mute and Stop Video';
      } 
  
});



    });
//blur bg

    /*const bg = new Twilio.VideoProcessors.GaussianBlurBackgroundProcessor({
        assetsPath: '/',
        maskBlurRadius: 10,
        blurFilterRadius: 5,
    });
    await bg.loadModel();
    track.addProcessor(bg);*/
};
//



//
function addLocalData() {
    // Creates a Local Data Track
    var localDataTrack = new Twilio.Video.LocalDataTrack();
    dataTrack = localDataTrack;
};

function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        let username = usernameInput.value;
        if (!username) {
            alert('Enter your name before connecting');
            return;
        }
        button.disabled = true;
        button.innerHTML = 'Connecting...';
        connect(username).then(() => {
            button.innerHTML = 'Leave call';
            button.disabled = false;
            shareScreen.disabled = false;

        }).catch(() => {
            alert('Connection failed.');
            button.innerHTML = 'Join call';
            button.disabled = false;
        });
    }
    else {
        disconnect();
        button.innerHTML = 'Join call';
        connected = false;
        shareScreen.innerHTML = 'Share screen';
        shareScreen.disabled = true;
        /*muteUnmute.innerHTML ='Mute';
        muteUnmute.disabled = true;
        videooffon.innerHTML = 'Turn Video Off';
        videooffon.disabled = true;*/
    }
};

function connect(username) {
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        let data;
        fetch('/meetingroom/login', {
            method: 'POST',
            body: JSON.stringify({'username': username})
        }).then(res => res.json()).then(_data => {
            // join video call
            data = _data;
            return Twilio.Video.connect(data.token, {dominantSpeaker: true});
        }).then(_room => {
            room = _room;
            room.localParticipant.publishTrack(dataTrack);
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            room.on('dominantSpeakerChanged', participant =>{
                handleSpeakerChange(participant);
            });
            updateParticipantCount();
            connectChat(data.token, data.conversation_sid);
            resolve();
        }).catch(e => {
            console.log(e);
            reject();
        });
    });
    return promise;
};

function updateParticipantCount() {
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';
};

function participantConnected(participant) {
    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    participantDiv.setAttribute('class', 'participant');

    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.setAttribute('class', 'label');

    labelDiv.setAttribute('class', 'nameLabel');
    // Add unique SID to the name tag
    labelDiv.setAttribute('id', 'N_' + participant.sid);
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
};

/*function trackSubscribed(div, track) {
    let trackElement = track.attach();
    trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
    div.appendChild(trackElement);
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => {
        if (element.classList.contains('participantZoomed')) {
            zoomTrack(element);
        }
        element.remove()
    });
};*/

function trackSubscribed(div, track) {
    if (track.kind === 'data') {
        // Registering addToRemoteDataLabel(...) event handler Remote Data Track receive
        track.on('message', data => {
            addToRemoteDataLabel(JSON.parse(data).emojiData, track.sid);
        });
        // Attaching the data track to a display label
        attachRemoteDataTrack(div,track);
    }
    else {
        let trackElement = track.attach();
        trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
        div.appendChild(trackElement);
       // div.appendChild(track.attach());
    }
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => {
        if (element.classList.contains('participantZoomed')) {
            zoomTrack(element);
        }
        element.remove()
    });
    if (track.kind === 'data') {
        document.getElementById(track.sid).remove();
    }
    else {
        track.detach().forEach(element => element.remove());
    }
};


function disconnect() {
    room.disconnect();
    if (chat) {
        chat.shutdown().then(() => {
            conv = null;
            chat = null;
        });
    }
    while (container.lastChild.id != 'local')
        container.removeChild(container.lastChild);
    button.innerHTML = 'Join call';
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    //toggleChat.disabled = true;
    connected = false;
    updateParticipantCount();
};

function shareScreenHandler() {
    event.preventDefault();
    if (!screenTrack) {
        navigator.mediaDevices.getDisplayMedia().then(stream => {
            screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
            room.localParticipant.publishTrack(screenTrack);
            screenTrack.mediaStreamTrack.onended = () => { shareScreenHandler() };
            console.log(screenTrack);
            shareScreen.innerHTML = 'Stop sharing';
        }).catch(() => {
            alert('Could not share the screen.')
        });
    }
    else {
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        shareScreen.innerHTML = 'Share screen';
    }
};



function zoomTrack(trackElement) {
    if (!trackElement.classList.contains('trackZoomed')) {
        // zoom in
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                let zoomed = false;
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.add('trackZoomed')
                        zoomed = true;
                    }
                });
                if (zoomed) {
                    participant.classList.add('participantZoomed');
                }
                else {
                    participant.classList.add('participantHidden');
                }
            }
        });
    }
    else {
        // zoom out
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.remove('trackZoomed');
                    }
                });
                participant.classList.remove('participantZoomed')
                participant.classList.remove('participantHidden')
            }
        });
    }
};

function connectChat(token, conversationSid) {
    return Twilio.Conversations.Client.create(token).then(_chat => {
        chat = _chat;
        return chat.getConversationBySid(conversationSid).then((_conv) => {
            conv = _conv;
            conv.on('messageAdded', (message) => {
                addMessageToChat(message.author, message.body);
            });
            return conv.getMessages().then((messages) => {
                chatContent.innerHTML = '';
                for (let i = 0; i < messages.items.length; i++) {
                    addMessageToChat(messages.items[i].author, messages.items[i].body);
                }
                toggleChat.disabled = false;
            });
        });
    }).catch(e => {
        console.log(e);
    });
};

function addMessageToChat(user, message) {
    chatContent.innerHTML += `<p><b>${user}</b>: ${message}`;
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

function toggleChatHandler() {
    event.preventDefault();
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    else {
        root.classList.add('withChat');
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
};

function onChatInputKey(ev) {
    if (ev.keyCode == 13) {
        conv.sendMessage(chatInput.value);
        chatInput.value = '';
    }
};

function activateEmojiButtons(){
    let emojiButtonGroup = document.getElementsByClassName("emojibuttons");
    let emojiButton;
    for (let i = 0; i < emojiButtonGroup.length; i++)
    {
        emojiButton = emojiButtonGroup[i];
        emojiButton.addEventListener('click', emojiButtonHandler);
    }
}

function emojiButtonHandler(event){
    let emojiButton = event.target;
    let emojiText = emojiButton.innerHTML;
    addToLocalDataLabel(emojiText);
    sendDataToRoom(emojiText);

}

function addToLocalDataLabel(newText){
    let localDataLabel = document.getElementById("datalocal");
    localDataLabel.innerHTML = newText;
    animateDataLabel(localDataLabel, "appear");
}

function sendDataToRoom(data){
    dataTrack.send(JSON.stringify({
        emojiData: data
      }));
}

function attachRemoteDataTrack(div,track) {
    let dataDiv = document.createElement('div');
    dataDiv.setAttribute('id', track.sid);
    dataDiv.setAttribute('class', "emoji");
    div.appendChild(dataDiv);
};

function addToRemoteDataLabel(newText, dataTrackSID)
{
    let remoteDataLabel = document.getElementById(dataTrackSID);
    remoteDataLabel.innerHTML = newText;
    animateDataLabel(remoteDataLabel, "appear");
}
function animateDataLabel(div, startClass){
    setTimeout(function(){ div.classList.remove(startClass); }, 1000);
    div.classList.add(startClass);
}

function handleSpeakerChange(participant) {
    removeDominantSpeaker();
    if (participant !== null)
        assignDominantSpeaker(participant);
}


function setLabelColor(label, color) {
    if (label !== null) {
        label.style.backgroundColor = color;
    }
}

function removeDominantSpeaker() {
    let speakerNameLabel;
    speakerNameLabel = document.getElementById(lastSpeakerSID);
    setLabelColor(speakerNameLabel, "#ebebeb"); // default color
}

function assignDominantSpeaker(participant) {
    let domSpeakerNameLabel;
    lastSpeakerSID = "N_" + participant.sid;
    domSpeakerNameLabel = document.getElementById(lastSpeakerSID);
    setLabelColor(domSpeakerNameLabel, "#b5e7a0"); // green color
}

/*function blurHander(){
    const bg = new Twilio.VideoProcessors.GaussianBlurBackgroundProcessor({
    assetsPath: '/',
    maskBlurRadius: 10,
    blurFilterRadius: 5,
  });
  await bg.loadModel();
  video.Track.addProcessor(bg);
}*/

activateEmojiButtons();
addLocalVideo();
addLocalData();
button.addEventListener('click', connectButtonHandler);
shareScreen.addEventListener('click', shareScreenHandler);
//blur_bg.addEventListener('click', blurHandler);
/*muteUnmute.addEventListener('click', muteAudio);
videooffon.addEventListener('click', muteVideo);*/
toggleChat.addEventListener('click', toggleChatHandler);
chatInput.addEventListener('keyup', onChatInputKey);
