/**
 * Copyright (c) Confirm Actions contributors.
 *
 * SPDX-License-Identifier: MIT
 */

define([
    'mage/translate'
], function ($t) {
    'use strict';

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
            }
        });
    };
});
