const RandomForestClassifier = require('random-forest-classifier').RandomForestClassifier,
      async = require('async'),
      extractFeatures = require('./extractFeatures');

class VirtualSensor {
  constructor(api) {
    this.samples = [];
    this.api = api;
  }

  addSample(uuids, start, end, label) {
    this.samples.push({
      sensorUuids: uuids,
      start: start,
      end: end,
      label: label
    });
  }

  train(callback) {
    async.map(this.samples,
        (sample, done) => {
          this._toFeatures(sample.sensorUuids,
              sample.start,
              sample.end,
              sample.label,
              done);
        }, (err, data) => {
          if (err) {
            callback(err); return;
          }

          var rf = new RandomForestClassifier({
            n_estimators: 10
          });

          rf.fit(data, null, 'label', (err, trees) => {
            this.trees = trees;
            callback(err);
          });
        });
  }

  predict(uuids, start, end, callback) {
    if (!this.trees) {
      callback('Not trained yet'); return;
    }

    this._toFeatures(uuids, start, end, null, (err, features) => {
      if (err) {
        callback(err); return;
      }

      var rf = new RandomForestClassifier({
        n_estimators: 10
      });

      var predicted = rf.predict([ features ], this.trees);
      callback(null, predicted[0]);
    });
  }

  _toFeatures(sensorsUuids, start, end, label, callback) {
    this._mapTimeseries(sensorsUuids, start, end, (err, timeseriesGroups) => {
      if (err) {
        callback(err); return;
      }

      var features = {};
      timeseriesGroups.forEach((item) => {
        var timeseries = item.value;
        var i = item.index;

        features = Object.assign(extractFeatures(timeseries, i), features);
      });

      if (label) {
        features.label = label;
      }

      callback(null, features);
    });
  }

  _mapTimeseries(uuidGroups, start, end, callback) {
    var wrapped = uuidGroups.map(function (value, index) {
      return { index: index, value: value };
    });

    async.map(wrapped, (item, done) => {
      var uuids = item.value;
      var i = item.index;

      this.api.readTimeseriesOfSensors(uuids, start, end, (err, timeseries) => {
        if (err) { done(err); return; }
        done(null, { index: i, value: timeseries });
      });
    }, callback);
  }
}

module.exports = VirtualSensor;
