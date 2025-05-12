<?php
/*
Plugin Name: Unfurly Link Shortener
Plugin URI: https://unfur.ly
Description: Automatically shortens links in posts using unfur.ly service. Features include custom domain support, UTM parameter management, and original URL preservation.
Version: 1.0.0
Author: Unfurly
Author URI: https://www.linkedin.com/in/timothyawelch
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: unfurly-link-shortener
Domain Path: /languages
Requires at least: 5.0
Requires PHP: 7.2
*/

// Plugin banner and icon for WordPress.org
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define plugin constants
define( 'UNFURLY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'UNFURLY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'UNFURLY_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
define( 'UNFURLY_PLUGIN_VERSION', '1.0.0' );

// Enqueue admin styles
function unfurly_enqueue_admin_styles($hook) {
    if ('settings_page_unfurly-settings' === $hook || 'post.php' === $hook) {
        wp_enqueue_style(
            'unfurly-admin-styles',
            plugins_url('assets/css/admin.css', __FILE__),
            array('dashicons'),
            '1.0.0'
        );
    }
}
add_action('admin_enqueue_scripts', 'unfurly_enqueue_admin_styles');

// Add settings page to WordPress admin
function unfurly_add_settings_page() {
    add_options_page(
        'Unfurly Link Shortener Settings',
        'Unfurly Shortener',
        'manage_options',
        'unfurly-settings',
        'unfurly_settings_page'
    );
}
add_action('admin_menu', 'unfurly_add_settings_page');

// Handle test URL submission
function unfurly_handle_test_url() {
    check_ajax_referer('unfurly_test_url', 'unfurly_test_nonce');
    
    if (isset($_POST['test_url']) && !empty($_POST['test_url'])) {
        $url = esc_url_raw(wp_unslash($_POST['test_url']));
        $shortened = unfurly_shorten_url($url);
        
        if ($shortened !== $url) {
            echo '<div class="unfurly-test-success">';
            echo '<strong>Success!</strong> URL shortened: ';
            echo '<a href="' . esc_url($shortened) . '" target="_blank">' . esc_html($shortened) . '</a>';
            echo '</div>';
        } else {
            $api_key = get_option('unfurly_api_key');
            $domain = get_option('unfurly_domain', 'unfur.ly');
            
            echo '<div class="unfurly-test-error">';
            echo '<strong>Failed to shorten URL.</strong> ';
            if (empty($api_key)) {
                echo 'No API key provided. Using demo mode. ';
                echo 'Log in to <a href="https://unfur.ly/app/" target="_blank">unfur.ly</a> and head to API Keys to get your API key.';
            } else {
                echo 'Please check your API key and try again.';
                if ($domain !== 'unfur.ly') {
                    echo ' Also verify your custom domain is properly configured.';
                }
            }
            echo '</div>';
        }
        die();
    }
}
add_action('wp_ajax_unfurly_test_url', 'unfurly_handle_test_url');

// Add plugin initialization
function unfurly_init() {
    // Initialize plugin settings
    if (!get_option('unfurly_api_key')) {
        add_option('unfurly_api_key', '');
    }
    if (!get_option('unfurly_domain')) {
        add_option('unfurly_domain', 'unfur.ly');
    }
}
add_action('init', 'unfurly_init');

// Create the settings page
function unfurly_settings_page() {
    ?>
    <div class="wrap unfurly-settings-page">
        <div class="unfurly-header">
            <h2><?php esc_html_e('Unfurly Link Shortener Settings', 'unfurly-link-shortener'); ?></h2>
        </div>

        <div class="unfurly-test-section" style="margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
            <h3><?php esc_html_e('Test Link Shortening', 'unfurly-link-shortener'); ?></h3>
            <p><?php esc_html_e('Enter a URL below to test the link shortening functionality:', 'unfurly-link-shortener'); ?></p>
            <form id="unfurly-test-form" method="post">
                <?php wp_nonce_field('unfurly_test_url', 'unfurly_test_nonce'); ?>
                <input type="url" name="test_url" id="test_url" class="regular-text" placeholder="https://example.com" required>
                <button type="submit" class="button button-secondary"><?php esc_html_e('Test Shortening', 'unfurly-link-shortener'); ?></button>
            </form>
            <div id="unfurly-test-result" style="margin-top: 10px;"></div>
        </div>

        <form method="post" action="options.php">
            <?php
            settings_fields('unfurly_settings');
            do_settings_sections('unfurly-settings');
            ?>
            <div class="unfurly-utm-buttons">
                <input type="submit" name="submit" class="button button-primary" value="<?php esc_attr_e('Save Changes', 'unfurly-link-shortener'); ?>">
                <button type="submit" name="clear_all_utm" class="button button-secondary" onclick="return confirm('<?php esc_attr_e('Are you sure you want to clear all UTM parameters?', 'unfurly-link-shortener'); ?>');"><?php esc_html_e('Clear All UTM Parameters', 'unfurly-link-shortener'); ?></button>
            </div>
        </form>
    </div>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        $('#unfurly-test-form').on('submit', function(e) {
            e.preventDefault();
            
            var $form = $(this);
            var $result = $('#unfurly-test-result');
            
            $result.html('Testing URL...');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'unfurly_test_url',
                    test_url: $('#test_url').val(),
                    unfurly_test_nonce: $('#unfurly_test_nonce').val()
                },
                success: function(response) {
                    $result.html(response);
                },
                error: function() {
                    $result.html('<div class="unfurly-test-error"><strong>Error:</strong> Failed to test URL. Please try again.</div>');
                }
            });
        });
    });
    </script>
    <?php
}

