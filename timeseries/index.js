var TimeseriesAggregator = require('./TimeseriesAggregator'),
    async = require('async'),
    _ = require('underscore');

function readTimeseries(api, sensorUuid, startTime, endTime, callback) {
  api.getRequest(api.ds, 'api/sensor/' + sensorUuid +
      '/timeseries?start_time=' + parseFloat(startTime) +
      '&end_time=' + parseFloat(endTime), (err, response, body) => {
        if (err) {
          callback(err); return;
        }

        try {
          body = JSON.parse(body);
        } catch(e) {
          callback(body); return;
        }

        if (body.success != 'True') {
          callback('Failed to get the data'); return;
        }

        var series = body.data.series || [];
        var data = [];
        series.forEach((series) => {
          data = data.concat(series.values);
        });

        callback(null, data.map((item) => {
          return {
            time: Date.parse(item[0]) / 1000,
            value: Math.round(item[2] * 1000) / 1000,
            uuid: sensorUuid
          };
        }));
      });
}

function timeseries(api) {
  var aggregator = new TimeseriesAggregator(api);
  aggregator.start();

  return {

    readTimeseries: function (sensorUuid, startTime, endTime, callback) {
      readTimeseries(api, sensorUuid, startTime, endTime, callback);
    },

    readTimeseriesOfSensors: (sensorUuids, startTime, endTime, callback) => {
      async.map(sensorUuids, (uuid, done) => {
        readTimeseries(api, uuid, startTime, endTime, done);
      }, (err, results) => {
        if (err) { callback(err); return; }

        callback(null, _.sortBy(_.flatten(results), (item) => {
          return item.time;
        }));
      });
    },

    postTimeseriesValue: function (sensorUuid, time, value) {
      if (api.redisPubSub) {
        api.redisPubSub.emit(sensorUuid, {
          uuid: sensorUuid, time: time, value: value
        });
      }
      aggregator.postTimeseriesValue(sensorUuid, time, value);
    }

  };
}

module.exports = timeseries;
