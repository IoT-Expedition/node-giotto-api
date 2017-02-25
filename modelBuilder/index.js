const BuildingModelBuilder = require('./BuildingModelBuilder');

module.exports = (api) => {
  return {
    getBuildingModel: (name, callback) => {
      let builder = new BuildingModelBuilder(name, api);
      builder.build(callback);
    }
  };
};
