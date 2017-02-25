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

module.exports = RedisSubscription;
