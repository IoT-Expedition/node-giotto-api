const GIoTTOSensor = require('./GIoTTOSensor'),
      hashString = require('../chariotModel').hashString;


class RuleWriter {
  constructor(rule) {
    this.rule = rule;
  }

  post(api, callback) {
    let building = this.rule.building.name;

    let giottoDevice = this._buildGiottoDevice(api);
    let id = hashString(this.rule.name() + Math.round(Math.random() * 10000));

    giottoDevice.post(id, id, building, (err, uuid) => {
      if (err) { callback(err); return; }

      this.rule.id = uuid;
      callback();
    });
  }

  update(api, callback) {
    let giottoDevice = this._buildGiottoDevice(api);
    giottoDevice.postTags(this.rule.id, callback);
  }

  _buildGiottoDevice(api) {
    let giottoDevice = new GIoTTOSensor(api);

    giottoDevice.addTag('Type', 'Rule');
    giottoDevice.addTag('Conditions', JSON.stringify(this.rule.data.conditions));
    giottoDevice.addTag('Actions', JSON.stringify(this.rule.data.actions));
    return giottoDevice;
  }
}

module.exports = RuleWriter;
