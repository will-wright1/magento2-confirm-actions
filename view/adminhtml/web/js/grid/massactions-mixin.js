/**
 * Copyright (c) Confirm Actions contributors.
 *
 * SPDX-License-Identifier: MIT
 */

define([
    'Magento_Ui/js/modal/confirm',
    'mage/translate'
], function (confirmation, $t) {
    'use strict';

    var defaultTypedConfirmationThreshold = 20,
        typedConfirmationId = 0;

    /**
     * Escape translated text before inserting it into modal HTML.
     *
     * @param {*} value
     * @returns {String}
     */
    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[character];
        });
    }

    /**
     * Convert camelCase identifiers such as "massDelete" into searchable words.
     *
     * @param {*} value
     * @returns {String}
     */
    function searchableValue(value) {
        return typeof value === 'string' ?
            value.replace(/([a-z0-9])([A-Z])/g, '$1 $2') :
            '';
    }

    /**
     * A custom action may explicitly opt in with `confirmDelete: true`. Standard
     * actions are recognised by the word "delete" in their type, label, or URL.
     *
     * @param {Object} action
     * @returns {Boolean}
     */
    function isDeleteAction(action) {
        var actionDescription;

        if (!action) {
            return false;
        }

        if (action.confirmDelete === true || action.confirmDelete === 'true') {
            return true;
        }

        actionDescription = [action.type, action.label, action.url]
            .map(searchableValue)
            .join(' ');

        return /(^|[^a-z])delet(e|es|ed|ing)?([^a-z]|$)/i.test(actionDescription);
    }

    /**
     * Get an action-specific threshold when one is configured.
     *
     * @param {Object} action
     * @returns {Number}
     */
    function getTypedConfirmationThreshold(action) {
        var threshold = Number(action.typedConfirmationThreshold);

        return isFinite(threshold) && threshold >= 0 ?
            threshold :
            defaultTypedConfirmationThreshold;
    }

    /**
     * Select All always requires typing, even when filters leave only a few
     * records. Explicit selections require typing above the action threshold.
     *
     * @param {Object} selections
     * @param {Object} action
     * @returns {Boolean}
     */
    function requiresTypedConfirmation(selections, action) {
        var total = selections ? Number(selections.total) : 0,
            selectAll = selections &&
                (selections.excludeMode === true || selections.excludeMode === 'true');

        return Boolean(selectAll || total > getTypedConfirmationThreshold(action));
    }

    /**
     * Require an exact phrase before enabling permanent deletion.
     *
     * @param {Object} selections
     * @param {Function} callback
     */
    function showTypedConfirmation(selections, callback) {
        var total = Number(selections.total),
            count = isFinite(total) && total > 0 ? total : 'ALL',
            phrase = 'DELETE ' + count,
            inputId = 'confirm-actions-delete-' + (++typedConfirmationId),
            prompt = $t('Type %1 to confirm this permanent deletion.').replace('%1', phrase),
            input,
            acceptButton,
            modal;

        modal = confirmation({
            title: $t('Type to confirm deletion'),
            content: '<p>' + escapeHtml($t(
                'This large mass deletion cannot be undone.'
            )) + '</p>' +
                '<p><strong>' + escapeHtml(prompt) + '</strong></p>' +
                '<label for="' + inputId + '">' +
                escapeHtml($t('Confirmation phrase')) + '</label>' +
                '<input type="text" id="' + inputId + '" ' +
                'class="admin__control-text" autocomplete="off" spellcheck="false">',
            focus: '#' + inputId,
            clickableOverlay: false,
            actions: {
                confirm: callback
            },
            buttons: [{
                text: $t('Cancel'),
                class: 'action-secondary action-dismiss',
                click: function (event) {
                    this.closeModal(event);
                }
            }, {
                text: $t('Delete permanently'),
                class: 'action-primary action-accept',
                attr: {
                    disabled: 'disabled',
                    'aria-disabled': 'true'
                },
                click: function (event) {
                    if (input.val() === phrase) {
                        this.closeModal(event, true);
                    }
                }
            }]
        });

        input = modal.find('#' + inputId);
        acceptButton = modal.closest('[data-role="modal"]').find('.action-accept');
        input.on('input', function () {
            var matches = input.val() === phrase;

            acceptButton
                .prop('disabled', !matches)
                .attr('aria-disabled', matches ? 'false' : 'true');
        });
    }

    /**
     * Show the ordinary second confirmation used for smaller deletions.
     *
     * @param {Function} callback
     */
    function showFinalConfirmation(callback) {
        confirmation({
            title: $t('Final deletion confirmation'),
            content: $t(
                'This is your final confirmation. The selected items will be ' +
                'permanently deleted and this action cannot be undone. Continue?'
            ),
            actions: {
                confirm: callback
            }
        });
    }

    return function (Massactions) {
        return Massactions.extend({
            /**
             * Supply a safe default without replacing a confirmation configured
             * by Magento or another module.
             *
             * @param {String} actionIndex
             * @returns {Object}
             */
            applyAction: function (actionIndex) {
                var action = this.getAction(actionIndex);

                if (isDeleteAction(action) && !action.confirm) {
                    action.confirm = {
                        title: $t('Confirm mass delete'),
                        message: $t(
                            'Are you sure you want to permanently delete the selected items? ' +
                            'This action cannot be undone.'
                        )
                    };
                }

                return this._super(actionIndex);
            },

            /**
             * Keep Magento's configured confirmation as the first step, then
             * require a separate final confirmation before executing a delete.
             *
             * @param {Object} action
             * @param {Function} callback
             * @returns {Object}
             */
            _confirm: function (action, callback) {
                var selections;

                if (!isDeleteAction(action)) {
                    return this._super(action, callback);
                }

                selections = this.getSelections() || {};

                return this._super(action, function () {
                    if (requiresTypedConfirmation(selections, action)) {
                        showTypedConfirmation(selections, callback);
                    } else {
                        showFinalConfirmation(callback);
                    }
                });
            }
        });
    };
});
