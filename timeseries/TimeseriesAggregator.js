function postTimeseries(api, data) {
  console.log('Posting data from', data.length, 'sensors');
  api.postRequest(api.ds, 'api/sensor/timeseries', data,
      function logError(err, response, body) {
        if (err) {
          console.error(err);
        }
        else if (response.statusCode != 200) {
          console.error(body);
        }
      });
}

function loop(aggregator) {
  setInterval(function () {
    var backlog = aggregator.backlog;
    aggregator.backlog = [];

    if (backlog.length == 0) return;

    var backlogBySensors = {};
    backlog.forEach(function (item) {
      if (backlogBySensors[item.sensorUuid]) {
        backlogBySensors[item.sensorUuid].push(item);
      } else {
        backlogBySensors[item.sensorUuid] = [item];
      }
    });

    var data = [];
    for (var sensorUuid in backlogBySensors) {
      var items = backlogBySensors[sensorUuid];
      var samples = items.map(function (item) {
        return {
          time: item.time,
          value: parseFloat(item.value) + 0.000001
        };
      });

      data.push({
        sensor_id: sensorUuid,
        samples: samples
      });
    }

    postTimeseries(aggregator.api, data);
  }, 1000);
}

class TimeseriesAggregator {
  constructor(api) {
    this.api = api;
    this.backlog = [];
  }

  start() {
    loop(this);
  }

  postTimeseriesValue(sensorUuid, time, value) {
    this.backlog.push({
      sensorUuid: sensorUuid,
      time: time,
      value: value
    });
  }
}

module.exports = TimeseriesAggregator;
