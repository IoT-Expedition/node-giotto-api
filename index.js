var request = require('request'),
    MQApi = require('./MQApi'),
    sensors = require('./sensors'),
    timeseries = require('./timeseries'),
    subscriptions = require('./subscriptions');

function GIoTTOApi(opts) {
  this.clientId = opts.clientId;
  this.clientSecret = opts.clientSecret;

  this.protocol = opts.protocol || 'https';
  this.hostname = opts.hostname || 'bd-exp.andrew.cmu.edu';
  this.csPort = opts.csPort || 81;
  this.dsPort = opts.dsPort || 82;
  this.email = opts.email || 'no@gmail.com';
  this.mqUsername = opts.mqUsername;
  this.mqPassword = opts.mqPassword;
  this.virtualSensor = () => {
    const VirtualSensor = require('./VirtualSensor');
    return new VirtualSensor(this);
  };

  this.cs = { protocol: this.protocol, hostname: this.hostname, port: this.csPort };
  this.ds = { protocol: this.protocol, hostname: this.hostname, port: this.dsPort };

  Object.assign(this,
      sensors(this),
      subscriptions(this),
      timeseries(this));
}

GIoTTOApi.prototype = (function () {
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

  return {
    authenticate: function (callback) {
      getAccessToken(this, callback);
    },

    getRequest: function (server, path, callback) {
      var options = {
        method: 'GET',
        url: server.protocol + '://' + server.hostname + ':' + server.port + '/' + path,
        headers: {
          'Authorization': 'bearer ' + this.accessToken
        }
      };

      request(options, callback);
    },

    postRequest: function (server, path, body, callback) {
      var options = {
        method: 'POST',
        url: server.protocol + '://' + server.hostname + ':' + server.port + '/' + path,
        json: body,
        headers: {
          'Authorization': 'bearer ' + this.accessToken,
          'Content-Type': 'application/json'
        }
      };

      request(options, callback);
    },

    deleteRequest: function (server, path, body, callback) {
      var options = {
        method: 'DELETE',
        url: server.protocol + '://' + server.hostname + ':' + server.port + '/' + path,
        json: body,
        headers: {
          'Authorization': 'bearer ' + this.accessToken,
          'Content-Type': 'application/json'
        }
      };

      request(options, callback);
    },

    publishToQueue: function (queueName, msg, callback) {
      var mq = this.mqApi();
      mq.authenticate(function (err) {
        if (err) { callback(err); return; }

        mq.publishToQueue(queueName, msg, callback);
      });
    },

    subscribeToQueue: function (queueName, callback) {
      var mq = this.mqApi();
      mq.authenticate(function (err) {
        if (err) { callback(err); return; }

        mq.listenOnQueue(queueName, callback);
      });
    },

    mqApi: function () {
      return new MQApi({
        hostname: this.hostname,
        username: this.mqUsername,
        password: this.mqPassword
      });
    }
  };
})();

module.exports = GIoTTOApi;
