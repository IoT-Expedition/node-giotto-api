const async = require('async'),
      GIoTTOSensor = require('./GIoTTOSensor');


class DeviceWriter {
  constructor(device, options) {
    this.device = device;
    this.options = options || {};
  }

  post(api, callback) {
    let building = this.device.building.name;

    this._buildGiottoDevice(api, (err, giottoDevice) => {
      giottoDevice.post(this.device.id, this.device.name, building, (err, mainUuid) => {
        if (err) { callback(err); return; }

        this.device.uuid = mainUuid;
        callback();
      });
    });
  }

  update(api, callback) {
    this._buildGiottoDevice(api, (err, giottoDevice) => {
      giottoDevice.postTags(this.device.uuid, callback);
    });
  }

  _buildGiottoDevice(api, callback) {
    let giottoDevice = new GIoTTOSensor(api);

    giottoDevice.addTag('Type', 'Device');
    giottoDevice.addTag('DeviceID', this.device.id);
    giottoDevice.addTag('Name', this.device.name);
    if (this.device.type) { giottoDevice.addTag('DeviceType', this.device.type); }
    this.device.locations.forEach((location) => {
      giottoDevice.addTag('Location', location.name);
    });

    async.map(this.device.actions, (action, done) => {
      if (action.uuid || this.options.dontPostActions) {
        done(null, action.uuid);
      } else {
        this._postAction(api, action, done);
      }
    }, (err, actionUuids) => {
      actionUuids.forEach((uuid) => {
        if (uuid) giottoDevice.addTag('ActionUuid', uuid);
      });

      async.map(this.device.sensors, (sensor, done) => {
        if (sensor.uuid || this.options.dontPostSensors) {
          done(null, sensor.uuid);
        } else {
          this._postSensor(api, sensor, done);
        }
      }, (err, sensorUuids) => {
        sensorUuids.forEach((uuid) => {
          if (uuid) giottoDevice.addTag('SensorUuid', uuid);
        });

        callback(null, giottoDevice);
      });
    });
  }

  _postSensor(api, sensor, done) {
    let giottoSensor = new GIoTTOSensor(api);
    let building = this.device.building.name;

    giottoSensor.addTag('Type', 'Sensor');
    giottoSensor.addTag('Senses', sensor.name);
    giottoSensor.addTag('DeviceID', this.device.id);
    if (sensor.min) {
      giottoSensor.addTag('MinValue', sensor.min);
    }
    if (sensor.max) {
      giottoSensor.addTag('MaxValue', sensor.max);
    }

    var id = this.device.id + '_' + sensor.name.replace(/\s+/g, '-').toLowerCase();
    let name = this.device.name + '-' + sensor.name;
    giottoSensor.post(id, name, building, (err, sensorUuid) => {
      if (err) { done(err); return; }
      sensor.uuid = sensorUuid;
      done(null, sensorUuid);
    });
  }

  _postAction(api, action, done) {
    let giottoAction = new GIoTTOSensor(api);
    let building = this.device.building.name;

    giottoAction.addTag('Type', 'Action');
    giottoAction.addTag('Name', action.name);
    giottoAction.addTag('DeviceID', this.device.id);

    if (action.options) {
      giottoAction.addTag('Options', JSON.stringify(action.options));
    }

    var id = this.device.id + '_' + action.name.replace(/\s+/g, '-').toLowerCase();
    let name = this.device.name + '-' + action.name;
    giottoAction.post(id, name, building, (err, actionUuid) => {
      if (err) { done(err); return; }
      action.uuid = actionUuid;
      done(null, actionUuid);
    });
  }
}

module.exports = DeviceWriter;
