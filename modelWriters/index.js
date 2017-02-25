const DeviceWriter = require('./DeviceWriter'),
      VirtualSensorWriter = require('./VirtualSensorWriter'),
      model = require('../chariotModel'),
      Sensor = model.Sensor,
      Device = model.Device,
      Building = model.Building,
      RuleWriter = require('./RuleWriter');

module.exports = (api) => {
  return {
    updateDevice: (device, callback) => {
      let deviceWriter = new DeviceWriter(device);
      deviceWriter.update(api, callback);
    },

    createDevice: (device, callback) => {
      let deviceWriter = new DeviceWriter(device);
      deviceWriter.post(api, callback);
    },

    updateRule: (rule, callback) => {
      let ruleWriter = new RuleWriter(rule);
      ruleWriter.update(api, callback);
    },

    createRule: (rule, callback) => {
      let ruleWriter = new RuleWriter(rule);
      ruleWriter.post(api, callback);
    },

    createVirtualSensor: function (virtualSensor, callback) {
      let writer = new VirtualSensorWriter(virtualSensor);
      writer.post(api, callback);
    },

    updateVirtualSensor: function (virtualSensor, callback) {
      let writer = new VirtualSensorWriter(virtualSensor);
      writer.update(api, callback);
    },

    createDeviceEntityForSupersensor: function (userId, buildingName, callback) {
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
};
