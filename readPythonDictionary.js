function readPythonDictionary(str) {
  return JSON.parse(str.replace(/ u'/g, ' \'').replace(/{u'/g, '{\'').replace(/'/g, '"'));
}

module.exports = readPythonDictionary;
