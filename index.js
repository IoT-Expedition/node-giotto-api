const request = require('request'),
      NRP = require('node-redis-pubsub'),
      MQApi = require('./MQApi'),
      BuildingModelBuilder = require('./BuildingModelBuilder'),
      DeviceWriter = require('./DeviceWriter'),
      RuleWriter = require('./RuleWriter'),
      sensors = require('./sensors'),
      timeseries = require('./timeseries'),
      subscriptions = require('./subscriptions');

function getAccessToken(api, callback) {
  var accessTokenUrl = api.protocol + '://' + api.hostname + ':' + api.csPort +
    '/oauth/access_token/client_id=' +
    api.clientId + '/client_secret=' + api.clientSecret;

  request.get(accessTokenUrl, function (err, response, body) {
    if (err) {
      callback(err);
    } else {
      var accessToken = JSON.parse(body).access_token;
      api.accessToken = accessToken;
      callback();
    }
  });
}

class GIoTTOApi {
  constructor(opts) {
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;

    this.protocol = opts.protocol || 'https';
    this.mlProtocol = opts.mlProtocol || 'http';
    this.hostname = opts.hostname || 'bd-exp.andrew.cmu.edu';
    this.mlHostname = opts.mlHostname || 'localhost';
    this.csPort = opts.csPort || 81;
    this.dsPort = opts.dsPort || 82;
    this.mlPort = opts.mlPort || 5000;
    this.email = opts.email || 'no@gmail.com';
    this.mqUsername = opts.mqUsername;
    this.mqPassword = opts.mqPassword;
    this.virtualSensor = () => {
      const VirtualSensor = require('./VirtualSensor');
      return new VirtualSensor(this);
    };

    this.cs = { protocol: this.protocol, hostname: this.hostname, port: this.csPort };
    this.ds = { protocol: this.protocol, hostname: this.hostname, port: this.dsPort };
    this.ml = { protocol: this.mlProtocol, hostname: this.mlHostname, port: this.mlPort };

    if (opts.redis) {
      this.redisPubSub = new NRP(opts.redis);
      this.redisPubSub.on('error', (err) => { console.log(err); });
    }

    Object.assign(this,
        sensors(this),
        subscriptions(this),
        timeseries(this));
  }

  authenticate(callback) {
    getAccessToken(this, callback);
  }

  getRequest(server, path, callback) {
    let requester = (done) => {
      var options = {
        method: 'GET',
        url: server.protocol + '://' + server.hostname + ':' + server.port + '/' + path,
        headers: {
          'Authorization': 'bearer ' + this.accessToken
        }
      };

      request(options, done);
    };

    this._sendRequest(requester, callback);
  }

  postRequest(server, path, body, callback) {
    let requester = (done) => {
      var options = {
        method: 'POST',
        url: server.protocol + '://' + server.hostname + ':' + server.port + '/' + path,
        json: body,
        headers: {
          'Authorization': 'bearer ' + this.accessToken,
          'Content-Type': 'application/json'
        }
      };

      request(options, done);
    };

    this._sendRequest(requester, callback);
  }

  deleteRequest(server, path, body, callback) {
    let requester = (done) => {
      var options = {
        method: 'DELETE',
        url: server.protocol + '://' + server.hostname + ':' + server.port + '/' + path,
        json: body,
        headers: {
          'Authorization': 'bearer ' + this.accessToken,
          'Content-Type': 'application/json'
        }
      };

      request(options, done);
    };

    this._sendRequest(requester, callback);
  }

  _sendRequest(requester, callback) {
    requester((err, response, body) => {
      if (response && response.statusCode != 200 && body.includes('401 Unauthorized')) {
        console.log('Re-authenticating');

        this.authenticate((authErr) => {
          if (authErr) {
            console.log(authErr);
            callback(err, response, body);
          } else {
            requester(callback);
          }
        });
      } else {
        callback(err, response, body);
      }
    });
  }

  publishToQueue(queueName, msg, callback) {
    var mq = this.mqApi();
    mq.authenticate(function (err) {
      if (err) { callback(err); return; }

      mq.publishToQueue(queueName, msg, callback);
    });
  }

  subscribeToQueue(queueName, callback) {
    var mq = this.mqApi();
    mq.authenticate(function (err) {
      if (err) { callback(err); return; }

      mq.listenOnQueue(queueName, callback);
    });
  }

  updateDevice(device, callback) {
    let deviceWriter = new DeviceWriter(device);
    deviceWriter.update(this, callback);
  }

  createDevice(device, callback) {
    let deviceWriter = new DeviceWriter(device);
    deviceWriter.post(this, callback);
  }

  updateRule(rule, callback) {
    let ruleWriter = new RuleWriter(rule);
    ruleWriter.update(this, callback);
  }

  createRule(rule, callback) {
    let ruleWriter = new RuleWriter(rule);
    ruleWriter.post(this, callback);
  }

  getBuildingModel(name, callback) {
    let builder = new BuildingModelBuilder(name, this);
    builder.build(callback);
  }

  mqApi() {
    return new MQApi({
      hostname: this.hostname,
      username: this.mqUsername,
      password: this.mqPassword
    });
  }
}

module.exports = GIoTTOApi;
