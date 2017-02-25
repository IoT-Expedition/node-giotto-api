class BDSubscription {
  constructor(uuids, callback, api) {
    this.uuids = uuids;
    this.callback = callback;
    this.api = api;

    this.updatePeriod = 2000;
    this.running = false;
  }

  start() {
    this.running = true;
    this._planUpdate();
  }

  stop() {
    this.running = false;
  }

  _planUpdate() {
    setTimeout(() => { this._update(); }, this.updatePeriod);
  }

  _update() {
    if (!this.running) return;

    let time = new Date().getTime();
    let start = this.lastUpdatedUpTo ||
      (time - this.updatePeriod * 2) / 1000; // twice update period ago
    let end = (time / 1000) - 5; // 5 seconds ago

    this.lastUpdatedUpTo = end;

    this.api.readTimeseriesOfSensors(this.uuids, start, end, (err, data) => {
      if (!this.running) return;
      if (err) { console.error(err); return; }

      this._planUpdate();

      data.forEach((i) => { this.callback(i.value, i.uuid); });
    });
  }
}

module.exports = BDSubscription;