// Register settings
function unfurly_register_settings() {
    register_setting('unfurly_settings', 'unfurly_api_key', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default' => ''
    ));
    
    register_setting('unfurly_settings', 'unfurly_domain', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default' => 'unfur.ly'
    ));
    
    // Register UTM parameters with validation
    $required_utm_params = array('campaign', 'source', 'medium', 'id');
    $optional_utm_params = array('content', 'term');
    $all_utm_params = array_merge($required_utm_params, $optional_utm_params);
    
    // Check if any UTM parameter is set
    $validate_utm = function($value, $param) use ($all_utm_params, $required_utm_params) {
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'])), 'unfurly_settings')) {
            return get_option('unfurly_utm_' . $param);
        }

        $value = sanitize_text_field(wp_unslash($value));
        
        // Check if we're clearing all UTM parameters
        if (isset($_POST['clear_all_utm']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'])), 'unfurly_settings')) {
            return '';
        }
        
        // Check if any UTM parameter has a value
        $any_utm_set = false;
        foreach ($all_utm_params as $utm_param) {
            if (isset($_POST['unfurly_utm_' . $utm_param])) {
                $param_value = sanitize_text_field(wp_unslash($_POST['unfurly_utm_' . $utm_param]));
                if (!empty($param_value)) {
                    $any_utm_set = true;
                    break;
                }
            }
        }
        
        // If no UTM parameters are set, allow empty value
        if (!$any_utm_set) {
            return $value;
        }
        
        // If any UTM parameter is set, validate required fields
        if (in_array($param, $required_utm_params) && empty($value)) {
            add_settings_error(
                'unfurly_utm_' . $param,
                'unfurly_utm_' . $param . '_error',
                sprintf(
                    /* translators: %s: Parameter name */
                    esc_html__('%s is required when using UTM parameters', 'unfurly-link-shortener'),
                    ucfirst($param)
                ),
                'error'
            );
            return get_option('unfurly_utm_' . $param); // Keep the old value
        }
        
        return $value;
    };

    // Register required UTM parameters
    foreach ($required_utm_params as $param) {
        register_setting('unfurly_settings', 'unfurly_utm_' . $param, array(
            'type' => 'string',
            'sanitize_callback' => function($value) use ($param, $validate_utm) {
                return $validate_utm($value, $param);
            },
            'default' => ''
        ));
    }
    
    // Register optional UTM parameters
    foreach ($optional_utm_params as $param) {
        register_setting('unfurly_settings', 'unfurly_utm_' . $param, array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
    }

    add_settings_section(
        'unfurly_main_section',
        'API Settings',
        'unfurly_section_text',
        'unfurly-settings'
    );
    
    add_settings_field(
        'unfurly_api_key',
        'API Key',
        'unfurly_api_key_field',
        'unfurly-settings',
        'unfurly_main_section'
    );

    add_settings_field(
        'unfurly_domain',
        'Custom Domain',
        'unfurly_domain_field',
        'unfurly-settings',
        'unfurly_main_section'
    );

    add_settings_section(
        'unfurly_utm_section',
        'UTM Parameters',
        'unfurly_utm_section_text',
        'unfurly-settings'
    );

    add_settings_field(
        'unfurly_utm_campaign',
        'Campaign',
        'unfurly_utm_field',
        'unfurly-settings',
        'unfurly_utm_section',
        'campaign'
    );

    add_settings_field(
        'unfurly_utm_source',
        'Source',
        'unfurly_utm_field',
        'unfurly-settings',
        'unfurly_utm_section',
        'source'
    );

    add_settings_field(
        'unfurly_utm_medium',
        'Medium',
        'unfurly_utm_field',
        'unfurly-settings',
        'unfurly_utm_section',
        'medium'
    );

    add_settings_field(
        'unfurly_utm_content',
        'Content',
        'unfurly_utm_field',
        'unfurly-settings',
        'unfurly_utm_section',
        'content'
    );

    add_settings_field(
        'unfurly_utm_term',
        'Term',
        'unfurly_utm_field',
        'unfurly-settings',
        'unfurly_utm_section',
        'term'
    );

    add_settings_field(
        'unfurly_utm_id',
        'ID',
        'unfurly_utm_field',
        'unfurly-settings',
        'unfurly_utm_section',
        'id'
    );
}
add_action('admin_init', 'unfurly_register_settings');

