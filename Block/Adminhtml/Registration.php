<?php
/**
 * Copyright (c) Confirm Actions contributors.
 *
 * SPDX-License-Identifier: MIT
 */

namespace ConfirmActions\MassDelete\Block\Adminhtml;

use Composer\InstalledVersions;
use Magento\Framework\View\Element\AbstractBlock;

class Registration extends AbstractBlock
{
    private const PACKAGE = 'confirm-actions/magento2-confirm-actions';
    private const MODULE_PAGE = 'https://www.williamjameswright.co.uk/magento-modules/confirm-delete-actions';

    protected function _toHtml(): string
    {
        // A template outside the Magento root is rejected for symlinked Composer checkouts.
        return sprintf(
            '<p class="note"><a href="%s" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">'
            . '%s</a> %s</p>',
            $this->escapeUrl($this->getRegistrationUrl()),
            $this->escapeHtml(__('Register this module')),
            $this->escapeHtml(__('(optional, opens in a new tab)'))
        );
    }

    public function getRegistrationUrl(): string
    {
        $version = class_exists(InstalledVersions::class) && InstalledVersions::isInstalled(self::PACKAGE)
            ? InstalledVersions::getPrettyVersion(self::PACKAGE)
            : null;
        $query = $version ? '?version=' . rawurlencode($version) : '';

        return self::MODULE_PAGE . $query . '#register-module';
    }
}
