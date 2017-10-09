'use strict';

const { expect } = require('chai');
const Bluebird = require('bluebird');

const validatePayloads = require('./validate-payloads');

describe('payload validation', function () {
  describe('fieldValidations', function () {
    it('errors on duplicate validation', Bluebird.coroutine(function * () {
      const errors = yield validatePayloads(function up (migration) {
        const person = migration.createContentType('person')
          .name('Person')
          .description('A Person');

        person.createField('fullName')
          .name('Full Name')
          .type('Symbol')
          .validations([{ unique: true }, { unique: true }]);
      }, []);

      expect(errors).to.eql([
        [
          {
            type: 'InvalidPayload',
            message: `A field can't have duplicates in the validations array. Duplicate: "{"unique":true}"`
          }
        ]
      ]);
    }));

    it('errors on unknown validations key', Bluebird.coroutine(function * () {
      const errors = yield validatePayloads(function up (migration) {
        const person = migration.createContentType('person')
          .name('Person')
          .description('A Person');

        person.createField('fullName')
          .name('Full Name')
          .type('Symbol')
          .validations([{ unique: true }, { size: { min: 5, max: 10 } }, { foo: true }]);
      }, []);

      expect(errors).to.eql([
        [
          {
            type: 'InvalidPayload',
            message: `A field can't have "foo" as a validation.`
          }
        ]
      ]);
    }));

    it('errors on wrong validation parameter (object)', Bluebird.coroutine(function * () {
      const errors = yield validatePayloads(function up (migration) {
        const person = migration.createContentType('person')
          .name('Person')
          .description('A Person');

        person.createField('fullName')
          .name('Full Name')
          .type('Symbol')
          .validations([{ size: 2 }]);
      }, []);

      expect(errors).to.eql([
        [
          {
            type: 'InvalidPayload',
            message: `"size" validation expected to be "object", but got "number"`
          }
        ]
      ]);
    }));

    it('errors on wrong validation parameter (primitive)', Bluebird.coroutine(function * () {
      const errors = yield validatePayloads(function up (migration) {
        const person = migration.createContentType('person')
          .name('Person')
          .description('A Person');

        person.createField('fullName')
          .name('Full Name')
          .type('Symbol')
          .validations([{ unique: 'nope' }]);
      }, []);

      expect(errors).to.eql([
        [
          {
            type: 'InvalidPayload',
            message: `"unique" validation expected to be "boolean", but got "string"`
          }
        ]
      ]);
    }));
  });
});
