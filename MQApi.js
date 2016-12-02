var amqpApi = require('amqplib/callback_api');

function MQApi(opts) {
  this.hostname = opts.hostname;
  this.username = opts.username;
  this.password = opts.password;
}

MQApi.prototype = (function () {
  return {
    authenticate: function (callback) {
      var that = this;
      var opts = {
        credentials: amqpApi.credentials.plain(this.username, this.password)
      };

      amqpApi.connect('amqp://' + this.hostname, opts, function (err, conn) {
        that.conn = conn;
        callback(err);
      });
    },

    prepareQueueChannel: function (queue, callback) {
      this.conn.createChannel(function (err, ch) {
        if (err) {
          console.error(err);
          callback(err);
        }

        callback(null, ch);
      });
    },

    publishToQueue: function (queue, msg, callback) {
      this.prepareQueueChannel(queue, function (err, ch) {
        if (err) {
          console.error(err);
          callback(err);
        }

        ch.sendToQueue(queue, new Buffer(msg));
        callback(null);
      });
    },

    listenOnQueue: function (queue, callback) {
      this.prepareQueueChannel(queue, function (err, ch) {
        if (err) {
          console.error(err);
          callback(err);
        }

        if (!queue.startsWith('amq'))
          ch.assertQueue(queue);
        ch.consume(queue, function (msg) {
          callback(null, msg);
        }, {
          noAck: true
        });
      });
    }
  };
})();

module.exports = MQApi;
