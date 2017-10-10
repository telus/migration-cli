'use strict';

function makeCreateOrUpdateRequestsBuilder (requests) {
  return function (payload) {
    let parentVersion = payload.meta.parentVersion;

    requests.push({
      method: 'PUT',
      url: `/content_types/${payload.meta.contentTypeId}`,
      headers: {
        'X-Contentful-Version': parentVersion
      },
      data: payload.payload
    });

    parentVersion += 1;

    requests.push({
      method: 'PUT',
      url: `/content_types/${payload.meta.contentTypeId}/published`,
      headers: {
        'X-Contentful-Version': parentVersion
      }
    });
  };
}

function makeDeleteRequestsBuilder (requests) {
  return function (payload) {
    let parentVersion = payload.meta.parentVersion;

    requests.push({
      method: 'DELETE',
      url: `/content_types/${payload.meta.contentTypeId}/published`,
      headers: {
        'X-Contentful-Version': parentVersion
      }
    });

    parentVersion += 1;

    requests.push({
      method: 'DELETE',
      url: `/content_types/${payload.meta.contentTypeId}`,
      headers: {
        'X-Contentful-Version': parentVersion
      }
    });
  };
}

function makeEntriesRequestBuild (requests) {
  return function (payload) {
    payload.forEach((entryPayload) => {
      const parentVersion = entryPayload.meta.parentVersion;

      requests.push({
        method: 'PUT',
        url: `/entries/${entryPayload.meta.entryId}`,
        headers: {
          'X-Contentful-Version': parentVersion
        },
        data: entryPayload.payload
      });
    });
  };
}

module.exports = function requestsBuilder (chunks) {
  const requests = [];
  const makeCreateOrUpdateRequests = makeCreateOrUpdateRequestsBuilder(requests);
  const makeDeleteRequests = makeDeleteRequestsBuilder(requests);
  const makeEntriesRequests = makeEntriesRequestBuild(requests);

  for (const chunk of chunks) {
    if (chunk.type === 'CONTENT_TRANSFORM') {
      makeEntriesRequests(chunk.payload);
    } else if (chunk.payload.isDelete) {
      makeDeleteRequests(chunk.payload);
    } else {
      makeCreateOrUpdateRequests(chunk.payload);
    }
  }

  return requests;
};
