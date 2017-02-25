const GIoTTOSensor = require('./GIoTTOSensor'),
      hashString = require('./chariotModel').hashString;


class VirtualSensorWriter {
  constructor(virtualSensor) {
    this.virtualSensor = virtualSensor;
  }

  post(api, callback) {
    let building = this.virtualSensor.building.name;

    let giottoDevice = this._buildGiottoDevice(api);
    let id = hashString(this.virtualSensor.name + Math.round(Math.random() * 10000));

    giottoDevice.post(id, this.virtualSensor.name, building, (err, uuid) => {
      if (err) { callback(err); return; }

      this.virtualSensor.id = uuid;
      callback();
    });
  }

  update(api, callback) {
    let giottoDevice = this._buildGiottoDevice(api);
    giottoDevice.postTags(this.virtualSensor.id, callback);
  }

  _buildGiottoDevice(api) {
    let giottoDevice = new GIoTTOSensor(api);

    let vsData = this.virtualSensor.data;
    giottoDevice.addTag('Type', 'VirtualSensor');
    giottoDevice.addTag('Name', vsData.name);
    giottoDevice.addTag('ProgrammingType', vsData.programmingType);
    giottoDevice.addTag('Samples', JSON.stringify(vsData.samples));
    giottoDevice.addTag('Inputs', JSON.stringify(vsData.inputs));
    giottoDevice.addTag('Labels', JSON.stringify(vsData.labels));
    giottoDevice.addTag('Conditions', JSON.stringify(vsData.conditions));
    return giottoDevice;
  }
}

module.exports = VirtualSensorWriter;
