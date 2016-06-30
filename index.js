var log = require('logule').init(module, 'qiproxy');
var HumixSense = require('node-humix-sense')

var config = {
    "moduleName":"qiproxy",
    "commands" : ["ALTextToSpeech.say", "ALBehaviorManager.startBehavior","ALPhotoCapture.takePicture"],
    "events" : ["ALTouch.FrontTactilTouched"],
    "debug": true
}

var humix = new HumixSense(config);
var hsm;

var QiSession = require('./qisession.js');
var session = new QiSession("127.0.0.1");
session.socket().on('connect', function () {
   console.log('QiSession connected!');

   session.service("ALMemory").done(function (memory) {

        console.log("got memory service");
        var subscriber = memory.subscriber("FrontTactilTouched");
        subscriber.signal.connect(ALMemory_frontTactilTouched);

    }).fail(function (error) {
    console.log("An error occurred:", error);
    });

}).on('disconnect', function () {
    console.log('QiSession disconnected!');
});




humix.on('connection', function(humixSensorModule){
    hsm = humixSensorModule;
    
    console.log('Connected to humix-sense.');

    // command registration    
    hsm.on("ALTextToSpeech.say", ALTextToSpeech_say);
    hsm.on("ALBehaviorManager.startBehavior", ALBehaviorManager_startBehavior);
    hsm.on("ALPhotoCapture.takePicture", ALPhotoCapture_takePicture);


    // event subscription
    //session.service("ALPhotoCapture").done(function (photo) {

});


function ALTextToSpeech_say(data) { 

    console.log('say :' + data);

    if (session) { 
        session.service("ALTextToSpeech").done(function (tts) {

            console.log("got tts service");
            tts.say(data);

        }).fail(function (error) {
        console.log("An error occurred:", error);
        });


    }
}

function ALBehaviorManager_startBehavior(data) { 

    console.log('startBehavior :'+data);
}

function ALPhotoCapture_takePicture(data) { 

    console.log('takePicture :' + data);
    
    if (session) { 
        session.service("ALPhotoCapture").done(function (photo) {

            console.log("got photo service");
            photo.takePicture("/home/nao/","pic.jpg").done(function (str) {
            console.log("file saved to " + str);
            }).fail(function (error) {
                console.log("An error occurred: " + error);
            });

        }).fail(function (error) {
        console.log("An error occurred:", error);
        });


    }

}

function ALMemory_frontTactilTouched(data) { 
     console.log('frontTactilTouched :'+data);
     if (hsm) { 

         hsm.event('ALMemory.FrontTactilTouched', data);

     }
}
