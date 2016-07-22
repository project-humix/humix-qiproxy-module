/*******************************************************************************
* Copyright (c) 2016 IBM Corp.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* 
* Node module: humix-qiproxy-module
*******************************************************************************/
'use strict';

var log = require('humix-logger').createLogger('qiproxy');
var HumixSense = require('node-humix-sense');

var config = {
  moduleName:"qiproxy",
  commands : ["ALTextToSpeech.say", "ALBehaviorManager.startBehavior","ALPhotoCapture.takePicture"],
  events : ["ALTouch.FrontTactilTouched"],
  debug: true
};

var humix = new HumixSense(config);
var hsm;

var QiSession = require('./qisession.js');
var session = new QiSession("127.0.0.1");
session.socket().on('connect', function () {
  log.info('QiSession connected!');

  session.service("ALMemory").done(function (memory) {

    log.debug("got memory service");
    var subscriber = memory.subscriber("FrontTactilTouched");
    subscriber.signal.connect(ALMemory_frontTactilTouched);

  }).fail(function (error) {
    log.error("An error occurred:", error);
  });

}).on('disconnect', function () {
  log.info('QiSession disconnected!');
});




humix.on('connection', function(humixSensorModule){
  hsm = humixSensorModule;
  log.info('Connected to humix-sense.');

  // command registration    
  hsm.on("ALTextToSpeech.say", ALTextToSpeech_say);
  hsm.on("ALBehaviorManager.startBehavior", ALBehaviorManager_startBehavior);
  hsm.on("ALPhotoCapture.takePicture", ALPhotoCapture_takePicture);
  // event subscription
  //session.service("ALPhotoCapture").done(function (photo) {
});


function ALTextToSpeech_say(data) { 

  log.debug('say :', data);

  if (session) { 
    session.service("ALTextToSpeech").done(function (tts) {

      log.debug("got tts service");
      tts.say(data);

    }).fail(function (error) {
        log.error("An error occurred:", error);
    });
  }
}

function ALBehaviorManager_startBehavior(data) { 
  log.debug('startBehavior :', data);
}

function ALPhotoCapture_takePicture(data) { 
  log.debug('takePicture :', data);
    
  if (session) { 
    session.service("ALPhotoCapture").done(function (photo) {

      log.debug("got photo service");
      photo.takePicture("/home/nao/","pic.jpg").done(function (str) {
        log.debug("file saved to", str);
      }).fail(function (error) {
        log.error("An error occurred:", error);
      });

    }).fail(function (error) {
      log.error("An error occurred:", error);
    });
  }

}

function ALMemory_frontTactilTouched(data) { 
  log.debug('frontTactilTouched:', data);
  if (hsm) { 
    hsm.event('ALMemory.FrontTactilTouched', data);
  }
}