function unfurly_section_text() {
    echo '<p>Enter your unfur.ly API settings below:</p>';
}

function unfurly_utm_section_text() {
    $api_key = get_option('unfurly_api_key');
    if (empty($api_key)) {
        echo '<div class="notice notice-info inline"><p><strong>Advanced Feature:</strong> UTM parameter management requires an API key. Add your API key above to enable this feature. Log in to <a href="https://unfur.ly/app/" target="_blank">unfur.ly</a> and head to API Keys to get your API key.</p></div>';
    }
    echo '<p>Configure default UTM parameters for your shortened links. These will be applied to all links, and can be overridden on a per-post basis.</p>';
}

function unfurly_api_key_field() {
    $api_key = get_option('unfurly_api_key');
    echo "<input type='text' name='unfurly_api_key' value='" . esc_attr($api_key) . "' size='40'>";
    echo "<p class='description'>Leaving this blank will use the demo mode, and any links created will not have trackable analytics in your unfur.ly dashboard.</p>";
}

function unfurly_domain_field() {
    $domain = get_option('unfurly_domain', 'unfur.ly');
    echo "<input type='text' name='unfurly_domain' value='" . esc_attr($domain) . "' size='40'>";
    echo "<p class='description'>Warning: Only change this if you have a custom domain configured in your unfur.ly account. Using a custom domain without proper configuration will result in 404 or 422 errors.</p>";
}

function unfurly_utm_field($args) {
    $api_key = get_option('unfurly_api_key');
    $param = is_array($args) ? $args['param'] : $args;
    $value = get_option('unfurly_utm_' . $param);
    $required = in_array($param, array('campaign', 'source', 'medium', 'id'));
    $label = ucfirst($param);
    $error = get_settings_errors('unfurly_utm_' . $param);
    $has_error = !empty($error);
    $disabled = empty($api_key);
    
    echo '<div class="unfurly-utm-field' . ($has_error ? ' has-error' : '') . ($disabled ? ' disabled' : '') . '">';
    echo "<label for='unfurly_utm_" . esc_attr($param) . "'>" . esc_html($label) . "</label>";
    echo "<input type='text' id='unfurly_utm_" . esc_attr($param) . "' name='unfurly_utm_" . esc_attr($param) . "' value='" . esc_attr($value) . "' class='regular-text" . ($has_error ? ' error' : '') . "'" . ($disabled ? ' disabled' : '') . ">";
    
    if ($has_error) {
        foreach ($error as $err) {
            echo "<p class='error-message'>" . esc_html($err['message']) . "</p>";
        }
    } else {
        $help_text = $required ? 'Required if any UTM parameter is set.' : 'Optional parameter.';
        echo "<p class='description'>" . esc_html($help_text) . "</p>";
    }
    echo '</div>';
}

