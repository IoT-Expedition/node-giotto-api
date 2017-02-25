const model = require('../chariotModel'),
      async = require('async'),

      Sensor = model.Sensor,
      Action = model.Action,
      VirtualSensor = model.VirtualSensor,
      Device = model.Device,
      Rule = model.Rule,
      Location = model.Location,
      Building = model.Building;

let superSensorIds = {
  0: { name: 'Accelerometer', channels: [ 'X', 'Y', 'Z' ] },
  1: { name: 'Microphone' },
  // 2: { name: 'EMI' },
  // 3: { name: 'Geophone' },
  3: { name: 'Temperature' },
  4: { name: 'Barometer' },
  5: { name: 'Humidity' },
  6: { name: 'Illumination' },
  7: {
    name: 'Color',
    channels: [ 'Channel 1', 'Channel 2', 'Channel 3' ]
  },
  8: {
    name: 'Magnetometer',
    channels: [ 'Channel 1', 'Channel 2', 'Channel 3' ]
  },
  9: { name: 'WiFi' },
  10: { name: 'Motion' }
  // 11: {
  //   name: 'Geye',
  //   channels: [ 'Channel 1', 'Channel 2', 'Channel 3', 'Channel 4', 'Channel 5', 'Channel 6',
  //     'Channel 7', 'Channel 8', 'Channel 9', 'Channel 10', 'Channel 11', 'Channel 12',
  //     'Channel 13', 'Channel 14', 'Channel 15', 'Channel 16' ]
  // }
};


class BuildingModelBuilder {
  constructor(building, api) {
    this.buildingName = building;
    this.api = api;
  }

  build(callback) {
    let building = new Building();
    building.name = this.buildingName;

    this.api.searchSensorsInBuilding(this.buildingName, (err, response, body) => {
      if (err) {
        callback(err);
        return;
      }

      let allDeviceDefs = body.result || [];
      this._buildDevices(allDeviceDefs, building, (err) => {
        if (err) { callback(err); return; }

        this._buildVirtualSensors(allDeviceDefs, building);
        this._buildRules(allDeviceDefs, building);
        callback(null, building);
      });
    });
  }

  _buildDevices(allDeviceDefs, building, callback) {
    let deviceDefs = allDeviceDefs.filter((sensor) => {
      return sensor.tags.find((tag) => {
        return tag.name == 'Type' && tag.value == 'Device';
      });
    });

    async.forEach(deviceDefs, (deviceDef, done) => {
      let device = new Device({}, building);
      device.id = deviceDef.name;
      device.uuid = deviceDef.name;

      if (this._tagsWithName(deviceDef.tags, 'DeviceID').length) {
        device.id = this._tagsWithName(deviceDef.tags, 'DeviceID')[0].value;
      }

      if (this._tagsWithName(deviceDef.tags, 'DeviceType').length) {
        device.type = this._tagsWithName(deviceDef.tags, 'DeviceType')[0].value;
      }

      if (this._tagsWithName(deviceDef.tags, 'Name').length) {
        device.name = this._tagsWithName(deviceDef.tags, 'Name')[0].value;
      } else {
        device.name = deviceDef.source_name;
      }

      this._tagsWithName(deviceDef.tags, 'Location').forEach((tag) => {
        let location = new Location({}, building);
        location.name = tag.value;
        device.addLocation(location);
      });

      this._searchDeviceReferences(device, (err, referencedDeviceDefs) => {
        if (err) { done(err); return; }

        this._buildActions(device, deviceDef, referencedDeviceDefs);
        this._buildSensors(device, deviceDef, referencedDeviceDefs);

        building.addDevice(device);
        done();
      });
    }, callback);
  }

  _buildActions(device, deviceDef, referencedDeviceDefs) {
    this._tagsWithName(deviceDef.tags, 'ActionUuid').forEach((tag) => {
      let uuid = tag.value;
      let actionDef = referencedDeviceDefs.find((action) => {
        return action.name == uuid;
      });

      if (!actionDef) { return; }

      let action = new Action({}, device);
      action.id = uuid;
      action.uuid = uuid;

      if (this._tagsWithName(actionDef.tags, 'Name').length) {
        action.name = this._tagsWithName(actionDef.tags, 'Name')[0].value;
      }
      if (this._tagsWithName(actionDef.tags, 'Options').length) {
        action.options = JSON.parse(this._tagsWithName(actionDef.tags, 'Options')[0].value);
      }
      device.addAction(action);
    });
  }

