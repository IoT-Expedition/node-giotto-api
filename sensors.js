var TimeseriesAggregator = require('./TimeseriesAggregator');

function sensors(api) {
  var aggregator = new TimeseriesAggregator(api);
  aggregator.start();

  return {
    createSensor: function (name, building, identifier, callback) {
      api.postRequest(api.cs, 'api/sensor', {
        'data': {
          'name': name,
          'building': building,
          'identifier': identifier
        }
      }, callback);
    },

    addSensorMetadata: function (sensorUuid, metadataHash, callback) {
      var metadataList = [];
      for (var key in metadataHash) {
        metadataList.push({
          'name': key,
          'value': metadataHash[key]
        });
      }

      api.postRequest(api.cs, 'api/sensor/' + sensorUuid + '/metadata', {
        'data': metadataList
      }, callback);
    },

    searchSensorsInBuilding: function (building, callback) {
      api.postRequest(api.cs, 'api/search', {
        'data': {
          'Building': [ building ]
        }
      }, callback);
    },

    searchSensorsWithMetadata: function (metadata, callback) {
      var metadataList = [];
      for (var key in metadata) {
        var value = metadata[key];
        metadataList.push(key + ':' + value);
      }

      api.postRequest(api.cs, 'api/search', {
        'data': {
          'MetaData': metadataList
        }
      }, callback);
    },

    postTimeseriesValue: function (sensorUuid, time, value) {
      aggregator.postTimeseriesValue(sensorUuid, time, value);
    }
  };
}

module.exports = sensors;
