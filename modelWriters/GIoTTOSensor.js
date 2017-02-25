class TagBuilder {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  get data() {
    return {
      name: this.name,
      value: this.value
    };
  }
}

class GIoTTOSensor {
  constructor(api) {
    this.api = api;
    this.tags = [];
  }

  addTag(name, value) {
    this.tags.push(new TagBuilder(name, value));
  }

  post(id, name, building, callback) {
    this.api.createSensor(name, building, id, (err, response, body) => {
      if (err) { callback(err); return; }

      if (body.uuid) {
        let uuid = body.uuid;

        this.postTags(uuid, callback);
      } else {
        console.log(body);
        callback(body);
      }
    });
  }

  postTags(uuid, callback) {
    let tags = this.tags.map((tag) => { return tag.data; });
    if (tags.length) {
      this.api.addSensorTags(uuid, tags, (err) => {
        if (err) { callback(err); return; }
        callback(null, uuid);
      });
    } else {
      callback(null, uuid);
    }
  }
}

module.exports = GIoTTOSensor;
