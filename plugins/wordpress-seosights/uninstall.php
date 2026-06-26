<?php
/**
 * Uninstall handler for the seosights WordPress plugin.
 *
 * Fired by WordPress when the user clicks "Delete" on the plugins
 * screen. Removes all plugin data from the database.
 *
 * @package seosights
 */

// Abort if not called by WordPress during uninstall.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete the settings option.
delete_option( 'seosights_settings' );

// Clear any scheduled cron events for the daily stats sync.
wp_clear_scheduled_hook( 'seosights_daily_stats_sync' );

// Note: rewrite rules are regenerated on the next request automatically —
// the /llms.txt rewrite registered by the plugin will simply 404 once the
// plugin is gone, which is the desired behaviour.