// Function to shorten URLs using unfur.ly
function unfurly_shorten_url($url) {
    // Skip if URL is already shortened by our service
    $domain = get_option('unfurly_domain', 'unfur.ly');
    $parsed_url = wp_parse_url($url);
    if (!$parsed_url) {
        return $url;
    }

    $hostname = $parsed_url['host'];
    if ($hostname === $domain || $hostname === 'https://' . $domain || $hostname === 'http://' . $domain) {
        return $url;
    }
    
    // Check if we've already shortened this URL in this post
    global $post;
    if ($post) {
        $shortened_urls = get_post_meta($post->ID, '_unfurly_shortened_urls', true);
        if (is_array($shortened_urls)) {
            foreach ($shortened_urls as $short_url => $original_url) {
                if ($original_url === $url) {
                    return $short_url;
                }
            }
        }
    }
    
    $api_key = get_option('unfurly_api_key');
    $api_url = 'https://unfur.ly/api/external/v1/redirects/standard';
    $demo = false;

    if (empty($api_key)) {
        $api_url = 'https://unfur.ly/api/ui/v1/demo/furls';
        $demo = true;
    }

    // Generate a title from the URL
    $title = '';
    if (!$demo) {
        // Try to get the page title
        $response = wp_remote_get($url);
        if (!is_wp_error($response)) {
            $html = wp_remote_retrieve_body($response);
            if (preg_match('/<title>(.*?)<\/title>/i', $html, $matches)) {
                $title = $matches[1];
            }
        }
        
        // If no title found, use the domain as title
        if (empty($title)) {
            $title = $hostname;
        }
    }

    // Prepare request body
    $body = array();
    
    if ($demo) {
        $body = array(
            'redirectTo' => $url
        );
    } else {
        $body = array(
            'redirectTo' => $url,
            'domain' => $domain,
            'title' => $title
        );
        
        // Get post-specific UTM parameters if they exist
        $utm_params = array();
        if ($post) {
            $post_utm_params = get_post_meta($post->ID, '_unfurly_utm_params', true);
            if (!empty($post_utm_params)) {
                foreach ($post_utm_params as $key => $value) {
                    if (!empty($value)) {
                        $utm_params['utm_' . $key] = $value;
                    }
                }
            } else {
                // Use default UTM parameters
                $utm_fields = array('campaign', 'source', 'medium', 'content', 'term', 'id');
                foreach ($utm_fields as $field) {
                    $value = get_option('unfurly_utm_' . $field);
                    if (!empty($value)) {
                        $utm_params['utm_' . $field] = $value;
                    }
                }
            }
        }
        
        if (!empty($utm_params)) {
            $body['utmParams'] = $utm_params;
        }
    }
    
    $request_args = array(
        'body' => wp_json_encode($body),
        'headers' => array(
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        )
    );

    // Add API key to headers if not in demo mode
    if (!$demo) {
        $request_args['headers']['x-api-key'] = $api_key;
    }
    
    $response = wp_remote_post($api_url, $request_args);
    
    if (is_wp_error($response)) {
        return $url;
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    
    $body = json_decode($response_body, true);
    
    if ($response_code !== 200) {
        return $url;
    }
    
    if (isset($body['furlUrl'])) {
        // Store the original URL in post meta for reference
        global $post;
        if ($post) {
            $shortened_urls = get_post_meta($post->ID, '_unfurly_shortened_urls', true);
            if (!is_array($shortened_urls)) {
                $shortened_urls = array();
            }
            // Only add if this shortened URL doesn't already exist
            if (!isset($shortened_urls[$body['furlUrl']])) {
                $shortened_urls[$body['furlUrl']] = $url;
                update_post_meta($post->ID, '_unfurly_shortened_urls', $shortened_urls);
            }
        }
        return $body['furlUrl'];
    }
    
    return $url;
}

// Function to find and replace URLs in content
function unfurly_process_content($content) {
    // Only process content when viewing the post, not when editing
    if (is_admin() && !defined('DOING_AJAX')) {
        return $content;
    }
    
    // Check if link shortening is disabled for this post
    global $post;
    if ($post && get_post_meta($post->ID, '_unfurly_disable_shortening', true)) {
        return $content;
    }
    
    // Regular expression to find URLs
    $pattern = '/(https?:\/\/[^\s<>\'"]+)/i';
    
    // Replace URLs with shortened versions
    $content = preg_replace_callback($pattern, function($matches) {
        return unfurly_shorten_url($matches[0]);
    }, $content);
    
    return $content;
}

// Hook into post content
add_filter('the_content', 'unfurly_process_content');

// Add JavaScript for meta box refresh
function unfurly_enqueue_admin_scripts() {
    $screen = get_current_screen();
    if ($screen && $screen->is_block_editor()) {
        wp_enqueue_script(
            'unfurly-admin',
            plugins_url('assets/js/admin.js', __FILE__),
            array('jquery', 'wp-plugins', 'wp-editor', 'wp-element', 'wp-components', 'wp-data'),
            UNFURLY_PLUGIN_VERSION,
            true
        );

        wp_localize_script('unfurly-admin', 'unfurlyData', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'postId' => get_the_ID(),
            'nonce' => wp_create_nonce('unfurly_refresh_nonce'),
            'pluginUrl' => plugins_url('', __FILE__),
            'hasApiKey' => !empty(get_option('unfurly_api_key')),
            'apiKey' => get_option('unfurly_api_key')
        ));
    }
}
add_action('enqueue_block_editor_assets', 'unfurly_enqueue_admin_scripts');

