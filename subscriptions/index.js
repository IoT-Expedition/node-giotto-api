const BDSubscription = require('./BDSubscription'),
      RedisSubscription = require('./RedisSubscription');

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
