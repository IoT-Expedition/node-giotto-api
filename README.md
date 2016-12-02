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

Examples of using the MachineLearning layer:

```
var virtualSensor = new api.VirtualSensor();
virtualSensor.userId = ...;
virtualSensor.inputs = ...;
virtualSensor.labels = ...;
virtualSensor.name = ...;

api.createVirtualSensor(virtualSensor, function (err, createdSensor) {});
api.deleteVirtualSensor(virtualSensor, function (err) {});
api.addVirtualSensorSample(virtualSensor,
      startTime, endTime, label,
      function (err, sampleId) {});
api.trainVirtualSensorClassifier(virtualSensor,
    function (err, message) {});
```

Creating, publishing and listening on custom message queues:

```
api.publishToQueue(queueName, '{}', function (err) {});
api.subscribeToQueue(this.queueName, function (err, msg) {});
```
