<?php
/**
 * Seosights_Admin — admin UI controller.
 *
 * Adds the "seosights" submenu under Tools, registers settings
 * via the WordPress Settings API, renders the settings page, and
 * exposes an AJAX endpoint for the Test Connection button.
 *
 * @package seosights
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Seosights_Admin {

	/**
	 * Singleton instance.
	 *
	 * @var Seosights_Admin|null
	 */
	private static $instance = null;

	/**
	 * Core controller reference.
	 *
	 * @var Seosights_Core
	 */
	private $core = null;

	/**
	 * Bot whitelist (label => user-agent).
	 *
	 * @var array
	 */
	private $bots = array(
		'GPTBot'          => 'OpenAI / ChatGPT',
		'ClaudeBot'       => 'Anthropic / Claude',
		'PerplexityBot'   => 'Perplexity',
		'Google-Extended' => 'Google Gemini',
		'CCBot'           => 'Common Crawl',
	);

	/**
	 * Get the singleton instance and wire up admin hooks.
	 *
	 * @return Seosights_Admin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->init();
		}
		return self::$instance;
	}

	/**
	 * Private constructor — singleton.
	 */
	private function __construct() {
		$this->core = Seosights_Core::instance();
	}

	/**
	 * Register admin hooks.
	 */
	private function init() {
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_ajax_seosights_test_connection', array( $this, 'ajax_test_connection' ) );

		// Surface a "Settings" link on the plugins.php row.
		add_filter( 'plugin_action_links_' . SEOSIGHTS_PLUGIN_BASENAME, array( $this, 'add_action_links' ) );
	}

	/**
	 * Add the "seosights" submenu page under Tools.
	 */
	public function add_admin_menu() {
		add_management_page(
			__( 'seosights', 'seosights' ),
			__( 'seosights', 'seosights' ),
			'manage_options',
			'seosights',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Register the settings group + sanitization callback.
	 */
	public function register_settings() {
		register_setting(
			'seosights_settings_group',
			SEOSIGHTS_OPTION_KEY,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
				'default'           => Seosights_Core::default_settings(),
			)
		);
	}

	/**
	 * Sanitize and validate the submitted settings.
	 *
	 * @param array $input Raw $_POST input (already slashed by WP).
	 * @return array Sanitized settings.
	 */
	public function sanitize_settings( $input ) {
		$defaults     = Seosights_Core::default_settings();
		$output       = $defaults;
		$input        = is_array( $input ) ? $input : array();

		// API key — alphanumeric + dashes/underscores only.
		if ( isset( $input['api_key'] ) ) {
			$output['api_key'] = preg_replace( '/[^a-zA-Z0-9_\-]/', '', (string) $input['api_key'] );
		}

		// Feature checkboxes.
		$output['enable_llms']   = ! empty( $input['enable_llms'] ) ? 1 : 0;
		$output['enable_schema'] = ! empty( $input['enable_schema'] ) ? 1 : 0;
		$output['enable_stats']  = ! empty( $input['enable_stats'] ) ? 1 : 0;

		// Site summary — one-line plain text.
		if ( isset( $input['site_summary'] ) ) {
			$output['site_summary'] = sanitize_text_field( (string) $input['site_summary'] );
		}

		// Bot rules — only allow the whitelisted bots + allow/disallow values.
		$bot_rules = array();
		foreach ( array_keys( $this->bots ) as $bot ) {
			$val = isset( $input['bot_rules'][ $bot ] ) ? $input['bot_rules'][ $bot ] : 'allow';
			$bot_rules[ $bot ] = ( 'disallow' === $val ) ? 'disallow' : 'allow';
		}
		$output['bot_rules'] = $bot_rules;

		return $output;
	}

	/**
	 * Render the settings page (delegates to templates/settings-page.php).
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'seosights' ) );
		}

		$settings   = wp_parse_args( get_option( SEOSIGHTS_OPTION_KEY, array() ), Seosights_Core::default_settings() );
		$bots       = $this->bots;
		$llms_url   = home_url( '/llms.txt' );
		$robots_url = home_url( '/robots.txt' );
		$has_physical_robots = file_exists( ABSPATH . 'robots.txt' );

		include SEOSIGHTS_PLUGIN_DIR . 'templates/settings-page.php';
	}

	/**
	 * Enqueue admin assets (delegated to the core controller).
	 *
	 * @param string $hook Current admin page hook suffix.
	 */
	public function enqueue_assets( $hook ) {
		$this->core->enqueue_admin_assets( $hook );
	}

	/**
	 * Add a "Settings" link to the plugin row on plugins.php.
	 *
	 * @param array $links Existing action links.
	 * @return array
	 */
	public function add_action_links( $links ) {
		$url = admin_url( 'tools.php?page=seosights' );
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $url ),
			esc_html__( 'Settings', 'seosights' )
		);
		array_unshift( $links, $settings_link );
		return $links;
	}

	/**
	 * AJAX handler for the "Test Connection" button.
	 *
	 * Verifies nonce + capability, reads the API key from $_POST
	 * (so it works even before the form is saved), and attempts to
	 * fetch an analysis from the seosights API.
	 */
	public function ajax_test_connection() {
		check_ajax_referer( 'seosights_admin', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error(
				array( 'message' => __( 'Permission denied.', 'seosights' ) ),
				403
			);
		}

		$raw_api_key = isset( $_POST['api_key'] ) ? wp_unslash( $_POST['api_key'] ) : '';
		$api_key     = preg_replace( '/[^a-zA-Z0-9_\-]/', '', (string) $raw_api_key );

		if ( '' === $api_key ) {
			wp_send_json_error(
				array( 'message' => __( 'API key is required.', 'seosights' ) )
			);
		}

		$api     = Seosights_API::instance();
		$result  = $api->get_analysis( home_url( '/' ), $api_key );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error(
				array( 'message' => $result->get_error_message() )
			);
		}

		$code = (int) wp_remote_retrieve_response_code( $result );
		$body = wp_remote_retrieve_body( $result );
		$decoded = json_decode( $body, true );

		if ( 200 !== $code ) {
			wp_send_json_error(
				array(
					'message' => sprintf(
						/* translators: %s: HTTP status code */
						__( 'API responded with HTTP %s.', 'seosights' ),
						$code
					),
					'body'    => $body,
				)
			);
		}

		wp_send_json_success(
			array(
				'message' => __( 'Connection successful!', 'seosights' ),
				'data'    => is_array( $decoded ) ? $decoded : array( 'raw' => $body ),
			)
		);
	}
}
