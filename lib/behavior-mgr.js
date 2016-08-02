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

var log = require('humix-logger').createLogger('qiproxy')
  .child({loc: 'lib:behavior-mgr'});

module.exports = {
  name: 'ALBehaviorManager',
  commands: [ 'startBehavior' ],
  startBehavior: startBehavior
}

function startBehavior(proxy, behavior) {

  log.debug('start behavior', behavior);

  // remove double quotes
  behavior = behavior.replace(/['"]+/g, '');

  proxy.startBehavior(behavior);
}
