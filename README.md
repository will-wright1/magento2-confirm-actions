# Magento 2 mass-delete confirmation

This module adds a confirmation dialog to Magento Admin UI mass-delete actions
that do not already have one. It applies to standard and tree-style mass-action
menus across the Admin, including the product grid.

Existing confirmations are left unchanged, so the module does not create a
second dialog for actions already protected by Magento or another extension.

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
