<?php
/**
 * Plugin Name:       seosights for WordPress
 * Plugin URI:        https://seosights.com/wordpress
 * Description:       The Operating System for AI Search — auto-generate /llms.txt for AI crawlers, inject JSON-LD schema (Organization, WebSite, Article), configure robots.txt rules for GPTBot / ClaudeBot / PerplexityBot / Google-Extended / CCBot, and sync site stats to your seosights dashboard.
 * Version:           1.0.0
 * Author:            seosights
 * Author URI:        https://seosights.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       seosights
 * Requires at least: 5.8
 * Requires PHP:      7.4
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plugin constants.
 */
define( 'SEOSIGHTS_VERSION', '1.0.0' );
define( 'SEOSIGHTS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SEOSIGHTS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'SEOSIGHTS_PLUGIN_FILE', __FILE__ );
define( 'SEOSIGHTS_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
define( 'SEOSIGHTS_API_BASE', 'https://seosights.com/api' );
define( 'SEOSIGHTS_OPTION_KEY', 'seosights_settings' );
define( 'SEOSIGHTS_CRON_HOOK', 'seosights_daily_stats_sync' );

/**
 * Load plugin class files.
 *
 * Order matters: API has no dependencies, Core depends on API,
 * Admin depends on Core.
 */
require_once SEOSIGHTS_PLUGIN_DIR . 'includes/class-seosights-api.php';
require_once SEOSIGHTS_PLUGIN_DIR . 'includes/class-seosights-core.php';
require_once SEOSIGHTS_PLUGIN_DIR . 'includes/class-seosights-admin.php';

/**
 * Register activation / deactivation hooks.
 *
 * These must be registered at file load (before `plugins_loaded`)
 * so the classes are available when WP fires them.
 */
register_activation_hook( __FILE__, array( 'Seosights_Core', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Seosights_Core', 'deactivate' ) );

/**
 * Bootstrap the plugin on `plugins_loaded`.
 *
 * @return Seosights_Core
 */
function seosights() {
	return Seosights_Core::instance();
}
add_action( 'plugins_loaded', 'seosights' );
