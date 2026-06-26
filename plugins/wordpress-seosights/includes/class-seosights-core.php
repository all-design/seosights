<?php
/**
 * Seosights_Core — core plugin controller.
 *
 * Hooks /llms.txt and /robots.txt into WordPress, injects JSON-LD
 * schema on the front-end, schedules daily stats sync, and bootstraps
 * the admin UI when in wp-admin.
 *
 * @package seosights
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Seosights_Core {

	/**
	 * Singleton instance.
	 *
	 * @var Seosights_Core|null
	 */
	private static $instance = null;

	/**
	 * Cached settings array.
	 *
	 * @var array|null
	 */
	private $settings = null;

	/**
	 * API client instance.
	 *
	 * @var Seosights_API|null
	 */
	private $api = null;

	/**
	 * Get the singleton instance and wire up hooks.
	 *
	 * @return Seosights_Core
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
		$this->settings = $this->load_settings();
	}

	/**
	 * Default plugin settings (used on activation + sanitization fallback).
	 *
	 * @return array
	 */
	public static function default_settings() {
		return array(
			'api_key'       => '',
			'enable_llms'   => 1,
			'enable_schema' => 1,
			'enable_stats'  => 1,
			'site_summary'  => '',
			'bot_rules'     => array(
				'GPTBot'          => 'allow',
				'ClaudeBot'       => 'allow',
				'PerplexityBot'   => 'allow',
				'Google-Extended' => 'allow',
				'CCBot'           => 'allow',
			),
		);
	}

	/**
	 * Activation callback: seed defaults, register rewrite rule,
	 * flush rewrite rules, and schedule the daily stats cron.
	 */
	public static function activate() {
		if ( false === get_option( SEOSIGHTS_OPTION_KEY ) ) {
			add_option( SEOSIGHTS_OPTION_KEY, self::default_settings() );
		}
		self::register_rewrite_rules();
		flush_rewrite_rules();

		if ( ! wp_next_scheduled( SEOSIGHTS_CRON_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', SEOSIGHTS_CRON_HOOK );
		}
	}

	/**
	 * Deactivation callback: flush rewrite rules and clear the cron.
	 */
	public static function deactivate() {
		flush_rewrite_rules();
		$ts = wp_next_scheduled( SEOSIGHTS_CRON_HOOK );
		if ( $ts ) {
			wp_unschedule_event( $ts, SEOSIGHTS_CRON_HOOK );
		}
		wp_clear_scheduled_hook( SEOSIGHTS_CRON_HOOK );
	}

	/**
	 * Wire all hooks into WordPress.
	 */
	private function init() {
		$this->api = Seosights_API::instance();

		// Rewrite rules + query vars for /llms.txt.
		add_action( 'init', array( __CLASS__, 'register_rewrite_rules' ) );
		add_filter( 'query_vars', array( $this, 'register_query_vars' ) );

		// Serve /llms.txt and override /robots.txt content.
		add_action( 'template_redirect', array( $this, 'handle_llms_txt' ) );
		add_filter( 'robots_txt', array( $this, 'handle_robots_txt' ), 10, 2 );

		// JSON-LD schema injection.
		add_action( 'wp_head', array( $this, 'inject_schema' ), 99 );

		// Daily stats sync.
		add_action( SEOSIGHTS_CRON_HOOK, array( $this, 'sync_stats' ) );

		// Bootstrap admin UI when in wp-admin.
		if ( is_admin() ) {
			Seosights_Admin::instance();
		}
	}

	/**
	 * Register the /llms.txt rewrite rule.
	 *
	 * Marked static so it can be safely called from `activate()`
	 * (before `plugins_loaded` has fired the singleton `init()`).
	 */
	public static function register_rewrite_rules() {
		add_rewrite_rule( '^llms\.txt/?$', 'index.php?seosights_llms=1', 'top' );
	}

	/**
	 * Register custom query vars.
	 *
	 * @param array $vars Existing query vars.
	 * @return array
	 */
	public function register_query_vars( $vars ) {
		$vars[] = 'seosights_llms';
		return $vars;
	}

	/**
	 * Load merged settings (saved + defaults).
	 *
	 * @return array
	 */
	private function load_settings() {
		$saved = get_option( SEOSIGHTS_OPTION_KEY, array() );
		if ( ! is_array( $saved ) ) {
			$saved = array();
		}
		return wp_parse_args( $saved, self::default_settings() );
	}

	/**
	 * Public accessor for the merged settings array.
	 *
	 * @return array
	 */
	public function get_settings() {
		if ( null === $this->settings ) {
			$this->settings = $this->load_settings();
		}
		return $this->settings;
	}

	/**
	 * Serve /llms.txt when the request matches our rewrite rule.
	 *
	 * Runs on `template_redirect`. Bails early on normal page loads.
	 */
	public function handle_llms_txt() {
		$val = get_query_var( 'seosights_llms' );
		if ( '' === $val || empty( $val ) ) {
			return;
		}

		$settings = $this->get_settings();
		if ( empty( $settings['enable_llms'] ) ) {
			return;
		}

		$content = $this->build_llms_txt();

		// Send headers + body and short-circuit the rest of WP.
		nocache_headers();
		header( 'Content-Type: text/plain; charset=utf-8' );
		header( 'X-Robots-Tag: noindex, nofollow' );
		header( 'Content-Length: ' . strlen( $content ) );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- plain text file.
		echo $content;
		exit;
	}

	/**
	 * Build the llms.txt body following the llmstxt.org convention.
	 *
	 * @return string
	 */
	public function build_llms_txt() {
		$settings = $this->get_settings();
		$name     = get_bloginfo( 'name' );
		$desc     = get_bloginfo( 'description' );
		$url      = home_url( '/' );
		$summary  = ! empty( $settings['site_summary'] ) ? $settings['site_summary'] : $desc;

		$lines = array();
		$lines[] = '# ' . $name;
		$lines[] = '';
		$lines[] = '> ' . $summary;
		$lines[] = '';
		$lines[] = '## About';
		$lines[] = $name . ' — ' . $desc . ' (' . $url . ')';
		$lines[] = '';
		$lines[] = '## Site Information';
		$lines[] = '- Site URL: ' . $url;
		$lines[] = '- Site Name: ' . $name;
		$lines[] = '- Tagline: ' . $desc;
		$lines[] = '';
		$lines[] = '## Important URLs';
		$lines[] = '- [Home](' . home_url( '/' ) . '): Main website';
		$lines[] = '- [About](' . home_url( '/about/' ) . '): About ' . $name;
		$lines[] = '- [Blog](' . home_url( '/blog/' ) . '): Latest articles';
		$lines[] = '- [Contact](' . home_url( '/contact/' ) . '): Contact information';
		$lines[] = '';
		$lines[] = '## Optional';
		$lines[] = '- This file was generated by the seosights WordPress plugin v' . SEOSIGHTS_VERSION;
		$lines[] = '- Learn more about llms.txt: https://llmstxt.org';
		$lines[] = '- Powered by seosights: https://seosights.com';
		$lines[] = '';

		return implode( "\n", $lines );
	}

	/**
	 * Filter the virtual robots.txt output to append per-bot AI rules.
	 *
	 * WordPress serves /robots.txt via `do_robots()`. This filter is
	 * applied inside `do_robots()` so our appended rules are part of
	 * the served body. Note: a physical robots.txt file in the site
	 * root will short-circuit this filter (we surface a warning in the
	 * admin UI for that case).
	 *
	 * @param string $output Existing robots.txt body.
	 * @param bool   $public Whether the site is public (blog_public option).
	 * @return string
	 */
	public function handle_robots_txt( $output, $public ) {
		// Respect the "discourage search engines" site setting.
		if ( empty( $public ) ) {
			return $output;
		}

		$settings = $this->get_settings();
		if ( empty( $settings['bot_rules'] ) || ! is_array( $settings['bot_rules'] ) ) {
			return $output;
		}

		$rules  = "\n# seosights — AI crawler rules\n";
		foreach ( $settings['bot_rules'] as $bot => $rule ) {
			$bot = sanitize_text_field( (string) $bot );
			if ( '' === $bot ) {
				continue;
			}
			if ( 'disallow' === $rule ) {
				$rules .= "User-agent: {$bot}\nDisallow: /\n";
			} else {
				$rules .= "User-agent: {$bot}\nAllow: /\n";
			}
		}

		return $output . $rules;
	}

	/**
	 * Inject JSON-LD schema (Organization, WebSite, Article) into wp_head.
	 */
	public function inject_schema() {
		$settings = $this->get_settings();
		if ( empty( $settings['enable_schema'] ) ) {
			return;
		}

		$schema = $this->build_schema();
		if ( empty( $schema ) ) {
			return;
		}

		$json = wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === $json ) {
			return;
		}

		echo '<script type="application/ld+json">' . "\n" . $json . "\n" . "</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Build the schema.org @graph array.
	 *
	 * @return array
	 */
	public function build_schema() {
		$name = get_bloginfo( 'name' );
		$url  = home_url( '/' );
		$desc = get_bloginfo( 'description' );

		// Logo — prefer the site custom logo; fall back to a placeholder.
		$logo = '';
		$logo_id = get_theme_mod( 'custom_logo' );
		if ( $logo_id ) {
			$logo_url = wp_get_attachment_image_url( $logo_id, 'full' );
			if ( $logo_url ) {
				$logo = $logo_url;
			}
		}

		$org = array(
			'@type'      => 'Organization',
			'@id'        => $url . '#organization',
			'name'       => $name,
			'url'        => $url,
			'description' => $desc,
		);
		if ( '' !== $logo ) {
			$org['logo'] = array(
				'@type' => 'ImageObject',
				'url'   => esc_url_raw( $logo ),
			);
		}

		$website = array(
			'@type'     => 'WebSite',
			'@id'       => $url . '#website',
			'url'       => $url,
			'name'      => $name,
			'publisher' => array( '@id' => $url . '#organization' ),
			'potentialAction' => array(
				'@type'       => 'SearchAction',
				'target'      => $url . '?s={search_term_string}',
				'query-input' => 'required name=search_term_string',
			),
		);

		$graph = array(
			'@context' => 'https://schema.org',
			'@graph'   => array( $org, $website ),
		);

		// Append Article schema on single blog posts.
		if ( is_singular( 'post' ) ) {
			$post_id = get_queried_object_id();
			$post    = $post_id ? get_post( $post_id ) : null;
			if ( $post instanceof WP_Post ) {
				$author_name = get_the_author_meta( 'display_name', (int) $post->post_author );
				$excerpt     = wp_strip_all_tags( get_the_excerpt( $post ) );
				$article     = array(
					'@type'            => 'Article',
					'@id'              => get_permalink( $post ) . '#article',
					'headline'         => get_the_title( $post ),
					'description'      => $excerpt,
					'datePublished'    => mysql2date( 'c', $post->post_date_gmt, false ),
					'dateModified'     => mysql2date( 'c', $post->post_modified_gmt, false ),
					'author'           => array(
						'@type' => 'Person',
						'name'  => $author_name,
					),
					'publisher'        => array( '@id' => $url . '#organization' ),
					'mainEntityOfPage' => array(
						'@type' => 'WebPage',
						'@id'   => get_permalink( $post ),
					),
				);
				$graph['@graph'][] = $article;
			}
		}

		return $graph;
	}

	/**
	 * Enqueue admin-only assets for the seosights settings page.
	 *
	 * Uses WordPress-bundled handles (wp-components, wp-util) so no
	 * external asset files are required. Localizes nonce + AJAX URL
	 * for the Test Connection button.
	 *
	 * @param string $hook The current admin page hook suffix.
	 */
	public function enqueue_admin_assets( $hook ) {
		// Only load on the seosights tools page (`tools_page_seosights`).
		if ( false === strpos( (string) $hook, 'seosights' ) ) {
			return;
		}

		wp_enqueue_style( 'wp-components' );
		wp_enqueue_script( 'wp-util' );

		wp_localize_script(
			'wp-util',
			'seosightsAdmin',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'seosights_admin' ),
				'llmsUrl' => home_url( '/llms.txt' ),
				'i18n'    => array(
					'testing' => __( 'Testing…', 'seosights' ),
					'success' => __( 'Connection successful!', 'seosights' ),
					'failed'  => __( 'Request failed.', 'seosights' ),
				),
			)
		);
	}

	/**
	 * Daily cron callback: gather site stats and POST them to the API.
	 */
	public function sync_stats() {
		$settings = $this->get_settings();
		if ( empty( $settings['enable_stats'] ) || '' === $settings['api_key'] ) {
			return;
		}

		$post_counts = wp_count_posts( 'post' );
		$page_counts = wp_count_posts( 'page' );
		$comment_counts = wp_count_comments();
		$users = count_users();

		$published_posts = isset( $post_counts->publish ) ? (int) $post_counts->publish : 0;
		$published_pages = isset( $page_counts->publish ) ? (int) $page_counts->publish : 0;
		$total_comments  = isset( $comment_counts->total_comments ) ? (int) $comment_counts->total_comments : 0;
		$total_users     = isset( $users['total_users'] ) ? (int) $users['total_users'] : 0;

		$data = array(
			'site_url'       => home_url( '/' ),
			'site_name'      => get_bloginfo( 'name' ),
			'wp_version'     => get_bloginfo( 'version' ),
			'php_version'    => PHP_VERSION,
			'plugin_version' => SEOSIGHTS_VERSION,
			'stats'          => array(
				'posts'    => $published_posts,
				'pages'    => $published_pages,
				'comments' => $total_comments,
				'users'    => $total_users,
			),
			'features'       => array(
				'llms_txt'  => ! empty( $settings['enable_llms'] ),
				'schema'    => ! empty( $settings['enable_schema'] ),
				'bot_rules' => $settings['bot_rules'],
			),
			'timestamp'      => current_time( 'mysql' ),
		);

		$this->api->send_stats( $data );
	}
}
