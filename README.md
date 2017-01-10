# node-giotto-api

NodeJS wrapper for the GIoTTO and BuildingDepot APIs.

## Installation

1. clone this repo,
2. run `npm install`

## Usage

This is how you initialize it:

```
var GIoTTOApi = require('./path/to/the/repo/folder');

var api = new GIoTTOApi({
  clientId: 'wHaTeVeR', # required
  clientSecret: 'wHaTeVeR', # required
  email: 'wHa@TeV.eR', # required, email for the user
  mqUsername: 'wHaTeVeR', # required, username for the RabbitMQ
  mqPassword: 'wHaTeVeR', # required, password for the RabbitMQ

  protocol: 'https', # defaults to https
  hostname: 'bd-exp.andrew.cmu.edu', # defaults to bd-exp.andrew.cmu.edu
  csPort: 81, # defaults to 81, port for the CentralService
  dsPort: 82, # defaults to 82, port for the DataService

  mlProtocol: 'http', # defaults to http, protocol for the MachineLearningLayer
  mlHostname: 'bd-exp.andrew.cmu.edu', # defaults to bd-exp.andrew.cmu.edu
  mlPort: 5000 # defaults to 5000, port for MachineLearningLayer
});

api.authenticate(function (err) {
  // start using the api here
});
```

Sending sensor data:

```
api.createSensor(name, building, identifier, function (err, response, body) {});
api.addSensorMetadata(uuid, {});
api.postTimeseriesValue(sensorUuid, time, value);
```

Searching for sensors:

```
api.searchSensorsInBuilding(building, function (err, response, body) {});
```

Subscribing to sensor data over RabbitMQ:

```
api.startListeningForSensorData(function (err, sensor, value) {});
api.subscribeToSensor(sensor, function (err) {});
api.unsubscribeFromSensor(sensor);
```

Reading timeseries of one sensor:

```
api.readTimeseries(uuid, startTime, endTime, (err, data) => {
  // [ { time: 1484062558.954, value: 12.5 }, ... ]
});
```

Reading timeseries of multiple sensors:

```
api.readTimeseries([ uuid1, uuid2 ], startTime, endTime, (err, data) => {
  // [ { time: 1484062558.954, value: 12.5 }, ... ]
});
```

Using virtual sensors to classify data:

```
var sensor = api.virtualSensor();
var uuids = [ '6931acba-cea0-...', '288473c1-e809-...' ];
sensor.addSample(uuids, 1484067040.554, 1484067050.121, 'light');
sensor.addSample(uuids, 1484067094.361, 1484067105.505, 'dark');
sensor.addSample(uuids, 1484067169.671, 1484067179.671, 'light');
sensor.addSample(uuids, 1484067130.728, 1484067140.500, 'dark');

sensor.train((err) => {
  if (err) { console.log(err); return;  }

  sensor.predict(uuids, 1484067263.748, 1484067273.748, (err, label) => {
    if (err) { console.log(err); return;  }

    console.log(label);
  });
});
```

Creating, publishing and listening on custom message queues:

```
api.publishToQueue(queueName, '{}', function (err) {});
api.subscribeToQueue(this.queueName, function (err, msg) {});
```
