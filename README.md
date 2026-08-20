# Magento 2 mass-delete confirmation

This module adds a second confirmation step to Magento Admin UI mass-delete
actions. It applies to standard and tree-style mass-action menus across the
Admin, including the product grid.

Magento's existing confirmation remains the first step. After the administrator
accepts it, the module displays a distinct final warning before the delete
request can run. If an action does not already have a confirmation, the module
supplies a default first step so that it still receives two confirmations.

For explicit selections of more than 20 records, the final step requires the
administrator to type the exact record count, for example `DELETE 25`. Using
Magento's **Select All** mode always requires the typed confirmation, regardless
of the number of matching records. The permanent-delete button remains disabled
until the phrase matches exactly.

## Requirements

- Magento Open Source or Adobe Commerce 2.4
- PHP 7.4 or PHP 8.1+

## Installation

Install the package through Composer, then enable it:

```bash
composer require confirm-actions/magento2-confirm-actions
bin/magento module:enable ConfirmActions_MassDelete
bin/magento setup:upgrade
bin/magento cache:flush
```

In production mode, redeploy Admin static content after installation:

```bash
bin/magento setup:static-content:deploy -f
```

For a local checkout that is not published to a Composer repository, configure
this directory as a Composer `path` repository or copy it to
`app/code/ConfirmActions/MassDelete`.

## How actions are recognised

The module protects actions where `delete` appears as a word in the action's
`type`, `label`, or `url`. Camel-case identifiers such as `massDelete` are
supported. The default Magento confirmation is used whenever one is already
present.

The typed-confirmation threshold defaults to 20 and can be overridden for a
custom action in its `data/config` argument:

```xml
<item name="typedConfirmationThreshold" xsi:type="number">50</item>
```

For a custom action whose configuration does not contain the word `delete`, add
an explicit flag to its mass-action configuration. Custom settings belong in
the action's `data/config` argument so Magento's UI component XML remains valid:

```xml
<action name="purge">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="confirmDelete" xsi:type="boolean">true</item>
        </item>
    </argument>
    <settings>
        <type>purge</type>
        <label translate="true">Purge</label>
        <url path="vendor_module/item/massPurge"/>
    </settings>
</action>
```

The confirmation is a browser-side safety guard. Magento's normal ACL and form
key protections remain responsible for authorising the delete request.

## Development

Run the dependency-free JavaScript tests with Node.js 18 or later:

```bash
npm test
```
