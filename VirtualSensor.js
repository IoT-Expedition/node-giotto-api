const RandomForestClassifier = require('random-forest-classifier').RandomForestClassifier,
      async = require('async'),
      extractFeatures = require('./extractFeatures');

class VirtualSensor {
  constructor(api) {
    this.samples = [];
    this.api = api;
  }

  addSample(uuids, start, end, label, features) {
    this.samples.push({
      sensorUuids: uuids,
      start: start,
      end: end,
      label: label,
      features: features
    });
  }

  train(callback) {
    async.map(this.samples,
        (sample, done) => {
          if (sample.features) {
            done(null, sample.features);
          } else {
            this.toFeatures(sample.sensorUuids,
                sample.start,
                sample.end,
                sample.label,
                done);
          }
        }, (err, data) => {
          if (err) {
            callback(err); return;
          }

          this.trainWithFeatures(data, callback);
        });
  }

  trainWithFeatures(features, callback) {
    var rf = new RandomForestClassifier({
      n_estimators: 10
    });

    rf.fit(features, null, 'label', (err, trees) => {
      this.trees = trees;
      callback(err);
    });
  }

  predict(uuids, start, end, callback) {
    if (!this.trees) {
      callback('Not trained yet'); return;
    }

    this.toFeatures(uuids, start, end, null, (err, features) => {
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

  toFeatures(sensorsUuids, start, end, label, callback) {
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

        if (timeseries.length == 0) {
          done('Training failed - no data for the given sample.');
          return;
        }

        done(null, { index: i, value: timeseries });
      });
    }, callback);
  }
}

module.exports = VirtualSensor;
