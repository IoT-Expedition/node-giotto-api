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
          this.api.readTimeseriesOfSensors(sample.sensorUuids,
              sample.start, sample.end, (err, data) => {
                if (err) {
                  done(err); return;
                }

                var features = extractFeatures(data);
                features.label = sample.label;
                done(null, features);
              });
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

    this.api.readTimeseriesOfSensors(uuids,
        start, end, (err, data) => {
          if (err) {
            callback(err); return;
          }

          var features = extractFeatures(data);
          var rf = new RandomForestClassifier({
            n_estimators: 10
          });

          var predicted = rf.predict([ features ], this.trees);
          callback(null, predicted[0]);
        });
  }
}

module.exports = VirtualSensor;
