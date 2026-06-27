<?php
/**
 * Settings page template for the seosights WordPress plugin.
 *
 * Rendered by Seosights_Admin::render_settings_page().
 * Expects $settings, $bots, $llms_url, $robots_url, $has_physical_robots
 * to be in scope.
 *
 * @package seosights
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap seosights-wrap">
	<h1>
		<?php echo esc_html__( 'seosights', 'seosights' ); ?>
		<span class="seosights-version">v<?php echo esc_html( SEOSIGHTS_VERSION ); ?></span>
	</h1>
	<p class="seosights-tagline">
		<?php esc_html_e( 'The Operating System for AI Search — unify SEO, AEO & GEO from your WordPress site.', 'seosights' ); ?>
	</p>

	<?php
	// phpcs:disable Generic.WhiteSpace.ScopeIndent -- template file.
	?>
	<div class="seosights-status">
		<h2><?php esc_html_e( 'Status', 'seosights' ); ?></h2>
		<p>
			<strong><?php esc_html_e( 'llms.txt URL:', 'seosights' ); ?></strong>
			<a href="<?php echo esc_url( $llms_url ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $llms_url ); ?></a>
			<?php if ( ! empty( $settings['enable_llms'] ) ) : ?>
				<span class="seosights-badge seosights-badge-on"><?php esc_html_e( 'Active', 'seosights' ); ?></span>
			<?php else : ?>
				<span class="seosights-badge seosights-badge-off"><?php esc_html_e( 'Disabled', 'seosights' ); ?></span>
			<?php endif; ?>
		</p>
		<p>
			<strong><?php esc_html_e( 'robots.txt:', 'seosights' ); ?></strong>
			<?php if ( $has_physical_robots ) : ?>
				<span class="seosights-badge seosights-badge-warn"><?php esc_html_e( 'Physical robots.txt detected — WP virtual rules may not apply', 'seosights' ); ?></span>
			<?php else : ?>
				<span class="seosights-badge seosights-badge-on"><?php esc_html_e( 'Virtual (rules apply)', 'seosights' ); ?></span>
			<?php endif; ?>
		</p>
		<p>
			<strong><?php esc_html_e( 'JSON-LD schema:', 'seosights' ); ?></strong>
			<?php if ( ! empty( $settings['enable_schema'] ) ) : ?>
				<span class="seosights-badge seosights-badge-on"><?php esc_html_e( 'Injecting', 'seosights' ); ?></span>
			<?php else : ?>
				<span class="seosights-badge seosights-badge-off"><?php esc_html_e( 'Disabled', 'seosights' ); ?></span>
			<?php endif; ?>
		</p>
		<p>
			<strong><?php esc_html_e( 'Daily stats sync:', 'seosights' ); ?></strong>
			<?php if ( ! empty( $settings['enable_stats'] ) ) : ?>
				<span class="seosights-badge seosights-badge-on"><?php esc_html_e( 'Scheduled', 'seosights' ); ?></span>
			<?php else : ?>
				<span class="seosights-badge seosights-badge-off"><?php esc_html_e( 'Disabled', 'seosights' ); ?></span>
			<?php endif; ?>
		</p>
	</div>

	<form method="post" action="options.php" class="seosights-form">
		<?php settings_fields( 'seosights_settings_group' ); ?>

		<h2><?php esc_html_e( 'API Settings', 'seosights' ); ?></h2>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row">
					<label for="seosights_api_key"><?php esc_html_e( 'API Key', 'seosights' ); ?></label>
				</th>
				<td>
					<input
						type="password"
						name="<?php echo esc_attr( SEOSIGHTS_OPTION_KEY ); ?>[api_key]"
						id="seosights_api_key"
						value="<?php echo esc_attr( $settings['api_key'] ); ?>"
						class="regular-text"
						autocomplete="off"
						spellcheck="false"
					/>
					<p class="description">
						<?php esc_html_e( 'Your seosights API key. Get one at', 'seosights' ); ?>
						<a href="https://seosights.com/dashboard" target="_blank" rel="noopener">seosights.com/dashboard</a>.
					</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><?php esc_html_e( 'Test Connection', 'seosights' ); ?></th>
				<td>
					<button type="button" class="button button-secondary" id="seosights-test-connection">
						<?php esc_html_e( 'Test Connection', 'seosights' ); ?>
					</button>
					<span id="seosights-test-result" class="seosights-test-result"></span>
				</td>
			</tr>
		</table>

		<h2><?php esc_html_e( 'Features', 'seosights' ); ?></h2>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><?php esc_html_e( 'Enable /llms.txt', 'seosights' ); ?></th>
				<td>
					<label>
						<input
							type="checkbox"
							name="<?php echo esc_attr( SEOSIGHTS_OPTION_KEY ); ?>[enable_llms]"
							value="1"
							<?php checked( ! empty( $settings['enable_llms'] ) ); ?>
						/>
						<?php esc_html_e( 'Serve an auto-generated /llms.txt for AI crawlers (GPTBot, ClaudeBot, PerplexityBot).', 'seosights' ); ?>
					</label>
				</td>
			</tr>
			<tr>
				<th scope="row"><?php esc_html_e( 'Enable JSON-LD schema', 'seosights' ); ?></th>
				<td>
					<label>
						<input
							type="checkbox"
							name="<?php echo esc_attr( SEOSIGHTS_OPTION_KEY ); ?>[enable_schema]"
							value="1"
							<?php checked( ! empty( $settings['enable_schema'] ) ); ?>
						/>
						<?php esc_html_e( 'Inject Organization, WebSite and Article schema into wp_head.', 'seosights' ); ?>
					</label>
				</td>
			</tr>
			<tr>
				<th scope="row"><?php esc_html_e( 'Send site stats', 'seosights' ); ?></th>
				<td>
					<label>
						<input
							type="checkbox"
							name="<?php echo esc_attr( SEOSIGHTS_OPTION_KEY ); ?>[enable_stats]"
							value="1"
							<?php checked( ! empty( $settings['enable_stats'] ) ); ?>
						/>
						<?php esc_html_e( 'Daily sync site stats to your seosights dashboard (post/page/comment counts, plugin version).', 'seosights' ); ?>
					</label>
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="seosights_site_summary"><?php esc_html_e( 'Site summary', 'seosights' ); ?></label>
				</th>
				<td>
					<input
						type="text"
						name="<?php echo esc_attr( SEOSIGHTS_OPTION_KEY ); ?>[site_summary]"
						id="seosights_site_summary"
						value="<?php echo esc_attr( $settings['site_summary'] ); ?>"
						class="regular-text"
						maxlength="280"
					/>
					<p class="description"><?php esc_html_e( 'One-line summary used at the top of your llms.txt file.', 'seosights' ); ?></p>
				</td>
			</tr>
		</table>

		<h2><?php esc_html_e( 'AI Crawler Rules (robots.txt)', 'seosights' ); ?></h2>
		<p class="description">
			<?php esc_html_e( 'Control whether each AI crawler is allowed to crawl your site. These rules are appended to your virtual robots.txt.', 'seosights' ); ?>
		</p>
		<table class="form-table widefat striped seosights-bots-table" role="presentation">
			<thead>
				<tr>
					<th scope="col"><?php esc_html_e( 'Bot', 'seosights' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Allow', 'seosights' ); ?></th>
					<th scope="col"><?php esc_html_e( 'Disallow', 'seosights' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $bots as $bot => $label ) :
					$current = isset( $settings['bot_rules'][ $bot ] ) ? $settings['bot_rules'][ $bot ] : 'allow';
				?>
					<tr>
						<th scope="row">
							<?php echo esc_html( $label ); ?><br />
							<code><?php echo esc_html( $bot ); ?></code>
						</th>
						<td>
							<label>
								<input
									type="radio"
									name="<?php echo esc_attr( SEOSIGHTS_OPTION_KEY ); ?>[bot_rules][<?php echo esc_attr( $bot ); ?>]"
									value="allow"
									<?php checked( $current, 'allow' ); ?>
								/>
								<?php esc_html_e( 'Allow', 'seosights' ); ?>
							</label>
						</td>
						<td>
							<label>
								<input
									type="radio"
									name="<?php echo esc_attr( SEOSIGHTS_OPTION_KEY ); ?>[bot_rules][<?php echo esc_attr( $bot ); ?>]"
									value="disallow"
									<?php checked( $current, 'disallow' ); ?>
								/>
								<?php esc_html_e( 'Disallow', 'seosights' ); ?>
							</label>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>

		<?php submit_button( __( 'Save Changes', 'seosights' ) ); ?>
	</form>

	<style>
		.seosights-wrap { max-width: 980px; }
		.seosights-wrap .seosights-version {
			font-size: .55em; color: #666; font-weight: 400;
			vertical-align: middle; margin-left: 6px;
		}
		.seosights-wrap .seosights-tagline { color: #555; font-style: italic; margin-top: 0; }
		.seosights-status {
			background: #fff; border: 1px solid #c3c4c7; border-left: 4px solid #2271b1;
			padding: 8px 16px 12px; margin: 16px 0; border-radius: 2px;
		}
		.seosights-status h2 { margin-top: 8px; }
		.seosights-badge {
			display: inline-block; padding: 2px 10px; border-radius: 12px;
			font-size: 12px; font-weight: 600; color: #fff; margin-left: 6px;
			line-height: 1.6;
		}
		.seosights-badge-on { background: #2e7d32; }
		.seosights-badge-off { background: #999; }
		.seosights-badge-warn { background: #ed5f00; }
		.seosights-bots-table { max-width: 720px; margin-top: 12px; }
		.seosights-bots-table code { color: #0073aa; }
		.seosights-test-result { margin-left: 12px; font-weight: 600; }
	</style>

	<script>
	(function () {
		var btn = document.getElementById('seosights-test-connection');
		var result = document.getElementById('seosights-test-result');
		if (!btn || !result) { return; }

		btn.addEventListener('click', function () {
			var apiKeyInput = document.getElementById('seosights_api_key');
			var apiKey = apiKeyInput ? apiKeyInput.value : '';

			result.textContent = (window.seosightsAdmin && window.seosightsAdmin.i18n && window.seosightsAdmin.i18n.testing) || 'Testing…';
			result.style.color = '#555';
			btn.disabled = true;

			var ajaxUrl = (window.seosightsAdmin && window.seosightsAdmin.ajaxUrl) || (window.ajaxurl || '');
			var nonce   = (window.seosightsAdmin && window.seosightsAdmin.nonce) || '';

			var formData = new FormData();
			formData.append('action', 'seosights_test_connection');
			formData.append('nonce', nonce);
			formData.append('api_key', apiKey);

			fetch(ajaxUrl, { method: 'POST', body: formData })
				.then(function (r) { return r.json(); })
				.then(function (data) {
					if (data && data.success) {
						result.textContent = '✓ ' + ((data.data && data.data.message) || 'Connection successful!');
						result.style.color = '#2e7d32';
					} else {
						var msg = (data && data.data && data.data.message) ? data.data.message : 'Failed';
						result.textContent = '✗ ' + msg;
						result.style.color = '#c62828';
					}
				})
				.catch(function () {
					result.textContent = '✗ ' + ((window.seosightsAdmin && window.seosightsAdmin.i18n && window.seosightsAdmin.i18n.failed) || 'Request failed.');
					result.style.color = '#c62828';
				})
				.finally(function () { btn.disabled = false; });
		});
	})();
	</script>
</div>
