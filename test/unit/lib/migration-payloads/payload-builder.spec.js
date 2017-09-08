'use strict';

const { expect } = require('chai');
const _ = require('lodash');
const Bluebird = require('bluebird');

const migrationPlan = require('../../../../lib/migration-plan');
const migrationChunks = require('../../../../lib/migration-chunks');
const migrationSteps = require('../../../../lib/migration-steps');
const builder = require('../../../../lib/migration-payloads/index');

describe('Payload builder', function () {
  describe('Without a Content Type payload', function () {
    it('returns the expected payload', Bluebird.coroutine(function * () {
      const steps = yield migrationSteps(function up (migration) {
        const person = migration.createContentType('person', {
          name: 'bar',
          description: 'A content type for a person'
        });

        person.createField('age', {
          name: 'Age',
          type: 'Number',
          required: true
        });

        person.createField('fullName', {
          name: 'Full Name',
          type: 'Symbol',
          required: true,
          localized: true
        });
      });

      const chunks = migrationChunks(steps);
      const plan = migrationPlan(chunks);
      const payload = builder(plan);

      expect(payload).to.eql([{
        meta: {
          contentTypeId: 'person',
          version: 1,
          parentVersion: 0
        },
        payload: {
          name: 'bar',
          description: 'A content type for a person',
          fields: [
            {
              id: 'age',
              name: 'Age',
              type: 'Number',
              required: true
            },
            {
              id: 'fullName',
              name: 'Full Name',
              type: 'Symbol',
              required: true,
              localized: true
            }
          ]
        }
      }]);
    }));
  });

  describe('when deleting a field', function () {
    it('returns the expected payload', Bluebird.coroutine(function * () {
      const contentType = {
        name: 'Very dangerous dog',
        description: 'Woof woof',
        fields: [
          {
            id: 'kills',
            type: 'Number',
            name: 'kills',
            required: true
          },
          {
            id: 'favoriteFood',
            type: 'Symbol',
            name: 'food',
            required: true
          }
        ],
        sys: {
          version: 2,
          id: 'dog'
        }
      };

      const steps = yield migrationSteps(function up (migration) {
        const dog = migration.editContentType('dog');
        dog.deleteField('favoriteFood');

        dog.createField('foo').name('A foo').type('Symbol');
      });

      const chunks = migrationChunks(steps);
      const plan = migrationPlan(chunks);
      const payloads = builder(plan, [contentType]);

      const basePayload = {
        meta: {
          contentTypeId: 'dog',
          version: 2,
          parentVersion: 1
        },
        payload: _.omit(contentType, ['sys'])
      };

      const firstPayload = {
        meta: {
          contentTypeId: 'dog',
          version: 3,
          parentVersion: 2,
          parent: basePayload
        },
        payload: {
          name: 'Very dangerous dog',
          description: 'Woof woof',
          fields: [
            {
              id: 'kills',
              type: 'Number',
              name: 'kills',
              required: true
            }, {
              id: 'favoriteFood',
              type: 'Symbol',
              name: 'food',
              required: true,
              omitted: true
            }
          ]
        }
      };

      const secondPayload = {
        meta: {
          contentTypeId: 'dog',
          version: 5,
          parentVersion: 4,
          parent: firstPayload
        },
        payload: {
          name: 'Very dangerous dog',
          description: 'Woof woof',
          fields: [
            {
              id: 'kills',
              type: 'Number',
              name: 'kills',
              required: true
            }, {
              id: 'favoriteFood',
              type: 'Symbol',
              name: 'food',
              required: true,
              omitted: true,
              deleted: true
            }
          ]
        }
      };

      const thirdPayload = {
        meta: {
          contentTypeId: 'dog',
          version: 7,
          parentVersion: 6,
          parent: secondPayload
        },
        payload: {
          name: 'Very dangerous dog',
          description: 'Woof woof',
          fields: [
            {
              id: 'kills',
              type: 'Number',
              name: 'kills',
              required: true
            }, {
              id: 'favoriteFood',
              type: 'Symbol',
              name: 'food',
              required: true,
              omitted: true,
              deleted: true
            }, {
              id: 'foo',
              type: 'Symbol',
              name: 'A foo'
            }
          ]
        }
      };

      expect(payloads).to.eql([firstPayload, secondPayload, thirdPayload]);
    }));
  });
});