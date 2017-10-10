'use strict';

const _ = require('lodash');

// Takes
// - a Content Type payload (if exists)
// - an execution Plan
//
// Returns:
// - The payload to be sent to the API

function buildFields (result, actions) {
  result.payload.fields = result.payload.fields || [];
  actions.forEach((action) => {
    const id = action.payload.fieldId;
    const props = action.payload.props;

    if (action.type === 'field/create') {
      result.payload.fields.push(Object.assign(
        {}, { id }, props
      ));
    }

    if (action.type === 'field/update' || action.type === 'field/rename') {
      const source = _.find(result.payload.fields, { id });

      Object.assign(source, props);
    }

    if (action.type === 'field/move') {
      const field = _.find(result.payload.fields, { id });
      _.pull(result.payload.fields, field);

      if (action.payload.movement.direction === 'toTheTop') {
        result.payload.fields.unshift(field);
      }

      if (action.payload.movement.direction === 'toTheBottom') {
        result.payload.fields.push(field);
      }

      const pivot = action.payload.movement.pivot;
      const pivotIndex = _.findIndex(result.payload.fields, { id: pivot });

      if (action.payload.movement.direction === 'afterField') {
        result.payload.fields.splice(pivotIndex + 1, 0, field);
      }

      if (action.payload.movement.direction === 'beforeField') {
        result.payload.fields.splice(pivotIndex, 0, field);
      }
    }
  });
}

function isDeleteChunk (steps) {
  return steps.length === 1 && steps[0].type === 'contentType/delete';
}

function makeDeletePayload (steps, contentType) {
  const result = {
    meta: {},
    isDelete: true
  };

  if (contentType) {
    result.meta = contentType.meta;
  } else {
    result.meta.contentTypeId = steps[0].payload.contentTypeId;
  }
  return result;
}

function builder (steps, contentType) {
  if (isDeleteChunk(steps)) {
    return makeDeletePayload(steps, contentType);
  }

  let result = {
    meta: {},
    payload: {}
  };

  if (contentType) {
    result = _.cloneDeep(contentType);
  } else {
    result.meta.contentTypeId = steps[0].payload.contentTypeId;
  }

  const contentTypeUpdateActions = steps.filter((step) => step.type.startsWith('contentType'));
  contentTypeUpdateActions.forEach((step) => {
    Object.assign(result.payload, step.payload.props);
  });

  const fieldActions = steps.filter((step) => step.type.startsWith('field'));
  buildFields(result, fieldActions);

  return result;
};

function updateFieldIdsForChanges (payload, fieldIdChanges) {
  const fields = payload.payload.fields;
  if (fields.some((field) => field.newId)) {
    fieldIdChanges[payload.meta.contentTypeId] = _.cloneDeep(payload);
  }
  for (const field of fields) {
    if (field.newId) {
      field.id = field.newId;
      delete field.newId;
    }
  }
}

function hasFields (payload) {
  return payload.payload && payload.payload.fields;
}

module.exports = function payloadBuilder (chunk, state) {
  const fieldIdChanges = {};

  const { steps } = chunk;
  const id = steps[0].payload.contentTypeId;

  let payloadVersion;
  let payloadParentVersion;
  let contentType;

  if (!state.contentTypes[id]) {
    if (state.initialContentTypeMap[id]) {
      const initialCt = state.initialContentTypeMap[id];

      payloadVersion = initialCt.meta.version + 1;
      payloadParentVersion = initialCt.meta.version;
      contentType = initialCt;
    } else {
      payloadVersion = 1;
      payloadParentVersion = 0;
    }
  } else {
    contentType = state.contentTypes[id];
    // reflect implicit publish which bumps the version by 1
    payloadVersion = contentType.meta.version + 2;
    payloadParentVersion = contentType.meta.version + 1;
  }

  const updatedCt = builder(steps, _.cloneDeep(contentType));
  // Link the previous payload for validation purposes
  // We need to check if there has been a fieldId change, so that
  // the previous field id is reflected correctly in the parent.
  // Afterwards, we can forget about the id change.
  if (fieldIdChanges[id]) {
    updatedCt.meta.parent = fieldIdChanges[id];
    delete fieldIdChanges[id];
  } else if (contentType) {
    updatedCt.meta.parent = contentType;
  }

  updatedCt.meta.version = payloadVersion;
  updatedCt.meta.parentVersion = payloadParentVersion;

  // Mutate `chunk` to add the payload we created here so we retain the chunk history
  chunk.payload = updatedCt;

  const basisForNextPayload = _.cloneDeep(updatedCt);
  if (hasFields(basisForNextPayload)) {
    updateFieldIdsForChanges(basisForNextPayload, fieldIdChanges);
  }
  state.contentTypes[id] = basisForNextPayload;

  return chunk;
};
