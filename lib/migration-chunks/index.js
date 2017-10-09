'use strict';

const _ = require('lodash');
const sliceByContentTypeId = require('./slicers/content-type-id');
const sliceByFieldDelete = require('./slicers/field-delete');
const slicedByContentTransform = require('./slicers/content-transform');
const sliceByFieldIdChange = require('./slicers/field-id-change');
const deleteMapper = require('./mappers/delete');

const TRANSFORM_ACTION = 'contentType/transformContent';

module.exports = function migrationPlan (migrationSteps) {
  const uninterruptedSteps = sliceByContentTypeId(migrationSteps);
  const slicedByDeleteSteps = _.flatten(uninterruptedSteps.map((chunk) => sliceByFieldDelete(chunk)));
  const slicedByContentTransformSteps = _.flatten(slicedByDeleteSteps.map((chunk) => slicedByContentTransform(chunk)));
  const slicedByFieldIdChangeSteps = slicedByContentTransformSteps.map((chunk) => sliceByFieldIdChange(chunk));
  const result = _.flatten(slicedByFieldIdChangeSteps);

  const withDeletes = deleteMapper(result);

  const withChunkInfo = withDeletes.map((chunk) => {
    return {
      type: chunk[0].type === TRANSFORM_ACTION ? 'CONTENT_TRANSFORM' : 'CONTENT_MODEL_CHANGE',
      steps: chunk
    };
  });

  return withChunkInfo;
};
