'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const mixinPath = path.resolve(
    __dirname,
    '../../../view/adminhtml/web/js/grid/massactions-mixin.js'
);

function loadMixin() {
    let moduleFactory;
    const source = fs.readFileSync(mixinPath, 'utf8');
    const sandbox = {
        define(dependencies, factory) {
            assert.deepEqual(Array.from(dependencies), ['mage/translate']);
            moduleFactory = factory;
        }
    };

    vm.runInNewContext(source, sandbox, {filename: mixinPath});

    return moduleFactory((message) => message);
}

function createSubject(action) {
    const mixin = loadMixin();
    const extension = mixin({
        extend(component) {
            return component;
        }
    });
    const calls = [];
    const subject = {
        getAction() {
            return action;
        },
        _super(actionIndex) {
            calls.push(actionIndex);
            return this;
        }
    };

    subject.applyAction = extension.applyAction;

    return {calls, subject};
}

test('adds a confirmation to a delete action', () => {
    const action = {type: 'delete', label: 'Delete'};
    const {calls, subject} = createSubject(action);

    assert.equal(subject.applyAction('delete'), subject);
    assert.deepEqual(calls, ['delete']);
    assert.equal(action.confirm.title, 'Confirm mass delete');
    assert.match(action.confirm.message, /cannot be undone/);
});

test('recognises a camelCase massDelete URL', () => {
    const action = {
        type: 'archive_records',
        label: 'Archive records',
        url: '/backend/catalog/product/massDelete/key/example'
    };
    const {subject} = createSubject(action);

    subject.applyAction('archive_records');

    assert.ok(action.confirm);
});

test('supports an explicit opt-in for custom destructive actions', () => {
    const action = {type: 'purge', label: 'Purge', confirmDelete: true};
    const {subject} = createSubject(action);

    subject.applyAction('purge');

    assert.ok(action.confirm);
});

test('preserves an existing confirmation', () => {
    const existingConfirmation = {
        title: 'Delete products',
        message: 'Use the custom warning.'
    };
    const action = {type: 'delete', confirm: existingConfirmation};
    const {subject} = createSubject(action);

    subject.applyAction('delete');

    assert.equal(action.confirm, existingConfirmation);
});

test('does not add a confirmation to a non-delete action', () => {
    const action = {type: 'enable', label: 'Enable'};
    const {calls, subject} = createSubject(action);

    subject.applyAction('enable');

    assert.equal(action.confirm, undefined);
    assert.deepEqual(calls, ['enable']);
});

test('allows the base component to handle an unknown action', () => {
    const {calls, subject} = createSubject(undefined);

    assert.doesNotThrow(() => subject.applyAction('missing'));
    assert.deepEqual(calls, ['missing']);
});
