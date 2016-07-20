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

var util = require('util');
var log = require('humix-logger').createLogger('qiproxy', {consoleLevel: 'debug'});
var HumixSense = require('node-humix-sense');

var QiSession = require('./qisession.js');

var humix = new HumixSense(config);
var hsm;
var config = { 
    moduleName: 'qiproxy',
    commands: [],
    events: ['ALTouch.FrontTactilTouched'],
    debug: true };

//current supported services
var services = {
    ALTextToSpeech: './lib/text-to-speech',
    ALBehaviorManager: './lib/behavior-mgr',
    ALPhotoCapture: './lib/photo-capture'};

var commands = {};
var serviceProxies = {};


for (var service in services) {
  var mod = require(services[service]);
  log.debug('register', service);
  mod.commands.forEach(function(cmd) {
    var name = util.format('%s.%s', service, cmd);
    config.commands.push(name);

    commands[name] = createCommandHandler(mod, cmd);
  });
}

log.debug('all supported commands:', config.commands);
//caching the proxy objects

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
  for(var command in commands) {
    hsm.on(command, commands[command]);
  }
  // event subscription
  //TODO
});

function createCommandHandler(mod, cmdName) {
  var service = mod.name;
  return function () {
    var _arguments = arguments;
    if (!session) {
      log.debug('QiSession is not available, skip command');
      return;
    }

    var proxy = serviceProxies[service];
    if (!proxy) {
      log.debug('create new proxy for', service);
      session.service(service).done(function (proxyObj) {
        log.debug('got proxy for', service);
        serviceProxies[service] = proxyObj;
        var rev;
        switch (_arguments.length) {
        case 1:
          rev = mod[cmdName].call(undefined, proxyObj, _arguments[0]);
          break;
        case 2:
          rev = mod[cmdName].call(undefined, proxyObj, _arguments[0],
            _arguments[1]);
          break;
        case 3:
          rev = mod[cmdName].call(undefined, proxyObj, _arguments[0],
            _arguments[1], _arguments[2]);
          break;
        case 4:
          rev = mod[cmdName].call(undefined, proxyObj, _arguments[0], 
            _arguments[1], _arguments[2], _arguments[3]);
          break;
        default:
          var args = Array.prototype.slice.call(_arguments, 0);
          args.unshift(proxyObj);
          rev = mod[cmdName].apply(undefined, args);
          break;
        }
        return rev;
      }).fail(function (error) {
        log.error('failed to get proxy for',service, error);
        delete serviceProxies[service];
      });
      return;
    }

    log.debug('reuse proxy for', service);
    var rev;
    switch (arguments.length) {
    case 1:
      rev = mod[cmdName].call(undefined, proxy, arguments[0]);
      break;
    case 2:
      rev = mod[cmdName].call(undefined, proxy, arguments[0],
        arguments[1]);
      break;
    case 3:
      rev = mod[cmdName].call(undefined, proxy, arguments[0],
        arguments[1], arguments[2]);
      break;
    case 4:
      rev = mod[cmdName].call(undefined, proxy, arguments[0], 
        arguments[1], arguments[2], arguments[3]);
      break;
    default:
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift(proxy);
      rev = mod[cmdName].apply(undefined, args);
      break;
    }
    return rev;
  };
}

function ALMemory_frontTactilTouched(data) { 
  log.debug('frontTactilTouched:', data);
  if (hsm) { 
    hsm.event('ALMemory.FrontTactilTouched', data);
  }
}
