class BDSubscription {
  constructor(uuids, callback, api) {
    this.uuids = uuids;
    this.callback = callback;
    this.api = api;

    this.updatePeriod = 2000;
    this.running = false;
    this.averageValues = false;
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

      let values = data.map((i) => { return i.value; });
      if (values.length) {
        if (this.averageValues) {
          let avg = this._average(values);
          this.callback(avg);
        } else {
          values.forEach((i) => { this.callback(i); });
        }
      }
    });
  }

  _average(data) {
    var sum = data.reduce(function(sum, value){
      return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
  }
}


class RedisSubscription {
  constructor(uuids, callback, api) {
    this.uuids = uuids;
    this.callback = callback;
    this.api = api;
    this.nrp = this.api.redisPubSub;

    this.running = false;
    this.unsubscribes = [];
  }

  start() {
    this.uuids.forEach((uuid) => {
      console.log('Subscribing to', uuid);
      let unsubscribe = this.nrp.on(uuid, (data) => {
        console.log('Received value', uuid, data.value);
        this.callback(data.value, uuid);
      });
      this.unsubscribes.push(unsubscribe);
    });

    this.running = true;
  }

  stop() {
    this.running = false;
    this.unsubscribes.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribes = [];
  }
}


function subscriptions(api) {
  return {
    subscribeToSensor: function (uuid, callback) {
      let subscription;
      if (api.redisPubSub) {
        subscription = new RedisSubscription([ uuid ], callback, api);
      } else {
        subscription = new BDSubscription([ uuid ], callback, api);
      }
      subscription.start();
      return subscription;
    },

    subscribeToSensors: function (uuids, callback) {
      let subscription;
      if (api.redisPubSub) {
        subscription = new RedisSubscription(uuids, callback, api);
      } else {
        subscription = new BDSubscription(uuids, callback, api);
      }
      subscription.start();
      return subscription;
    }
  };
}

module.exports = subscriptions;
