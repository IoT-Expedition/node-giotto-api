# GIoTTO api for NodeJS

NodeJS wrapper for the GIoTTO and BuildingDepot APIs.

## Installation

1. clone this repo,
2. run `npm install`

## Usage

```
var GIoTTOApi = require('./path/to/the/repo/folder');

var api = new GIoTTOApi({
  clientId: 'wHaTeVeR', # required
  clientSecret: 'wHaTeVeR', # required
  email: 'matus@cs.au.dk', # required, email for the user
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
```
