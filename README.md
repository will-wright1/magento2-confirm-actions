# Magento 2 / Adobe Commerce mass-delete confirmation

[![Latest Stable Version](https://poser.pugx.org/confirm-actions/magento2-confirm-actions/v/stable)](https://packagist.org/packages/confirm-actions/magento2-confirm-actions)
[![Total Downloads](https://poser.pugx.org/confirm-actions/magento2-confirm-actions/downloads)](https://packagist.org/packages/confirm-actions/magento2-confirm-actions)
[![License](https://poser.pugx.org/confirm-actions/magento2-confirm-actions/license)](LICENSE)

Prevent accidental deletion of products and other records in Magento Admin.
This lightweight Magento 2 and Adobe Commerce module adds a second confirmation
to mass-delete actions and requires typed confirmation for large deletions.

Magento's normal confirmation dialog remains the first step. After the
administrator clicks **OK**, this module displays a separate final warning
before Magento can send the delete request. It protects standard and tree-style
mass-action menus across the Admin, including the product grid.

## What it protects against

- Accidentally confirming Magento's ordinary mass-delete dialog
- Deleting a large explicit selection without verifying the record count
- Using **Select All** and unintentionally deleting every matching record
- Custom destructive actions that opt in to the same protection

## Confirmation behaviour

| Selection | First step | Additional module step |
| --- | --- | --- |
| 1–20 explicitly selected records | Magento's normal confirmation | Final irreversible-deletion warning |
| More than 20 explicitly selected records | Magento's normal confirmation | Type the exact phrase, such as `DELETE 25` |
| **Select All** | Magento's normal confirmation | Type `DELETE <count>` for all matching records |

The **Delete permanently** button remains disabled until the typed phrase
matches exactly. The default threshold is 20 records and can be configured per
action.

## Requirements

- Magento Open Source or Adobe Commerce 2.4
- PHP 7.4 or PHP 8.1–8.4, subject to the Magento version's PHP support

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

## Updating

```bash
composer update confirm-actions/magento2-confirm-actions
bin/magento setup:upgrade
bin/magento cache:flush
```

Redeploy Admin static content after updating a production-mode installation.

## What administrators will see

The first dialog still looks like Magento's normal **Delete items** dialog.
That is intentional: the module preserves confirmations supplied by Magento or
another extension. Click **OK** on that first dialog to reach the additional
module confirmation.

For a small deletion, the second dialog is titled **Final deletion
confirmation**. For a large or **Select All** deletion, it is titled **Type to
confirm deletion** and requires a phrase such as `DELETE 25`.

## Troubleshooting

If the additional confirmation does not appear after accepting Magento's first
dialog:

1. Confirm the module is enabled:

   ```bash
   bin/magento module:status ConfirmActions_MassDelete
   ```

2. Clear Magento caches and redeploy static content:

   ```bash
   bin/magento cache:flush
   bin/magento setup:static-content:deploy -f
   ```

3. Refresh the Admin page without using the browser cache.

4. Check that the action is recognized as a delete action. Custom destructive
   actions with another name can opt in using `confirmDelete` as shown below.

## Custom mass actions

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

## Scope and limitations

- The module protects Admin UI mass actions; it does not intercept deletes made
  through REST, GraphQL, imports, the command line, or direct database access.
- It recognizes `delete` as a word in the action's type, label, or URL, including
  camel-case identifiers such as `massDelete`.
- It does not replace Magento authorization, form-key validation, backups, or
  appropriate Admin permissions.

## Support

Report bugs or request enhancements through
[GitHub Issues](https://github.com/will-wright1/magento2-confirm-actions/issues).
When reporting an Admin UI issue, include the Magento version, browser, action
being protected, and whether production mode is enabled.

## Development

Run the dependency-free JavaScript tests with Node.js 18 or later:

```bash
npm test
```

## License

Released under the [MIT License](LICENSE).