// Add admin notice for custom domain warning
function unfurly_admin_notice() {
    $domain = get_option('unfurly_domain', 'unfur.ly');
    if ($domain !== 'unfur.ly' && !empty($domain)) {
        ?>
        <div class="notice notice-warning">
            <p>You are using a custom domain (<?php echo esc_html($domain); ?>) for Unfurly. Make sure this domain is properly configured in your unfur.ly account to avoid 404 or 422 errors.</p>
        </div>
        <?php
    }
}
add_action('admin_notices', 'unfurly_admin_notice');

// AJAX handler for refreshing shortened URLs
function unfurly_refresh_shortened_urls_handler() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'unfurly_refresh_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    if (!$post_id) {
        wp_send_json_error('Invalid post ID');
        return;
    }

    // Get shortened URLs from post meta
    $shortened_urls = get_post_meta($post_id, '_unfurly_shortened_urls', true);
    if (!is_array($shortened_urls)) {
        $shortened_urls = array();
    }

    // Format URLs for response
    $urls = array();
    foreach ($shortened_urls as $short_url => $original_url) {
        $urls[] = array(
            'short' => $short_url,
            'original' => $original_url
        );
    }

    wp_send_json_success(array(
        'urls' => $urls,
        'count' => count($urls)
    ));
}
add_action('wp_ajax_unfurly_refresh_shortened_urls', 'unfurly_refresh_shortened_urls_handler');

// Add AJAX handlers for UTM parameters
function unfurly_get_utm_params_handler() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'unfurly_refresh_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    if (!$post_id) {
        wp_send_json_error('Invalid post ID');
        return;
    }

    // Get post-specific UTM params if they exist
    $utm_params = get_post_meta($post_id, '_unfurly_utm_params', true);
    
    // If no post-specific params, get default params
    if (empty($utm_params)) {
        $utm_params = array(
            'campaign' => get_option('unfurly_utm_campaign'),
            'source' => get_option('unfurly_utm_source'),
            'medium' => get_option('unfurly_utm_medium'),
            'content' => get_option('unfurly_utm_content'),
            'term' => get_option('unfurly_utm_term'),
            'id' => get_option('unfurly_utm_id')
        );
    }

    wp_send_json_success(array(
        'utmParams' => $utm_params
    ));
}
add_action('wp_ajax_unfurly_get_utm_params', 'unfurly_get_utm_params_handler');

