<?php
/**
 * Seosights_API — minimal HTTP client for the seosights dashboard API.
 *
 * @package seosights
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Seosights_API {

	/**
	 * Singleton instance.
	 *
	 * @var Seosights_API|null
	 */
	private static $instance = null;

	/**
	 * Cached settings array (loaded lazily).
	 *
	 * @var array|null
	 */
	private $settings = null;

	/**
	 * Get the singleton instance.
	 *
	 * @return Seosights_API
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Private constructor — singleton.
	 */
	private function __construct() {}

	/**
	 * Load (and cache) the plugin settings from wp_options.
	 *
	 * @return array
	 */
	private function get_settings() {
		if ( null === $this->settings ) {
			$defaults = Seosights_Core::default_settings();
			$saved    = get_option( SEOSIGHTS_OPTION_KEY, array() );
			if ( ! is_array( $saved ) ) {
				$saved = array();
			}
			$this->settings = wp_parse_args( $saved, $defaults );
		}
		return $this->settings;
	}

	/**
	 * Get the configured API key (from saved settings).
	 *
	 * @return string
	 */
	private function get_api_key() {
		$settings = $this->get_settings();
		return isset( $settings['api_key'] ) ? (string) $settings['api_key'] : '';
	}

	/**
	 * Build the standard HTTP headers for API requests.
	 *
	 * @param string $api_key Optional override (used by the test-connection flow
	 *                        before the key is saved).
	 * @return array
	 */
	private function build_headers( $api_key = '' ) {
		$key = ( '' !== $api_key ) ? $api_key : $this->get_api_key();
		return array(
			'Authorization' => 'Bearer ' . $key,
			'Content-Type'  => 'application/json',
			'Accept'        => 'application/json',
			'User-Agent'    => 'seosights-wp/' . SEOSIGHTS_VERSION . '; ' . home_url( '/' ),
		);
	}

	/**
	 * POST site stats to the seosights dashboard API.
	 *
	 * @param array $data Payload to send.
	 * @return array|WP_Error WP HTTP response or WP_Error on failure.
	 */
	public function send_stats( $data ) {
		$api_key = $this->get_api_key();
		if ( '' === $api_key ) {
			return new WP_Error(
				'seosights_no_api_key',
				__( 'API key not configured. Add it in Tools → seosights.', 'seosights' )
			);
		}

		$endpoint = SEOSIGHTS_API_BASE . '/v1/site-stats';
		$payload  = is_array( $data ) ? $data : array( 'data' => $data );

		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => 20,
				'headers' => $this->build_headers( $api_key ),
				'body'    => wp_json_encode( $payload ),
			)
		);

		return $response;
	}

	/**
	 * GET an analysis for a URL from the seosights API.
	 *
	 * @param string $url     URL to fetch analysis for.
	 * @param string $api_key Optional override for the saved API key.
	 * @return array|WP_Error WP HTTP response or WP_Error on failure.
	 */
	public function get_analysis( $url, $api_key = '' ) {
		$url      = esc_url_raw( (string) $url );
		$endpoint = add_query_arg(
			array( 'url' => $url ),
			SEOSIGHTS_API_BASE . '/v1/analysis'
		);

		$response = wp_remote_get(
			$endpoint,
			array(
				'timeout' => 30,
				'headers' => $this->build_headers( $api_key ),
			)
		);

		return $response;
	}
}
