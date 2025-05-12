# Unfurly Link Shortener

A WordPress plugin to automatically shorten links in posts using unfur.ly service with custom domain support and UTM parameter management.

## Overview

- **Contributors:** unfurly
- **Tags:** link shortener, utm parameters, analytics, url management
- **Requires WordPress:** 5.0+
- **Tested up to:** 6.8
- **Requires PHP:** 7.2
- **Stable tag:** 1.0.0
- **License:** [GPLv2](https://www.gnu.org/licenses/gpl-2.0.html) or later

## Description

Unfurly Link Shortener automatically shortens links in your WordPress posts using the unfur.ly service. The plugin provides a seamless integration with WordPress and comes packed with powerful features for link management and analytics.

### Key Features

- Automatic link shortening in posts
- Custom domain support
- UTM parameter management
- Analytics tracking
- Original URL preservation
- Gutenberg editor integration

## Installation

1. Create the plugin files from this repo by running:
   ```bash
   rm unfurly-link-shortener.zip && zip -r unfurly-link-shortener.zip unfurly-link-shortener -x "*.DS_Store" -x "__MACOSX" -x "*.git*"
   ```

2. Upload the plugin files to `/wp-content/plugins/unfurly-link-shortener`
3. Activate the plugin through the 'Plugins' screen in WordPress
4. Configure the plugin settings at Settings->Unfurly Shortener

## Frequently Asked Questions

### Do I need an API key?
No, but using one enables advanced features like analytics and custom domains.

### Can I use my own domain?
Yes, with an API key you can configure a custom domain.

## Screenshots

1. Settings page
2. UTM parameter management
3. Analytics view

## Changelog

### 1.0.0
- Initial release

## Upgrade Notice

### 1.0.0
Initial release of Unfurly Link Shortener. Install to start automatically shortening your WordPress post links. 