function unfurly_save_utm_params_handler() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'unfurly_refresh_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    if (!$post_id) {
        wp_send_json_error('Invalid post ID');
        return;
    }

    // Get and sanitize UTM parameters
    $utm_params = array();
    if (isset($_POST['utm_params'])) {
        $sanitized_params = sanitize_text_field(wp_unslash($_POST['utm_params']));
        $raw_params = json_decode($sanitized_params, true);
        if (is_array($raw_params)) {
            foreach ($raw_params as $key => $value) {
                $utm_params[sanitize_key($key)] = sanitize_text_field($value);
            }
        }
    }

    // Save UTM parameters
    update_post_meta($post_id, '_unfurly_utm_params', $utm_params);

    // Clear existing shortened URLs to force regeneration
    delete_post_meta($post_id, '_unfurly_shortened_urls');

    wp_send_json_success(array(
        'utmParams' => $utm_params
    ));
}
add_action('wp_ajax_unfurly_save_utm_params', 'unfurly_save_utm_params_handler');

function unfurly_reset_utm_params_handler() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'unfurly_refresh_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    if (!$post_id) {
        wp_send_json_error('Invalid post ID');
        return;
    }

    // Delete post-specific UTM parameters
    delete_post_meta($post_id, '_unfurly_utm_params');
    
    // Clear existing shortened URLs to force regeneration
    delete_post_meta($post_id, '_unfurly_shortened_urls');

    // Get default UTM parameters
    $utm_params = array(
        'campaign' => get_option('unfurly_utm_campaign'),
        'source' => get_option('unfurly_utm_source'),
        'medium' => get_option('unfurly_utm_medium'),
        'content' => get_option('unfurly_utm_content'),
        'term' => get_option('unfurly_utm_term'),
        'id' => get_option('unfurly_utm_id')
    );

    wp_send_json_success(array(
        'utmParams' => $utm_params
    ));
}
add_action('wp_ajax_unfurly_reset_utm_params', 'unfurly_reset_utm_params_handler');

// Add AJAX handler for clearing shortened URLs
function unfurly_clear_shortened_urls_handler() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'unfurly_refresh_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    if (!$post_id) {
        wp_send_json_error('Invalid post ID');
        return;
    }

    // Delete the shortened URLs from post meta
    delete_post_meta($post_id, '_unfurly_shortened_urls');

    wp_send_json_success(array(
        'message' => 'Shortened URLs cleared successfully'
    ));
}
add_action('wp_ajax_unfurly_clear_shortened_urls', 'unfurly_clear_shortened_urls_handler');

// Add AJAX handler for deleting URLs
function unfurly_delete_url_handler() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'unfurly_refresh_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID and URL
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    $url = isset($_POST['url']) ? esc_url_raw(wp_unslash($_POST['url'])) : '';

    if (!$post_id || !$url) {
        wp_send_json_error('Invalid parameters');
        return;
    }

    // Get current shortened URLs
    $shortened_urls = get_post_meta($post_id, '_unfurly_shortened_urls', true);
    if (!is_array($shortened_urls)) {
        $shortened_urls = array();
    }

    // Remove the URL from the array
    $shortened_urls = array_filter(
        $shortened_urls,
        function($short_url) use ($url) {
            return $short_url !== $url;
        },
        ARRAY_FILTER_USE_KEY
    );

    // Update post meta
    update_post_meta($post_id, '_unfurly_shortened_urls', $shortened_urls);

    wp_send_json_success(array(
        'message' => 'URL deleted successfully'
    ));
}
add_action('wp_ajax_unfurly_delete_url', 'unfurly_delete_url_handler');

// Add AJAX handler for toggling link shortening
function unfurly_toggle_shortening_handler() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'unfurly_refresh_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get post ID and disabled state
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    $disabled = isset($_POST['disabled']) ? rest_sanitize_boolean(sanitize_text_field(wp_unslash($_POST['disabled']))) : false;

    if (!$post_id) {
        wp_send_json_error('Invalid post ID');
        return;
    }

    // Update the post meta
    update_post_meta($post_id, '_unfurly_disable_shortening', $disabled);

    // If enabling shortening, clear existing shortened URLs to allow regeneration
    if (!$disabled) {
        delete_post_meta($post_id, '_unfurly_shortened_urls');
    }

    wp_send_json_success(array(
        'disabled' => $disabled
    ));
}
add_action('wp_ajax_unfurly_toggle_shortening', 'unfurly_toggle_shortening_handler');

// Add some CSS for the UTM buttons
add_action('admin_head', function() {
    ?>
    <style>
        .unfurly-utm-buttons {
            display: flex;
            gap: 8px;
            margin-top: 20px;
        }
    </style>
    <?php
}); 