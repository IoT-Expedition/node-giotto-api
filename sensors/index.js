function sensors(api) {
  return {
    createSensor: function (name, building, identifier, callback) {
      console.log(name, building, identifier);
      api.postRequest(api.cs, 'api/sensor', {
        'data': {
          'name': name,
          'building': building,
          'identifier': identifier
        }
      }, callback);
    },

    addSensorMetadata: function (sensorUuid, metadataHash, callback) {
      var metadataList = [];
      for (var key in metadataHash) {
        metadataList.push({
          'name': key,
          'value': metadataHash[key]
        });
      }

      api.postRequest(api.cs, 'api/sensor/' + sensorUuid + '/metadata', {
        'data': metadataList
      }, callback);
    },

    // tagList: [ { name: 'name', value: 'value' }, ... ]
    addSensorTags: function (sensorUuid, tagList, callback) {
      console.log(tagList);
      api.postRequest(api.cs, 'api/sensor/' + sensorUuid + '/tags', {
        'data': tagList
      }, callback);
    },

    searchSensorsInBuilding: function (building, callback) {
      api.postRequest(api.cs, 'api/search', {
        'data': {
          'Building': [ building ]
        }
      }, callback);
    },

    searchSensorsWithMetadata: function (metadata, callback) {
      var metadataList = [];
      for (var key in metadata) {
        var value = metadata[key];
        metadataList.push(key + ':' + value);
      }

      api.postRequest(api.cs, 'api/search', {
        'data': {
          'MetaData': metadataList
        }
      }, callback);
    },

    searchSensorsWithTags: function (tags, callback) {
      var tagList = [];
      tags.forEach((tag) => {
        tagList.push(tag.name + ':' + tag.value);
      });

      api.postRequest(api.cs, 'api/search', {
        'data': {
          'Tags': tagList
        }
      }, callback);
    }

  };
}

module.exports = sensors;
