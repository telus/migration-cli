'use strict';

function makeCreateOrUpdateRequestsBuilder (requests) {
  return function (chunk) {
    const payload = chunk.payload;
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

module.exports = function requestsBuilder (chunks) {
  const requests = [];
  const makeCreateOrUpdateRequests = makeCreateOrUpdateRequestsBuilder(requests);
  const makeDeleteRequests = makeDeleteRequestsBuilder(requests);

  for (const chunk of chunks) {
    if (chunk.payload.isDelete) {
      makeDeleteRequests(chunk.payload);
    } else {
      makeCreateOrUpdateRequests(chunk.payload);
    }
  }

  return requests;
};
