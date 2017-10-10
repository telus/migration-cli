const _ = require('lodash');
const contentTypePayloadBuild = require('./content-type');
const entryPayloadBuilder = require('./entry');

function stripContentTypes (contentTypes) {
  return contentTypes.map((ct) => {
    return {
      payload: _.cloneDeep(_.omit(ct, 'sys')),
      meta: { version: ct.sys.version, parentVersion: ct.sys.version - 1, contentTypeId: ct.sys.id }
    };
  });
}

function contentTypesArrayToMap (contentTypes) {
  return _.keyBy(contentTypes, (ct) => ct.meta.contentTypeId);
}

module.exports = function payloadBuilder (plan, contentTypes = [], entries = []) {
  const state = {
    initialContentTypeMap: contentTypesArrayToMap(stripContentTypes(contentTypes)),
    contentTypes: [],
    fieldIdChanges: {},
    entries
  };

  plan.forEach((chunk) => {
    if (chunk.type === 'CONTENT_MODEL_CHANGE') {
      return contentTypePayloadBuild(chunk, state);
    }

    if (chunk.type === 'CONTENT_TRANSFORM') {
      return entryPayloadBuilder(chunk, state);
    }
  });

  return plan;
};
