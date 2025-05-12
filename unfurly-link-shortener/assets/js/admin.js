jQuery(document).ready(function($) {
    // Only proceed if we're in the block editor
    if (!wp || !wp.data || !wp.element || !wp.components || !wp.plugins) {
        return;
    }

    const { registerPlugin } = wp.plugins;
    const { PluginSidebar } = wp.editor;
    const { createElement, useState, useEffect, Fragment } = wp.element;
    const { Button, Panel, PanelBody, TextControl, Tooltip, Notice, Modal } = wp.components;
    const { dispatch, select, subscribe, useSelect } = wp.data;

    // Add a flag to track if we're currently refreshing
    let isRefreshing = false;
    let lastSaveTime = 0;

    // PrimeIcons SVG paths
    const icons = {
        copy: createElement('svg', {
            width: '16',
            height: '16',
            viewBox: '0 0 1024 1024',
            fill: 'currentColor',
        }, 
            createElement('path', {
                d: 'M466.54 872.229c-31.446 0-56.939-25.492-56.939-56.939v-85.746h204.8v85.746c0 31.446-25.492 56.939-56.94 56.939h-90.922zM695.398 859.175h50.659c88.869 0 160.914-72.044 160.914-160.914v-601.347c0-88.869-72.046-160.914-160.914-160.914h-468.114c-88.871 0-160.914 72.046-160.914 160.914v601.347c0 88.87 72.044 160.914 160.914 160.914h50.659c18.586 58.466 73.314 100.825 137.936 100.825h90.922c64.622 0 119.352-42.358 137.936-100.825zM702.172 771.404v-79.895c0-27.469-22.268-49.737-49.737-49.737h-280.869c-27.47 0-49.737 22.268-49.737 49.737v79.895h-43.886c-40.396 0-73.143-32.748-73.143-73.143v-601.347c0-40.397 32.747-73.143 73.143-73.143h468.114c40.397 0 73.143 32.746 73.143 73.143v601.347c0 40.395-32.746 73.143-73.143 73.143h-43.885z',
                transform: 'scale(1,-1) translate(0,-1024)'
            })
        ),
        analytics: createElement('svg', {
            width: '16',
            height: '16',
            viewBox: '0 0 1024 1024',
            fill: 'currentColor',
        },
            createElement('path', {
                d: 'M46.545-64c-25.567 0.345-46.201 20.979-46.545 46.512v930.943c0 25.706 20.839 46.545 46.545 46.545s46.545-20.839 46.545-46.545v0-930.909c-0.345-25.567-20.979-46.201-46.512-46.545h-0.033zM977.455-64h-930.909c-25.706 0-46.545 20.839-46.545 46.545s20.839 46.545 46.545 46.545v0h930.909c25.706 0 46.545-20.839 46.545-46.545s-20.839-46.545-46.545-46.545v0zM636.121 277.334c-0.064 0-0.141 0-0.217 0-12.783 0-24.345 5.222-32.671 13.649l-153.295 153.295-153.29-153.29c-8.289-7.74-19.456-12.492-31.731-12.492-25.706 0-46.545 20.839-46.545 46.545 0 12.276 4.752 23.441 12.518 31.759l-0.025-0.028 186.182 186.182c8.42 8.41 20.049 13.613 32.892 13.613s24.471-5.201 32.893-13.613v0l153.29-153.29 215.35 215.35c8.289 7.74 19.456 12.492 31.731 12.492 25.706 0 46.545-20.839 46.545-46.545 0-12.276-4.752-23.441-12.518-31.759l0.025 0.028-248.243-248.243c-8.33-8.432-19.892-13.654-32.675-13.654-0.076 0-0.153 0-0.228 0h0.012zM915.393 333.808c-25.567 0.345-46.201 20.979-46.545 46.512v176.285h-170.666c-25.706 0-46.545 20.839-46.545 46.545s20.839 46.545 46.545 46.545v0h217.212c25.567-0.345 46.201-20.979 46.545-46.512v-222.831c-0.345-25.567-20.979-46.201-46.512-46.545h-0.033z',
                transform: 'scale(1,-1) translate(0,-1024)'
            })
        ),
        success: createElement('svg', {
            width: '16',
            height: '16',
            viewBox: '0 0 1088 1024',
            fill: '#00a32a',
        },
            createElement('path', {
                d: 'M367.973 82.291c-12.364 0.429-23.354 5.979-30.973 14.583l-0.039 0.045-292.569 292.569c-12.118 7.943-20.011 21.462-20.011 36.822 0 24.237 19.649 43.886 43.886 43.886 16.258 0 30.454-8.843 38.038-21.983l0.112-0.213 261.556-259.802 612.637 610.884c6.739 4.429 14.999 7.063 23.874 7.063 24.237 0 43.886-19.649 43.886-43.886 0-7.977-2.129-15.457-5.848-21.903l0.112 0.213-643.651-643.651c-7.658-8.649-18.646-14.2-30.94-14.626l-0.073-0.001z',
                transform: 'scale(1,-1) translate(0,-1024)'
            })
        ),
        trash: createElement('svg', {
            width: '18',
            height: '18',
            viewBox: '0 0 1024 1024',
            fill: '#d63638'
        },
            createElement('path', {
                d: 'M979.856 640.991h-935.714c-24.224 0-43.862 19.638-43.862 43.862s19.638 43.862 43.862 43.862h935.714c24.224 0 43.862-19.638 43.862-43.862s-19.638-43.862-43.862-43.862v0zM771.66-63.718h-519.321c-2.865-0.208-6.208-0.328-9.577-0.328-74.752 0-135.856 58.437-140.12 132.119l-0.018 0.377v613.477c0 24.224 19.638 43.862 43.862 43.862s43.862-19.638 43.862-43.862v0-613.477c0-23.977 27.486-44.447 58.483-44.447h519.321c32.75 0 58.483 20.468 58.483 44.447v613.477c0 26.162 21.208 47.37 47.37 47.37s47.37-21.208 47.37-47.37v0-613.477c-4.282-74.060-65.385-132.496-140.136-132.496-3.37 0-6.712 0.119-10.022 0.352l0.445-0.025zM778.678 696.548c-0.175-0.003-0.382-0.004-0.589-0.004-23.9 0-43.276 19.376-43.276 43.276 0 0.207 0.001 0.414 0.004 0.62v-0.032 87.138c0 23.977-28.071 44.447-58.483 44.447h-326.915c-32.166 0-58.483-20.468-58.483-44.447v-87.138c0-24.224-19.638-43.862-43.862-43.862s-43.862 19.638-43.862 43.862v0 87.138c4.697 74.022 65.883 132.278 140.675 132.278 1.945 0 3.88-0.040 5.806-0.118l-0.276 0.008h325.161c2.174 0.119 4.719 0.188 7.28 0.188 74.82 0 136.023-58.3 140.66-131.951l0.021-0.407v-87.138c0.003-0.174 0.004-0.38 0.004-0.585 0-24.224-19.638-43.862-43.862-43.862-0.001 0-0.003 0-0.004 0v0zM407.901 155.59c-24.092 0.325-43.537 19.769-43.862 43.83v264.955c0 24.224 19.638 43.862 43.862 43.862s43.862-19.638 43.862-43.862v0-264.339c0.003-0.174 0.004-0.38 0.004-0.585 0-24.224-19.638-43.862-43.862-43.862-0.001 0-0.003 0-0.004 0v0zM616.099 155.59c-24.224 0-43.862 19.638-43.862 43.862v0 264.924c0 24.224 19.638 43.862 43.862 43.862s43.862-19.638 43.862-43.862v0-264.339c0-0.001 0-0.003 0-0.004 0-24.342-19.568-44.112-43.83-44.443h-0.032z',
                transform: 'scale(1,-1) translate(0,-1024)',
                fill: '#d63638'
            })
        )
    };

    // Create custom icon component
    const UnfurlyIcon = () => {
        return createElement(
            'div',
            {
                className: 'unfurly-custom-icon',
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px'
                }
            },
            createElement('img', {
                src: unfurlyData.pluginUrl + '/assets/images/unfurly-logo.png',
                alt: 'Unfurly',
                style: {
                    width: '20px',
                    height: '20px',
                    objectFit: 'contain'
                }
            })
        );
    };

    // Register a custom store for our URLs
    const STORE_NAME = 'unfurly/urls';
    wp.data.registerStore(STORE_NAME, {
        reducer: (state = { urls: [], lastUpdate: 0, utmParams: null, shorteningDisabled: false }, action) => {
            switch (action.type) {
                case 'SET_URLS':
                    return {
                        ...state,
                        urls: action.urls,
                        lastUpdate: Date.now()
                    };
                case 'REMOVE_URL':
                    return {
                        ...state,
                        urls: state.urls.filter(url => url.short !== action.url),
                        lastUpdate: Date.now()
                    };
                case 'SET_UTM_PARAMS':
                    return {
                        ...state,
                        utmParams: action.utmParams
                    };
                case 'SET_SHORTENING_DISABLED':
                    return {
                        ...state,
                        shorteningDisabled: action.disabled
                    };
                default:
                    return state;
            }
        },
        actions: {
            setUrls(urls) {
                return {
                    type: 'SET_URLS',
                    urls
                };
            },
            removeUrl(url) {
                return {
                    type: 'REMOVE_URL',
                    url
                };
            },
            setUtmParams(utmParams) {
                return {
                    type: 'SET_UTM_PARAMS',
                    utmParams
                };
            },
            setShorteningDisabled(disabled) {
                return {
                    type: 'SET_SHORTENING_DISABLED',
                    disabled
                };
            }
        },
        selectors: {
            getUrls(state) {
                return state.urls;
            },
            getLastUpdate(state) {
                return state.lastUpdate;
            },
            getUtmParams(state) {
                return state.utmParams;
            },
            getShorteningDisabled(state) {
                return state.shorteningDisabled;
            }
        }
    });

    // Helper function to format URL for display
    function formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return {
                domain: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                full: url
            };
        } catch (e) {
            return { domain: '', path: url, full: url };
        }
    }

    // Helper function to get analytics URL
    function getAnalyticsUrl(shortUrl) {
        try {
            const urlObj = new URL(shortUrl);
            const key = urlObj.pathname.split('/').pop();
            return `https://unfur.ly/app/analytics?domain=${urlObj.hostname}&key=${key}`;
        } catch (e) {
            return null;
        }
    }

    // Handle copy button clicks
    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalContent = button.innerHTML;
            // Create success icon SVG element directly
            const successIcon = document.createElement('div');
            successIcon.style.display = 'flex';
            successIcon.style.alignItems = 'center';
            successIcon.style.justifyContent = 'center';
            successIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#00a32a">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>`;
            button.innerHTML = '';
            button.appendChild(successIcon);
            setTimeout(() => {
                button.innerHTML = originalContent;
            }, 1000);
        });
    }

    // Function to refresh shortened URLs
    function refreshShortenedUrls(showNotification = true) {
        if (isRefreshing) {
            return;
        }

        const now = Date.now();
        if (now - lastSaveTime < 2000) {
            return;
        }

        isRefreshing = true;
        lastSaveTime = now;

        console.log('Refreshing shortened URLs...');
        $.ajax({
            url: unfurlyData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'unfurly_refresh_shortened_urls',
                post_id: unfurlyData.postId,
                nonce: unfurlyData.nonce
            },
            success: function(response) {
                console.log('Refresh response:', response);
                if (response.success) {
                    dispatch(STORE_NAME).setUrls(response.data.urls);
                    
                    if (showNotification) {
                        dispatch('core/notices').createNotice(
                            'info',
                            'Found ' + response.data.count + ' shortened URLs',
                            {
                                isDismissible: true,
                                type: 'snackbar',
                                id: 'unfurly-urls-found'
                            }
                        );
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Refresh error:', error);
                if (showNotification) {
                    dispatch('core/notices').createNotice(
                        'error',
                        'Error refreshing URLs: ' + error,
                        {
                            isDismissible: true,
                            id: 'unfurly-urls-error'
                        }
                    );
                }
            },
            complete: function() {
                isRefreshing = false;
            }
        });
    }

    // Function to load UTM parameters
    function loadUtmParams() {
        $.ajax({
            url: unfurlyData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'unfurly_get_utm_params',
                post_id: unfurlyData.postId,
                nonce: unfurlyData.nonce
            },
            success: function(response) {
                if (response.success) {
                    dispatch(STORE_NAME).setUtmParams(response.data.utmParams);
                }
            }
        });
    }

    // Function to save UTM parameters
    function saveUtmParams(utmParams) {
        $.ajax({
            url: unfurlyData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'unfurly_save_utm_params',
                post_id: unfurlyData.postId,
                nonce: unfurlyData.nonce,
                utm_params: utmParams
            },
            success: function(response) {
                if (response.success) {
                    dispatch(STORE_NAME).setUtmParams(response.data.utmParams);
                    // Clear the URLs list in both the store and post meta
                    dispatch(STORE_NAME).setUrls([]);
                    // Also clear the URLs in post meta
                    $.ajax({
                        url: unfurlyData.ajaxUrl,
                        type: 'POST',
                        data: {
                            action: 'unfurly_clear_shortened_urls',
                            post_id: unfurlyData.postId,
                            nonce: unfurlyData.nonce
                        }
                    });
                    dispatch('core/notices').createNotice(
                        'info',
                        'UTM parameters updated. New shortened URLs will be generated when you save the post.',
                        {
                            type: 'snackbar',
                            isDismissible: true
                        }
                    );
                }
            },
            error: function() {
                dispatch('core/notices').createNotice(
                    'error',
                    'Failed to update UTM parameters',
                    {
                        type: 'snackbar',
                        isDismissible: true
                    }
                );
            }
        });
    }

    // Function to delete a URL
    function deleteUrl(url, showApiDeleteConfirm = false) {
        console.log('Delete URL called:', url, 'showApiDeleteConfirm:', showApiDeleteConfirm);
        if (showApiDeleteConfirm && unfurlyData.hasApiKey) {
            console.log('Showing confirmation modal');
            // Store the URL to be deleted in the Redux store
            dispatch(STORE_NAME).setPendingDelete({
                url: url,
                confirmed: false
            });
        } else {
            console.log('Deleting directly from post');
            // Just delete from post
            deleteUrlFromPost(url);
        }
    }

    // Function to delete URL from post
    function deleteUrlFromPost(url) {
        console.log('Deleting URL from post:', url);
        $.ajax({
            url: unfurlyData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'unfurly_delete_url',
                post_id: unfurlyData.postId,
                nonce: unfurlyData.nonce,
                url: url
            },
            success: function(response) {
                console.log('Delete response:', response);
                if (response.success) {
                    // Update the store immediately
                    dispatch(STORE_NAME).removeUrl(url);
                    
                    dispatch('core/notices').createNotice(
                        'success',
                        'URL removed successfully',
                        {
                            type: 'snackbar',
                            isDismissible: true
                        }
                    );
                }
            },
            error: function(xhr, status, error) {
                console.error('Delete error:', error);
                dispatch('core/notices').createNotice(
                    'error',
                    'Failed to delete URL: ' + error,
                    {
                        type: 'snackbar',
                        isDismissible: true
                    }
                );
            }
        });
    }

    // Function to delete URL from unfur.ly API
    function deleteUrlFromApi(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const key = urlObj.pathname.split('/').pop();

            $.ajax({
                url: `https://unfur.ly/api/external/v1/redirects/${domain}/${key}`,
                type: 'DELETE',
                headers: {
                    'x-api-key': unfurlyData.apiKey,
                    'Accept': 'application/json'
                },
                success: function() {
                    deleteUrlFromPost(url);
                },
                error: function() {
                    dispatch('core/notices').createNotice(
                        'error',
                        'Failed to delete URL from unfur.ly. The URL was only removed from this post.',
                        {
                            type: 'snackbar',
                            isDismissible: true
                        }
                    );
                    deleteUrlFromPost(url);
                }
            });
        } catch (e) {
            console.error('Error parsing URL:', e);
            deleteUrlFromPost(url);
        }
    }

    // Create a separate component for the sidebar content
    function SidebarContent() {
        const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
        const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
        const urls = useSelect(select => {
            return select(STORE_NAME).getUrls() || [];
        }, []);
        const shorteningDisabled = useSelect(select => {
            return select(STORE_NAME).getShorteningDisabled();
        }, []);
        const [urlToDelete, setUrlToDelete] = useState(null);

        // Function to toggle link shortening
        function toggleShortening(disabled) {
            $.ajax({
                url: unfurlyData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'unfurly_toggle_shortening',
                    post_id: unfurlyData.postId,
                    nonce: unfurlyData.nonce,
                    disabled: disabled
                },
                success: function(response) {
                    if (response.success) {
                        dispatch(STORE_NAME).setShorteningDisabled(response.data.disabled);
                        dispatch('core/notices').createNotice(
                            'info',
                            response.data.disabled ? 
                                'Link shortening disabled for this post.' : 
                                'Link shortening enabled for this post.',
                            {
                                type: 'snackbar',
                                isDismissible: true
                            }
                        );
                        if (!response.data.disabled) {
                            refreshShortenedUrls(true);
                        }
                    }
                }
            });
        }

        // Load initial shortening disabled state
        useEffect(() => {
            $.ajax({
                url: unfurlyData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'unfurly_get_utm_params',
                    post_id: unfurlyData.postId,
                    nonce: unfurlyData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        dispatch(STORE_NAME).setShorteningDisabled(!!response.data.shorteningDisabled);
                    }
                }
            });
        }, []);

        // Function to handle analytics modal close
        function handleAnalyticsModalClose() {
            setIsAnalyticsModalOpen(false);
        }

        // Render the analytics info modal
        function renderAnalyticsModal() {
            if (!isAnalyticsModalOpen) return null;

            return createElement(Modal, {
                title: 'Analytics Feature',
                onRequestClose: handleAnalyticsModalClose
            },
                createElement('div', { className: 'unfurly-modal-content' },
                    createElement('p', null, 
                        'Track clicks, analyze traffic sources, and gain valuable insights into your shortened links with unfur.ly Analytics.'
                    ),
                    createElement('p', null,
                        'This feature requires an API key from our Essentials tier subscription, which includes:'
                    ),
                    createElement('ul', null,
                        createElement('li', null, '✓ Click tracking and analytics'),
                        createElement('li', null, '✓ Geographic data'),
                        createElement('li', null, '✓ Device and browser information'),
                        createElement('li', null, '✓ Referrer tracking'),
                        createElement('li', null, '✓ Custom domains'),
                        createElement('li', null, '✓ API access')
                    ),
                    createElement('p', { className: 'unfurly-modal-note' },
                        'Already have an API key? Add it in the plugin settings to enable analytics.'
                    )
                ),
                createElement('div', { className: 'unfurly-modal-buttons' },
                    createElement(Button, {
                        isPrimary: true,
                        onClick: () => {
                            window.location.href = '/wp-admin/options-general.php?page=unfurly-settings';
                        }
                    }, 'Add API Key'),
                    createElement(Button, {
                        isSecondary: true,
                        onClick: () => {
                            window.open('https://unfur.ly/app/pricing', '_blank');
                            handleAnalyticsModalClose();
                        }
                    }, 'Get an API Key'),
                    createElement(Button, {
                        isSecondary: true,
                        onClick: handleAnalyticsModalClose
                    }, 'Close')
                )
            );
        }

        // Function to delete a URL
        function deleteUrl(url, showApiDeleteConfirm = false) {
            console.log('Delete URL called:', url, 'showApiDeleteConfirm:', showApiDeleteConfirm);
            if (showApiDeleteConfirm && unfurlyData.hasApiKey) {
                console.log('Showing confirmation modal');
                setUrlToDelete(url);
                setIsDeleteModalOpen(true);
            } else {
                console.log('Deleting directly from post');
                deleteUrlFromPost(url);
            }
        }

        // Function to handle modal close
        function handleModalClose() {
            setIsDeleteModalOpen(false);
            setUrlToDelete(null);
        }

        // Render the delete confirmation modal
        function renderDeleteModal() {
            if (!isDeleteModalOpen || !urlToDelete) return null;

            return createElement(Modal, {
                title: 'Delete Shortened URL',
                onRequestClose: () => {
                    handleModalClose();
                    deleteUrlFromPost(urlToDelete);
                }
            },
                createElement('p', null, 
                    'Would you like to delete this URL from unfur.ly as well? This will make the shortened URL stop working completely.'
                ),
                createElement('div', { className: 'unfurly-modal-buttons' },
                    createElement(Button, {
                        isPrimary: true,
                        onClick: () => {
                            deleteUrlFromApi(urlToDelete);
                            handleModalClose();
                        }
                    }, 'Yes, delete everywhere'),
                    createElement(Button, {
                        isSecondary: true,
                        onClick: () => {
                            deleteUrlFromPost(urlToDelete);
                            handleModalClose();
                        }
                    }, 'No, just remove from post')
                )
            );
        }

        // Function to render URL table
        function renderUrlTable() {
            if (!urls || urls.length === 0) {
                return createElement('div', { className: 'unfurly-no-urls' },
                    'No shortened URLs found.'
                );
            }

            return createElement('div', { className: 'unfurly-urls-list' },
                createElement('p', null, urls.length + ' shortened URLs found'),
                urls.map((url, index) => {
                    const shortUrl = formatUrl(url.short);
                    const originalUrl = formatUrl(url.original);
                    const analyticsUrl = getAnalyticsUrl(url.short);
                    
                    return createElement('div', { key: index, className: 'unfurly-url-item' },
                        createElement('div', { className: 'unfurly-url-row' },
                            createElement(Tooltip, { text: url.short },
                                createElement('a', { href: url.short, target: '_blank', rel: 'noopener noreferrer' },
                                    shortUrl.domain + shortUrl.path
                                )
                            ),
                            createElement('div', { className: 'unfurly-actions' },
                                analyticsUrl && createElement(
                                    unfurlyData.hasApiKey ? 'a' : 'button',
                                    {
                                        ...(unfurlyData.hasApiKey ? {
                                            href: analyticsUrl,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            className: 'components-button is-secondary is-small',
                                            title: 'View Analytics'
                                        } : {
                                            className: 'components-button is-secondary is-small',
                                            onClick: () => setIsAnalyticsModalOpen(true),
                                            title: 'Learn About Analytics'
                                        })
                                    },
                                    createElement(Tooltip, {
                                        text: unfurlyData.hasApiKey 
                                            ? 'View Analytics' 
                                            : 'Click to learn about our analytics feature'
                                    },
                                        icons.analytics
                                    )
                                ),
                                createElement(
                                    'button',
                                    {
                                        className: 'components-button is-secondary is-small',
                                        onClick: (e) => copyToClipboard(url.short, e.currentTarget),
                                        title: 'Copy Short URL'
                                    },
                                    icons.copy
                                ),
                                createElement(
                                    'button',
                                    {
                                        className: 'components-button is-secondary is-small delete-button',
                                        onClick: () => {
                                            console.log('Delete button clicked for URL:', url.short);
                                            deleteUrl(url.short, true);
                                        },
                                        title: 'Delete URL'
                                    },
                                    icons.trash
                                )
                            )
                        ),
                        createElement('div', { className: 'unfurly-url-row original' },
                            createElement(Tooltip, { text: url.original },
                                createElement('a', { href: url.original, target: '_blank', rel: 'noopener noreferrer' },
                                    originalUrl.domain + originalUrl.path
                                )
                            ),
                            createElement(
                                'button',
                                {
                                    className: 'components-button is-secondary is-small',
                                    onClick: (e) => copyToClipboard(url.original, e.currentTarget),
                                    title: 'Copy Original URL'
                                },
                                icons.copy
                            )
                        )
                    );
                })
            );
        }

        return createElement(Fragment, null,
            createElement(
                PanelBody,
                {
                    initialOpen: true
                },
                createElement('div', { className: 'unfurly-shortening-toggle' },
                    createElement(wp.components.CheckboxControl, {
                        label: 'Disable link shortening for this post',
                        checked: shorteningDisabled,
                        onChange: toggleShortening,
                        __nextHasNoMarginBottom: true
                    })
                ),
                !shorteningDisabled && renderUrlTable(),
                !shorteningDisabled && createElement(
                    Button,
                    {
                        isPrimary: true,
                        className: 'unfurly-refresh-button',
                        onClick: () => refreshShortenedUrls(true),
                        icon: UnfurlyIcon
                    },
                    'Refresh URLs'
                )
            ),
            !shorteningDisabled && createElement(UtmParamsPanel),
            isDeleteModalOpen && renderDeleteModal(),
            renderAnalyticsModal()
        );
    }

    // Create UTM Parameters Panel Component
    function UtmParamsPanel() {
        const utmParams = select(STORE_NAME).getUtmParams() || {};
        const [localUtmParams, setLocalUtmParams] = useState(utmParams);
        const [isEdited, setIsEdited] = useState(false);
        const [validationErrors, setValidationErrors] = useState({});
        const hasApiKey = unfurlyData.hasApiKey;

        useEffect(() => {
            setLocalUtmParams(utmParams);
        }, [utmParams]);

        const updateParam = (key, value) => {
            setLocalUtmParams(prev => ({
                ...prev,
                [key]: value
            }));
            setIsEdited(true);
            
            // Clear validation error for this field if it exists
            if (validationErrors[key]) {
                setValidationErrors(prev => ({
                    ...prev,
                    [key]: null
                }));
            }
        };

        const validateParams = () => {
            const errors = {};
            const requiredParams = ['campaign', 'source', 'medium', 'id'];
            
            // Check if any UTM parameter has a value
            const hasAnyValue = Object.values(localUtmParams).some(value => value?.trim());
            
            if (hasAnyValue) {
                // If any parameter is set, validate required ones
                requiredParams.forEach(param => {
                    if (!localUtmParams[param]?.trim()) {
                        errors[param] = 'Required when using UTM parameters';
                    }
                });
            }

            setValidationErrors(errors);
            return Object.keys(errors).length === 0;
        };

        const handleSave = () => {
            if (validateParams()) {
                saveUtmParams(localUtmParams);
                setIsEdited(false);
            } else {
                dispatch('core/notices').createNotice(
                    'error',
                    'Please fill in all required UTM parameters when using any UTM parameter',
                    {
                        type: 'snackbar',
                        isDismissible: true
                    }
                );
            }
        };

        const clearFields = () => {
            const emptyParams = {};
            utmFields.forEach(({ key }) => {
                emptyParams[key] = '';
            });
            setLocalUtmParams(emptyParams);
            setValidationErrors({});
            setIsEdited(true);
        };

        const resetToDefaults = () => {
            setValidationErrors({});
            $.ajax({
                url: unfurlyData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'unfurly_reset_utm_params',
                    post_id: unfurlyData.postId,
                    nonce: unfurlyData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        dispatch(STORE_NAME).setUtmParams(response.data.utmParams);
                        dispatch(STORE_NAME).setUrls([]);
                        setIsEdited(false);
                        dispatch('core/notices').createNotice(
                            'info',
                            'Reset to default UTM parameters. New shortened URLs will be generated when you save the post.',
                            {
                                type: 'snackbar',
                                isDismissible: true
                            }
                        );
                    }
                }
            });
        };

        const utmFields = [
            { key: 'campaign', label: 'Campaign', help: 'Marketing campaign name', required: true },
            { key: 'source', label: 'Source', help: 'Traffic source or referrer', required: true },
            { key: 'medium', label: 'Medium', help: 'Marketing medium e.g., email, cpc', required: true },
            { key: 'content', label: 'Content', help: 'Content identifier or variant (optional)', required: false },
            { key: 'term', label: 'Term', help: 'Search terms or keywords (optional)', required: false },
            { key: 'id', label: 'ID', help: 'Campaign ID', required: true }
        ];

        if (!hasApiKey) {
            return createElement(PanelBody, {
                title: 'UTM Parameters',
                initialOpen: false
            },
                createElement('div', { className: 'unfurly-utm-panel' },
                    createElement(Notice, {
                        status: 'info',
                        isDismissible: false,
                        className: 'unfurly-utm-notice'
                    }, createElement('p', null, 
                        createElement('strong', null, 'Advanced Feature: '),
                        'UTM parameter management requires an API key. Add your API key in the plugin settings to enable this feature.'
                    ))
                )
            );
        }

        return createElement(PanelBody, {
            title: 'UTM Parameters',
            initialOpen: false
        },
            createElement('div', { className: 'unfurly-utm-panel' },
                isEdited && createElement(Notice, {
                    status: 'warning',
                    isDismissible: false,
                    className: 'unfurly-utm-notice'
                }, 'You have unsaved UTM parameter changes.'),
                utmFields.map(({ key, label, help, required }) =>
                    createElement('div', { 
                        key,
                        className: 'unfurly-utm-field-container' + (validationErrors[key] ? ' has-error' : '')
                    },
                        createElement(TextControl, {
                            label: label,
                            help: validationErrors[key] || help,
                            value: localUtmParams[key] || '',
                            onChange: value => updateParam(key, value),
                            __nextHasNoMarginBottom: true,
                            __next40pxDefaultSize: true
                        })
                    )
                ),
                createElement('div', { className: 'unfurly-utm-buttons' },
                    createElement(Button, {
                        isPrimary: true,
                        disabled: !isEdited,
                        onClick: handleSave
                    }, 'Save'),
                    createElement(Button, {
                        isSecondary: true,
                        onClick: clearFields
                    }, 'Clear Fields'),
                    createElement(Button, {
                        isSecondary: true,
                        onClick: resetToDefaults
                    }, 'Reset to Defaults')
                )
            )
        );
    }

    // Create our sidebar plugin
    function UnfurlySidebar() {
        return createElement(
            PluginSidebar,
            {
                name: 'unfurly-sidebar',
                title: 'Shortened URLs',
                icon: UnfurlyIcon
            },
            createElement(SidebarContent)
        );
    }

    // Register our plugin
    registerPlugin('unfurly-sidebar', {
        render: UnfurlySidebar,
        icon: UnfurlyIcon
    });

    // Load UTM parameters when editor loads
    loadUtmParams();

    // Override the savePost function to handle URL refresh after save
    const editor = wp.data.dispatch('core/editor');
    const originalSavePost = editor.savePost;

    editor.savePost = function(options = {}) {
        return originalSavePost.call(this, options)
            .then(() => {
                if (!options.isAutosave) {
                    console.log('Post saved, refreshing shortened URLs...');
                    refreshShortenedUrls(true);
                }
            })
            .catch(error => {
                console.error('Error during save:', error);
                // Re-throw the error to not interrupt normal error handling
                throw error;
            });
    };

    // Initial refresh without notification
    refreshShortenedUrls(false);
}); 