  _buildSensors(device, deviceDef, referencedDeviceDefs) {
    this._tagsWithName(deviceDef.tags, 'SensorUuid').forEach((tag) => {
      let uuid = tag.value;
      let sensorDef = referencedDeviceDefs.find((sensor) => {
        return sensor.name == uuid;
      });

      if (!sensorDef) { return; }

      let isSuperSensor = this._tagsWithName(sensorDef.tags, 'ChannelID').length;
      if (isSuperSensor) {
        let sensorId = this._tagsWithName(sensorDef.tags, 'SensorID')[0];
        let channelId = this._tagsWithName(sensorDef.tags, 'ChannelID')[0];

        if (sensorId && channelId) {
          let superSensorDef = superSensorIds[sensorId.value];

          if (!superSensorDef) { return; }

          let sensor = new Sensor({}, device);
          sensor.id = uuid;
          sensor.uuid = uuid;
          sensor.name = superSensorDef.name;

          if (superSensorDef.channels) {
            let channel = superSensorDef.channels[channelId.value];
            sensor.group = sensor.name;
            sensor.name = channel;
          }

          device.addSensor(sensor);
        }
      }

      else {
        let sensor = new Sensor({}, device);
        sensor.id = uuid;
        sensor.uuid = uuid;
        sensor.min = 0;
        sensor.max = 100;

        if (this._tagsWithName(sensorDef.tags, 'Senses').length) {
          sensor.name = this._tagsWithName(sensorDef.tags, 'Senses')[0].value;
        }
        if (this._tagsWithName(sensorDef.tags, 'MinValue').length) {
          sensor.min = this._tagsWithName(sensorDef.tags, 'MinValue')[0].value;
        }
        if (this._tagsWithName(sensorDef.tags, 'MaxValue').length) {
          sensor.max = this._tagsWithName(sensorDef.tags, 'MaxValue')[0].value;
        }
        device.addSensor(sensor);
      }
    });
  }

  _buildVirtualSensors(allDeviceDefs, building) {
    let virtualSensorDefs = allDeviceDefs.filter((sensor) => {
      return sensor.tags.find((tag) => {
        return tag.name == 'Type' && tag.value == 'VirtualSensor';
      });
    });

    virtualSensorDefs.forEach((vsDef) => {
      let virtualSensor = new VirtualSensor({}, building);
      virtualSensor.id = vsDef.name;

      if (this._tagsWithName(vsDef.tags, 'Name').length) {
        virtualSensor.name = this._tagsWithName(vsDef.tags, 'Name')[0].value;
      }

      if (this._tagsWithName(vsDef.tags, 'ProgrammingType').length) {
        virtualSensor.programmingType = this._tagsWithName(vsDef.tags, 'ProgrammingType')[0].value;
      }

      if (this._tagsWithName(vsDef.tags, 'Samples').length) {
        let samples = this._tagsWithName(vsDef.tags, 'Samples')[0].value;
        virtualSensor.samples = JSON.parse(samples);
      }

      if (this._tagsWithName(vsDef.tags, 'Inputs').length) {
        let inputs = this._tagsWithName(vsDef.tags, 'Inputs')[0].value;
        virtualSensor.inputs = JSON.parse(inputs);
      }

      if (this._tagsWithName(vsDef.tags, 'Labels').length) {
        let labels = this._tagsWithName(vsDef.tags, 'Labels')[0].value;
        virtualSensor.labels = JSON.parse(labels);
      }

      if (this._tagsWithName(vsDef.tags, 'Conditions').length) {
        let conditions = this._tagsWithName(vsDef.tags, 'Conditions')[0].value;
        virtualSensor.data.conditions = JSON.parse(conditions);
      }

      building.addVirtualSensor(virtualSensor);
    });
  }

  _buildRules(allDeviceDefs, building) {
    let ruleDefs = allDeviceDefs.filter((sensor) => {
      return sensor.tags.find((tag) => {
        return tag.name == 'Type' && tag.value == 'Rule';
      });
    });

    ruleDefs.forEach((vsDef) => {
      let rule = new Rule({}, building);
      rule.id = vsDef.name;

      if (this._tagsWithName(vsDef.tags, 'Conditions').length) {
        let conditions = this._tagsWithName(vsDef.tags, 'Conditions')[0].value;
        rule.data.conditions = JSON.parse(conditions);
      }

      if (this._tagsWithName(vsDef.tags, 'Actions').length) {
        let actions = this._tagsWithName(vsDef.tags, 'Actions')[0].value;
        rule.data.actions = JSON.parse(actions);
      }

      building.addRule(rule);
    });
  }

  _searchDeviceReferences(device, callback) {
    this.api.searchSensorsWithTags([
      { name: 'DeviceID', value: device.id }
    ], (err, response, body) => {
      if (err) {
        callback(err);
        return;
      }

      callback(null, body.result || []);
    });
  }

  _tagsWithName(tags, name) {
    return tags.filter((tag) => {
      return tag.name == name;
    });
  }
}

module.exports = BuildingModelBuilder;
