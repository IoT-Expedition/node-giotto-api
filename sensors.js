const model = require('./chariotModel'),
      DeviceWriter = require('./DeviceWriter'),
      VirtualSensorWriter = require('./VirtualSensorWriter'),
      Sensor = model.Sensor,
      Device = model.Device,
      Building = model.Building;

var TimeseriesAggregator = require('./TimeseriesAggregator');

function sensors(api) {
  var aggregator = new TimeseriesAggregator(api);
  aggregator.start();

  return {
    createSensor: function (name, building, identifier, callback) {
      console.log(name, building, identifier);
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

    // tagList: [ { name: 'name', value: 'value' }, ... ]
    addSensorTags: function (sensorUuid, tagList, callback) {
      console.log(tagList);
      api.postRequest(api.cs, 'api/sensor/' + sensorUuid + '/tags', {
        'data': tagList
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

    searchSensorsWithTags: function (tags, callback) {
      var tagList = [];
      tags.forEach((tag) => {
        tagList.push(tag.name + ':' + tag.value);
      });

      api.postRequest(api.cs, 'api/search', {
        'data': {
          'Tags': tagList
        }
      }, callback);
    },

    postTimeseriesValue: function (sensorUuid, time, value) {
      if (api.redisPubSub) {
        api.redisPubSub.emit(sensorUuid, {
          uuid: sensorUuid, time: time, value: value
        });
      }
      aggregator.postTimeseriesValue(sensorUuid, time, value);
    },

    createVirtualSensor: function (virtualSensor, callback) {
      let writer = new VirtualSensorWriter(virtualSensor);
      writer.post(api, callback);
    },

    updateVirtualSensor: function (virtualSensor, callback) {
      let writer = new VirtualSensorWriter(virtualSensor);
      writer.update(api, callback);
    },

    createDeviceEntityForSupersensor(userId, buildingName, callback) {
      api.searchSensorsWithTags([{
        name: 'UserID',
        value: userId
      }], (err, response, body) => {
        if (err) { callback(err); return; }
        let sensors = body.result || [];

        if (sensors.length) {
          let building = new Building({});
          building.name = buildingName;

          let device = new Device({}, building);
          device.name = 'SuperSensor ' + userId;
          device.type = 'SuperSensor';

          sensors.forEach((def) => {
            let statTag = def.tags.find((tag) => { return tag.name == 'StatID'; });
            // only take the average stats
            if (!statTag || statTag.value != 3) { return; }

            let deviceIdTag = def.tags.find((tag) => { return tag.name == 'DeviceID'; });
            if (deviceIdTag) { device.id = deviceIdTag.value; }

            let sensor = new Sensor({}, device);
            sensor.uuid = def.name;
            device.addSensor(sensor);
          });

          let writer = new DeviceWriter(device, {
            dontPostSensors: true,
            dontPostActions: true
          });
          writer.post(api, callback);
        } else {
          callback('No devices found');
        }
      });
    }
  };
}

module.exports = sensors;
