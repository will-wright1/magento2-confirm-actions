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

function loadMixin(confirmation = () => {}) {
    let moduleFactory;
    const source = fs.readFileSync(mixinPath, 'utf8');
    const sandbox = {
        define(dependencies, factory) {
            assert.deepEqual(Array.from(dependencies), [
                'Magento_Ui/js/modal/confirm',
                'mage/translate'
            ]);
            moduleFactory = factory;
        }
    };

    vm.runInNewContext(source, sandbox, {filename: mixinPath});

    return moduleFactory(confirmation, (message) => message);
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

test('shows a final confirmation after Magento confirmation', () => {
    const action = {
        type: 'delete',
        confirm: {
            title: 'Delete items',
            message: 'Delete selected items?'
        }
    };
    const confirmationCalls = [];
    const mixin = loadMixin((options) => confirmationCalls.push(options));
    const extension = mixin({
        extend(component) {
            return component;
        }
    });
    let firstConfirmationCallback;
    let deleteCalls = 0;
    const subject = {
        getSelections() {
            return {total: 3, excludeMode: false};
        },
        _super(receivedAction, callback) {
            assert.equal(receivedAction, action);
            firstConfirmationCallback = callback;

            return this;
        }
    };

    subject._confirm = extension._confirm;
    assert.equal(subject._confirm(action, () => deleteCalls++), subject);
    assert.equal(confirmationCalls.length, 0);
    assert.equal(deleteCalls, 0);

    firstConfirmationCallback();
    assert.equal(confirmationCalls.length, 1);
    assert.equal(confirmationCalls[0].title, 'Final deletion confirmation');
    assert.match(confirmationCalls[0].content, /cannot be undone/);
    assert.equal(deleteCalls, 0);

    confirmationCalls[0].actions.confirm();
    assert.equal(deleteCalls, 1);
});

test('does not add a second confirmation to non-delete actions', () => {
    const action = {type: 'enable', confirm: {message: 'Continue?'}};
    const confirmationCalls = [];
    const mixin = loadMixin((options) => confirmationCalls.push(options));
    const extension = mixin({
        extend(component) {
            return component;
        }
    });
    const callback = () => {};
    const subject = {
        _super(receivedAction, receivedCallback) {
            assert.equal(receivedAction, action);
            assert.equal(receivedCallback, callback);

            return this;
        }
    };

    subject._confirm = extension._confirm;
    assert.equal(subject._confirm(action, callback), subject);
    assert.equal(confirmationCalls.length, 0);
});

test('requires the exact typed phrase above the deletion threshold', () => {
    const action = {
        type: 'delete',
        confirm: {message: 'Delete selected items?'}
    };
    const confirmationCalls = [];
    let inputHandler;
    let inputValue = '';
    const buttonState = {};
    const input = {
        val() {
            return inputValue;
        },
        on(eventName, handler) {
            assert.equal(eventName, 'input');
            inputHandler = handler;

            return this;
        }
    };
    const acceptButton = {
        prop(name, value) {
            buttonState[name] = value;

            return this;
        },
        attr(name, value) {
            buttonState[name] = value;

            return this;
        }
    };
    const modal = {
        find(selector) {
            assert.match(selector, /^#confirm-actions-delete-/);

            return input;
        },
        closest(selector) {
            assert.equal(selector, '[data-role="modal"]');

            return {
                find(buttonSelector) {
                    assert.equal(buttonSelector, '.action-accept');

                    return acceptButton;
                }
            };
        }
    };
    const mixin = loadMixin((options) => {
        confirmationCalls.push(options);

        return modal;
    });
    const extension = mixin({
        extend(component) {
            return component;
        }
    });
    let firstConfirmationCallback;
    let deleteCalls = 0;
    const subject = {
        getSelections() {
            return {total: 25, excludeMode: false};
        },
        _super(receivedAction, callback) {
            assert.equal(receivedAction, action);
            firstConfirmationCallback = callback;

            return this;
        }
    };

    subject._confirm = extension._confirm;
    subject._confirm(action, () => deleteCalls++);
    firstConfirmationCallback();

    assert.equal(confirmationCalls.length, 1);
    assert.equal(confirmationCalls[0].title, 'Type to confirm deletion');
    assert.match(confirmationCalls[0].content, /DELETE 25/);
    assert.equal(confirmationCalls[0].buttons[1].attr.disabled, 'disabled');

    const widget = {
        closeModal(event, confirmed) {
            if (confirmed) {
                confirmationCalls[0].actions.confirm();
            }
        }
    };

    confirmationCalls[0].buttons[1].click.call(widget, {});
    assert.equal(deleteCalls, 0);

    inputValue = 'DELETE 25';
    inputHandler();
    assert.equal(buttonState.disabled, false);
    assert.equal(buttonState['aria-disabled'], 'false');

    confirmationCalls[0].buttons[1].click.call(widget, {});
    assert.equal(deleteCalls, 1);
});

test('Select All requires typed confirmation below the threshold', () => {
    const action = {type: 'delete', confirm: {message: 'Delete all?'}};
    const calls = [];
    const input = {
        val() {
            return '';
        },
        on() {
            return this;
        }
    };
    const modal = {
        find() {
            return input;
        },
        closest() {
            return {
                find() {
                    return {
                        prop() {
                            return this;
                        },
                        attr() {
                            return this;
                        }
                    };
                }
            };
        }
    };
    const mixin = loadMixin((options) => {
        calls.push(options);

        return modal;
    });
    const extension = mixin({
        extend(component) {
            return component;
        }
    });
    let firstConfirmationCallback;
    const subject = {
        getSelections() {
            return {total: 3, excludeMode: true};
        },
        _super(receivedAction, callback) {
            firstConfirmationCallback = callback;

            return this;
        }
    };

    subject._confirm = extension._confirm;
    subject._confirm(action, () => {});
    firstConfirmationCallback();

    assert.equal(calls[0].title, 'Type to confirm deletion');
    assert.match(calls[0].content, /DELETE 3/);
});
