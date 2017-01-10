const _ = require('underscore');

function standardDeviation(values) {
  var avg = average(values);

  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data) {
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function peakCounts(data) {
  var count = 0,
      std = standardDeviation(data);

  for (var i = 0; i < data.length - 2; i++) {
    if (data[i + 1] > std * 2 &&
        (data[i + 1] - data[i]) * (data[i + 2] - data[i + 1]) < 0) {
      count++;
    }
  }

  return count;
}

function median(values) {
  values.sort(function (a, b) { return a - b; } );

  var half = Math.floor(values.length / 2);

  if (values.length % 2) {
    return values[half];
  } else {
    return (values[half-1] + values[half]) / 2.0;
  }
}

function zeroCrossings(values) {
  var count = 0;
  values.forEach((value) => {
    if (value < 0) count++;
  });

  return count;
}

module.exports = (timeseries) => {
  var values = timeseries.map((item) => { return item.value; });

  var max = _.max(values);
  var min = _.min(values);

  return {
    avg: average(values),
    std: standardDeviation(values),
    peaks: peakCounts(values),
    median: median(values),
    min: min,
    max: max,
    zeroCrossings: zeroCrossings(values),
    range: max - min
  };
};
