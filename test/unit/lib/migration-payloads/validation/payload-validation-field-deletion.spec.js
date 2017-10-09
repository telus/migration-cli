'use strict';

const { expect } = require('chai');
const Bluebird = require('bluebird');

const validatePayloads = require('./validate-payloads');

describe('payload validation (deletion)', function () {
  describe('when setting a field to deleted that is not omitted', function () {
    it('returns an error', Bluebird.coroutine(function * () {
      const existingCts = [{
        sys: { id: 'lunch' },
        name: 'Lunch',
        fields: [
          { id: 'mainCourse', name: 'Main Course', type: 'Symbol' }
        ]
      }];

      const errors = yield validatePayloads(function (migration) {
        const lunch = migration.editContentType('lunch');

        lunch.editField('mainCourse').deleted(true);
      }, existingCts);
      expect(errors).to.eql([
        [
          {
            type: 'InvalidAction',
            message: 'Cannot set "deleted" to "true" on field "mainCourse" on content type "lunch". It needs to be omitted first. Consider using "deleteField".'
          }
        ]
      ]);
    }));
  });

  describe('when setting a field to deleted and omitted in one step', function () {
    it('returns an error', Bluebird.coroutine(function * () {
      const existingCts = [{
        sys: { id: 'lunch' },
        name: 'Lunch',
        fields: [
          { id: 'mainCourse', name: 'Main Course', type: 'Symbol' }
        ]
      }];

      const errors = yield validatePayloads(function (migration) {
        const lunch = migration.editContentType('lunch');

        lunch.editField('mainCourse').deleted(true).omitted(true);
      }, existingCts);
      expect(errors).to.eql([
        [
          {
            type: 'InvalidAction',
            message: 'Cannot set "deleted" to "true" on field "mainCourse" on content type "lunch". It needs to be omitted first. Consider using "deleteField".'
          }
        ]
      ]);
    }));
  });

  describe('when setting a field to omitted and then deleted', function () {
    it('returns an error', Bluebird.coroutine(function * () {
      const existingCts = [{
        sys: { id: 'lunch' },
        name: 'Lunch',
        fields: [
          { id: 'mainCourse', name: 'Main Course', type: 'Symbol', omitted: true }
        ]
      }];

      const errors = yield validatePayloads(function (migration) {
        const lunch = migration.editContentType('lunch');

        lunch.editField('mainCourse').deleted(true);
      }, existingCts);
      expect(errors).to.eql([
        []
      ]);
    }));
  });
});
