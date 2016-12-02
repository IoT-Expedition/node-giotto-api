function ml(api) {
  var VirtualSensor = api.VirtualSensor;

  var createVirtualSensor = function (virtualSensor, callback) {
    api.postRequest(api.ml, 'sensor', {
      'name': virtualSensor.name,
      'user_id': virtualSensor.userId,
      'labels': virtualSensor.labels,
      'inputs': virtualSensor.inputs,
      'sensor_uuid': virtualSensor.uuid,
      'description': virtualSensor.description
    }, function (err, response, body) {
      if (err) {
        callback(err); return;
      }
      if (response.statusCode != 200) {
        console.error(body);
        callback('Failed to create sensor'); return;
      }

      virtualSensor.id = body.ret;
      callback(null, virtualSensor);
    });
  };

  var getAllVirtualSensors = function (callback) {
    api.getRequest(api.ml, 'sensors', function (err, response, body) {
      if (err) {
        callback(err); return;
      }
      if (response.statusCode != 200) {
        callback('Failed to get sensors'); return;
      }

      callback(null, body.ret.map(function (sensorInfo) {
        var sensor = new VirtualSensor();
        sensor.id = sensorInfo._id;
        sensor.name = sensorInfo.name;
        sensor.uuid = sensorInfo.sensor_uuid;
        sensor.userId = sensorInfo.user_id;
        sensor.labels = sensorInfo.labels;
        sensor.inputs = sensorInfo.inputs;
        sensor.description = sensorInfo.description;
        return sensor;
      }));
    });
  };

  var deleteVirtualSensor = function (virtualSensor, callback) {
    api.deleteRequest(api.ml, 'sensor/' + virtualSensor.id,
        null,
        function (err, response) {
          if (err) {
            callback(err); return;
          }
          if (response.statusCode != 200) {
            callback('Failed to get sensors'); return;
          }

          callback();
        });
  };

  var addSample = function (virtualSensor, sampleStart, sampleEnd, label, callback) {
    api.postRequest(api.ml, 'sensor/' + virtualSensor.id + '/sample', {
      'start_time': parseFloat(sampleStart),
      'end_time': parseFloat(sampleEnd),
      'label': label
    }, function (err, response, body) {
      if (err) {
        callback(err); return;
      }
      if (response.statusCode != 200) {
        console.error(body);
        callback('Failed to create sensor'); return;
      }

      callback(null, body.ret);
    });
  };

  var trainClassifier = function (virtualSensor, callback) {
    api.postRequest(api.ml, 'sensor/' + virtualSensor.id + '/classifier/train',
        {},
        function (err, response, body) {
          if (err) {
            callback(err); return;
          }
          if (response.statusCode != 200) {
            console.error(body);
            callback('Failed to train classifier'); return;
          }

          callback(null, body.message);
        });
  };

  var makePrediction = function (virtualSensor, time, callback) {
    api.getRequest(api.ml, 'sensor/' + virtualSensor.id +
        '/classifier/predict?time=' + time, function (err, response, body) {
          if (err) {
            callback(err); return;
          }
          if (response.statusCode != 200) {
            callback('Failed to make classifier prediction'); return;
          }
          var data = JSON.parse(body);

          if (data.result == 'ok') {
            callback(null, data.ret);
          } else {
            callback(data.result);
          }
        });
  };

  return {
    createVirtualSensor: createVirtualSensor,
    getAllVirtualSensors: getAllVirtualSensors,
    deleteVirtualSensor: deleteVirtualSensor,

    addVirtualSensorSample: addSample,
    trainVirtualSensorClassifier: trainClassifier,
    makeVirtualSensorPrediction: makePrediction
  };
}

module.exports = ml;
