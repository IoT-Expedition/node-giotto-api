var readPythonDictionary = require('./readPythonDictionary');

function subscriptions(api) {
  var queueName;

  return {
    startListeningForSensorData: function (listener, callback) {
      if (queueName) {
        api.subscribeToQueue(queueName, listener);
      } else {
        api.postRequest(api.ds, 'api/apps', {
          name: 'IoT Commissioner Location',
          email: api.email
        }, function (err, response, body) {
          if (err) { callback(err); return; }

          if (body.success != 'True') {
            callback('Failed to register app'); return;
          }

          queueName = body.app_id;
          api.subscribeToQueue(queueName, function (err, msg) {
            if (err) { console.log(err); callback(err); return; }
            // {"fields":{"value":17.93212890625,"inserted_at":"2016-11-22T02:12:00.11318206Z"},"time":"2016-11-22T02:12:00.05500006Z","measurement":"9181f988-d171-418c-ba18-b59d0d44570e"}
            var message = readPythonDictionary(msg.content.toString());
            var sensor = message.measurement;
            var value = message.fields.value;
            listener(null, sensor, value);
          });
          callback();
        });
      }
    },

    subscribeToSensor: function (macId, callback) {
      if (queueName) {
        api.postRequest(api.ds, 'api/apps/subscription', {
          email: api.email,
          app: queueName,
          sensor: macId
        }, function (err, response, body) {
          if (err) { callback(err); return; }

          if (body.success != 'True') {
            callback('Failed to subscribe to sensor: ' + body); return;
          }
          callback();
        });
      } else {
        callback('Call startListeningForSensorData first.');
      }
    },

    unsubscribeFromSensor: function (macId, callback) {
      if (queueName) {
        api.deleteRequest(api.ds, 'api/apps/subscription', {
          email: api.email,
          app: queueName,
          sensor: macId
        }, function (err, response, body) {
          if (err) { callback(err); return; }

          if (body.success != 'True') {
            callback('Failed to unsubscribe from sensor'); return;
          }
        });
      } else {
        callback('Call startListeningForSensorData first.');
      }
    }

  };
}

module.exports = subscriptions;
