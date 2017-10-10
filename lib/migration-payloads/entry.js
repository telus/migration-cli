/* eslint max-nested-callbacks: "off" */

const _ = require('lodash');

module.exports = function payloadBuilder (chunk, entries = {}) {
  //     TODO  Remember to do the following:
  //
  //     - keep track of the each change to the entries so we can update
  //      their version numbers (required when sendin the data to the API)
  //     - clone each entry (so each entry has its own version number)
  //

  chunk.payload = [];
  chunk.steps.forEach((step) => {
    const { contentTypeId, transformation: { from, to, transform } } = step.payload;
    const entriesForCT = entries[contentTypeId];

    const transformedEntries = entriesForCT.map((entry) => {
      const newEntry = _.cloneDeep(_.omit(entry, 'sys'));
      const values = from.map((fromKey) => newEntry.fields[fromKey]['en-US']);
      const newValues = transform(values);
      newValues.forEach((newValue, index) => {
        const key = to[index];

        if (newEntry.fields[key]) {
          newEntry.fields[key]['en-US'] = newValue;
        } else {
          newEntry.fields[key] = { 'en-US': newValue };
        }
      });

      const meta = {
        parentVersion: entry.sys.version,
        entryId: entry.sys.id
      };

      return { payload: newEntry, meta };
    });

    chunk.payload = chunk.payload.concat(transformedEntries);
  });

  return chunk;
};
