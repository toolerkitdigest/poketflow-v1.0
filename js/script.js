// ── Linked Scripts ──
// js/home/jquery.min.js
// plugins/lity/lity.min.js
// https://www.googletagmanager.com/gtag/js?id=G-PWLJ8BRHVD
// https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback
// js/home/menu.js
// js/home/jquery-1.12.2.min.js
// js/home/video-back-buttons.js?v1.3

window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-PWLJ8BRHVD');

// ── Next Inline Block ──

var _at = {}; window._at.track = window._at.track || function () { (window._at.track.q = window._at.track.q || []).push(arguments); }; _at.domain = 'timebucks.com'; _at.owner = '83ee6576ba82'; _at.idSite = '20279'; _at.attributes = {}; _at.webpushid = 'web.93.aimtell.com'; (function () { var u = '//s3.amazonaws.com/cdn.aimtell.com/trackpush/'; var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0]; g.type = 'text/javascript'; g.async = true; g.defer = true; g.src = u + 'trackpush.min.js'; s.parentNode.insertBefore(g, s); })();

// ── Next Inline Block ──

// Lazy-loads the Verisoul SDK on first use (signup / Google sign-in-up only).
        // Login never triggers this, so login users don't load Verisoul. 5s timeout on
        // load and on session() so an adblocker or stalled network surfaces a clear error
        // instead of hanging the form indefinitely.
        window.VerisoulLoader = (function () {
            var TIMEOUT_MS = 5000;
            var loadPromise = null;

            function load() {
                if (loadPromise) return loadPromise;

                loadPromise = new Promise(function (resolve, reject) {
                    var queue = [];
                    var target = {};
                    window.Verisoul = new Proxy(target, {
                        get: function (_, k) {
                            return k in target ? target[k] : function () {
                                var args = Array.prototype.slice.call(arguments);
                                return new Promise(function (res, rej) { queue.push([k, args, res, rej]); });
                            };
                        },
                        set: function (_, k, v) { target[k] = v; return true; }
                    });

                    function flushQueue() {
                        queue.splice(0).forEach(function (item) {
                            try { Promise.resolve(target[item[0]].apply(null, item[1])).then(item[2], item[3]); }
                            catch (e) { item[3](e); }
                        });
                    }
                    function rejectQueue(err) {
                        queue.splice(0).forEach(function (item) { item[3](err); });
                    }

                    var interval = null;
                    function cleanup() {
                        clearTimeout(timer);
                        if (interval) clearInterval(interval);
                    }

                    var timer = setTimeout(function () {
                        cleanup();
                        var err = new Error('Verisoul SDK load timed out');
                        rejectQueue(err);
                        reject(err);
                    }, TIMEOUT_MS);

                    interval = setInterval(function () {
                        if (Object.keys(target).length) {
                            cleanup();
                            flushQueue();
                            resolve();
                        }
                    }, 40);

                    var script = document.createElement('script');
                    script.src = "https:\/\/v2.timebucks.com\/prod\/bundle.js";
                    script.setAttribute('verisoul-project-id', "c2e376bf-46df-44aa-b1cf-178c160b0c55");
                    script.addEventListener('load', function () {
                        if (Object.keys(target).length) {
                            cleanup();
                            flushQueue();
                            resolve();
                        }
                    }, { once: true });
                    script.addEventListener('error', function () {
                        cleanup();
                        var err = new Error('Failed to load Verisoul SDK');
                        rejectQueue(err);
                        reject(err);
                    }, { once: true });
                    document.head.appendChild(script);
                });

                return loadPromise;
            }

            async function getSessionId() {
                await load();
                var sessionPromise = Promise.resolve(window.Verisoul.session()).then(function (s) {
                    return typeof s === 'object' && s !== null ? s.session_id : s;
                });
                var timeoutPromise = new Promise(function (_, rej) {
                    setTimeout(function () { rej(new Error('Verisoul session() timed out')); }, TIMEOUT_MS);
                });
                return Promise.race([sessionPromise, timeoutPromise]);
            }

            // Force the Verisoul SDK to mint a brand-new session_id, bypassing any
            // stale/cached id. The v2 SDK returns stale ids for returning ("continuous")
            // users, which the backend then rejects as "Session ID has expired".
            async function reinitialize() {
                await load();
                var reinitPromise = Promise.resolve(window.Verisoul.reinitialize());
                var timeoutPromise = new Promise(function (_, rej) {
                    setTimeout(function () { rej(new Error('Verisoul reinitialize() timed out')); }, TIMEOUT_MS);
                });
                return Promise.race([reinitPromise, timeoutPromise]);
            }

            return { getSessionId: getSessionId, reinitialize: reinitialize };
        })();

        function showGoogleSignUpError(xhr) {
            console.error('Error getting Google URL:', xhr);
            var errorMessage = 'Failed to initialize Google sign-up. Please try again.';

            if (xhr && xhr.status === 403) {
                try {
                    var errorData = JSON.parse(xhr.responseText);
                    if (errorData.error === 'Account verification failed') {
                        errorMessage = 'Account verification failed. Please try a different sign-up method or contact support.';
                    }
                } catch (e) {
                    errorMessage = 'Account verification failed. Please try a different sign-up method or contact support.';
                }
            }

            alert(errorMessage);
        }

        function postGoogleUrl(session_id, isRetry) {
            return $.post("lib/scripts/php/action.php", {
                action: "getGoogleUrl",
                session_id: session_id,
                ref: "0",
                source: "",
                is_mobile_app: 0,
                retry: isRetry ? 1 : 0,
            });
        }

        async function handleGoogleSignUp() {
            var session_id;
            try {
                session_id = await window.VerisoulLoader.getSessionId();
            } catch (error) {
                console.error("Verisoul failed to get session_id:", error);
                alert('Verification service unavailable. Please disable any ad blocker and try again.');
                return;
            }

            try {
                var response = await postGoogleUrl(session_id, false);
                window.location.href = response;
            } catch (xhr) {
                // A 403 here usually means the session_id was stale/expired (Verisoul v2
                // SDK bug returning cached ids for returning users). Mint a FRESH session
                // and retry ONCE. getGoogleUrl only generates the OAuth URL — no account
                // side effects — so retrying is idempotent and safe.
                if (xhr && xhr.status === 403) {
                    try {
                        await window.VerisoulLoader.reinitialize();
                        var freshSessionId = await window.VerisoulLoader.getSessionId();
                        var retryResponse = await postGoogleUrl(freshSessionId, true);
                        window.location.href = retryResponse;
                    } catch (retryXhr) {
                        showGoogleSignUpError(retryXhr);
                    }
                } else {
                    showGoogleSignUpError(xhr);
                }
            }
        }

// ── Next Inline Block ──

window.turnstileCallbacks = window.turnstileCallbacks || {};
    window.turnstileCallbacks['loginbox'] = function(response) {
        cfFormCaptchaCallback_loginbox(response);
    };

    function cfFormCaptchaCallback_loginbox(response) {
        try {
            const form = document.getElementById('loginbox');
            if (form) {
                let tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
                if (!tokenInput) {
                    tokenInput = document.createElement('input');
                    tokenInput.type = 'hidden';
                    tokenInput.name = 'cf-turnstile-response';
                    form.appendChild(tokenInput);
                }
                tokenInput.value = response;
                
                const submitBtn = form.querySelector('input[type="submit"], input[type="button"], button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.removeAttribute('title');
                }
                
                form.dispatchEvent(new CustomEvent('captcha-verified', { detail: { token: response } }));
                console.log('Form captcha callback completed for loginbox');
            } else {
                logBrokenCaptcha('Form not found in callback: loginbox (User Agent: ' + navigator.userAgent + ')');
            }
        } catch (e) {
            console.error('Form callback error:', e);
            logBrokenCaptcha('Form callback exception: loginbox, Error: ' + e.message + ' (User Agent: ' + navigator.userAgent + ')');
        }
    }
                    document.addEventListener('DOMContentLoaded', function() {
                    const form = document.getElementById('loginbox');
                    if (form) {
                        const submitBtn = form.querySelector('input[type="submit"], input[type="button"], button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.style.opacity = '0.6';
                            submitBtn.title = 'Complete captcha to enable';
                        }
                    }
                });

// ── Next Inline Block ──

function logBrokenCaptcha(errorDescription) {
            // Check if jQuery is available for AJAX logging
            if (typeof $ !== 'undefined') {
                $.ajax({
                    type: 'POST',
                    url: '/lib/scripts/php/action.php',
                    data: {
                        action: 'LogBrokenCaptcha',
                        data: errorDescription
                    }
                }).fail(function(err) {
                    console.error('Failed to log broken captcha:', err);
                });
            } else {
                // Fallback: just log to console if jQuery not available
                console.error('Broken captcha (jQuery not available for logging):', errorDescription);
            }
        }

        window.turnstileWidgets = window.turnstileWidgets || {};
        window.turnstileCallbacks = window.turnstileCallbacks || {};
        window.turnstileRetry = window.turnstileRetry || {};
        window.turnstileLoadAttempts = window.turnstileLoadAttempts || {};

        // Turnstile tokens are single-use: Cloudflare's siteverify consumes them on the
        // first check, so a form that stays on screen after a failed submit (e.g. a wrong
        // password on login) is left holding a spent token. Resubmitting it yields a
        // "timeout-or-duplicate" and the server reports "Captcha verification failed" even
        // though the box still looks ticked (issue #671). Call this after any failed submit
        // that keeps the user on the form to mint a fresh token before they retry.
        function resetTurnstileForForm(formId) {
            try {
                // Invalidate the stale token and re-gate the form SYNCHRONOUSLY first, so the
                // user cannot resubmit the spent token during the async re-challenge.
                var form = document.getElementById(formId);
                if (form) {
                    var tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
                    if (tokenInput) {
                        tokenInput.value = '';
                    }
                    var submitBtn = form.querySelector('input[type="submit"], input[type="button"], button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.style.opacity = '0.6';
                        submitBtn.title = 'Complete captcha to enable';
                    }
                }
                // turnstile.reset() re-runs the challenge and re-fires cfFormCaptchaCallback_{formId},
                // which repopulates the hidden input and re-enables submit once the fresh token lands.
                var widgetDiv = document.querySelector('#captcha-form-div-' + formId + ' [data-form-id="' + formId + '"]');
                var widgetId = widgetDiv ? widgetDiv.id : null;
                var handle = (widgetId && window.turnstileWidgets) ? window.turnstileWidgets[widgetId] : null;
                if (handle && typeof turnstile !== 'undefined') {
                    // Normal path: reset the live widget so its success callback re-enables submit.
                    // If reset throws (stale/detached widget) fall through to a clean re-render so the
                    // form we just disabled cannot be stranded without a way back.
                    try {
                        turnstile.reset(handle);
                        return;
                    } catch (resetErr) {
                        console.warn('resetTurnstileForForm: turnstile.reset failed for ' + formId + ', re-rendering:', resetErr);
                        try {
                            turnstile.remove(handle);
                        } catch (removeErr) {
                            console.warn('resetTurnstileForForm: turnstile.remove failed for ' + formId + ':', removeErr);
                        }
                        if (window.turnstileWidgets) {
                            delete window.turnstileWidgets[widgetId];
                        }
                    }
                }
                // No live handle (widget never registered, was removed, or reset just failed):
                // re-render the visible widget so its callback mints a fresh token and re-enables
                // the submit button we disabled above. If the re-render cannot be established
                // (element gone/hidden, or turnstile.render threw) safeRenderTurnstile returns
                // false — in that case give the user an explicit reload action so the form we
                // just disabled is never left permanently dead with no way back.
                var reRendered = false;
                if (widgetId && typeof safeRenderTurnstile === 'function') {
                    reRendered = safeRenderTurnstile(widgetId, formId) === true;
                }
                if (!reRendered && typeof showCaptchaReloadPrompt === 'function') {
                    showCaptchaReloadPrompt(formId);
                }
            } catch (e) {
                console.warn('resetTurnstileForForm failed for ' + formId + ':', e);
                // The form was disabled synchronously at the top of this function. If we
                // reached here via an unexpected throw, no callback will re-enable it, so
                // surface the explicit reload action rather than leaving it stranded.
                try {
                    if (typeof showCaptchaReloadPrompt === 'function') {
                        showCaptchaReloadPrompt(formId);
                    }
                } catch (promptErr) {
                    console.error('resetTurnstileForForm reload-prompt fallback failed:', promptErr);
                }
            }
        }
        window.resetTurnstileForForm = resetTurnstileForForm;

        // Deterministic last-resort recovery. When a re-challenge cannot be
        // re-established (widget lost the container, remove/render threw), the form
        // was already disabled synchronously and no success callback will ever fire
        // to re-enable it. Rather than strand the user with a dead, disabled form and
        // an empty token, show an explicit "reload" control inside the captcha slot.
        // Submission stays gated (token stays empty, button stays disabled); the only
        // way forward is a page reload, which re-runs the whole render pipeline. Idempotent.
        function showCaptchaReloadPrompt(formId) {
            try {
                var container = document.getElementById('captcha-form-div-' + formId);
                if (!container) { return; }
                if (container.querySelector('[data-captcha-reload="' + formId + '"]')) { return; }
                var prompt = document.createElement('div');
                prompt.setAttribute('data-captcha-reload', formId);
                prompt.style.cssText = 'margin:10px 0;padding:8px;font-size:13px;line-height:1.4;color:#b00020;';
                var msg = document.createElement('span');
                msg.innerHTML = 'The security check could not load. ';
                var link = document.createElement('a');
                link.setAttribute('href', '#');
                link.style.cssText = 'color:#0645ad;text-decoration:underline;cursor:pointer;';
                link.innerHTML = 'Reload the page to try again.';
                link.addEventListener('click', function(ev) {
                    if (ev && ev.preventDefault) { ev.preventDefault(); }
                    try { window.location.reload(); } catch (e) { location.reload(); }
                });
                prompt.appendChild(msg);
                prompt.appendChild(link);
                container.appendChild(prompt);
                logBrokenCaptcha('Captcha unrecoverable, showed reload prompt for form: ' + formId + ' (User Agent: ' + navigator.userAgent + ')');
            } catch (e) {
                console.error('showCaptchaReloadPrompt failed for ' + formId + ':', e);
            }
        }
        window.showCaptchaReloadPrompt = showCaptchaReloadPrompt;

        // Returns true when a render was initiated (or a live widget already owns the
        // slot), false when the challenge could NOT be (re)established via this call.
        // resetTurnstileForForm relies on the return value to decide whether to fall
        // back to the explicit reload prompt, so every early return reports honestly.
        function safeRenderTurnstile(widgetId, formId, attempt = 0) {
            const maxAttempts = 4;
            const el = document.getElementById(widgetId);
            if (!el) {
                logBrokenCaptcha('Widget element not found: ' + widgetId + ' (User Agent: ' + navigator.userAgent + ')');
                return false;
            }

            const visible = el.parentElement && el.parentElement.offsetParent !== null;
            if (!visible) {
                 // If not visible, ensure it's removed so it can be re-rendered when shown
                if (window.turnstileWidgets[widgetId]) {
                    try {
                        turnstile.remove(window.turnstileWidgets[widgetId]);
                    } catch(e) {
                        console.warn('Failed to remove turnstile widget:', e);
                    }
                    delete window.turnstileWidgets[widgetId];
                }
                return false;
            }

            if (window.turnstileWidgets[widgetId]) return true;

            // Track load attempts
            window.turnstileLoadAttempts[widgetId] = (window.turnstileLoadAttempts[widgetId] || 0) + 1;
            
            // If too many load attempts, log as broken
            if (window.turnstileLoadAttempts[widgetId] > 10) {
                logBrokenCaptcha('Too many load attempts for widget: ' + widgetId + ' (attempts: ' + window.turnstileLoadAttempts[widgetId] + ', User Agent: ' + navigator.userAgent + ')');
                return false;
            }

            try {
                window.turnstileWidgets[widgetId] = turnstile.render('#' + widgetId, {
                    sitekey: "0x4AAAAAABkb8v5g8arpaGTc",
                    callback: function(token) {
                        console.log('Turnstile callback success for', widgetId);
                        window.turnstileCallbacks[formId](token);
                        delete window.turnstileRetry[widgetId];
                        // Reset load attempts on success
                        window.turnstileLoadAttempts[widgetId] = 0;
                    },
                    "error-callback": function(err) {
                        console.warn('Turnstile error', err, 'on', widgetId);
                        
                        const errorDetails = 'Widget: ' + widgetId + ', Error: ' + err + ', User Agent: ' + navigator.userAgent + ', Screen: ' + screen.width + 'x' + screen.height + ', Memory: ' + (navigator.deviceMemory || 'unknown') + 'GB';
                        
                        // Log all errors immediately
                        logBrokenCaptcha('Turnstile error callback: ' + errorDetails);

                        // Handle different error types
                        if (String(err) === '600010') {
                            // Network connectivity issue - try longer delay and fewer retries
                            window.turnstileRetry[widgetId] = (window.turnstileRetry[widgetId] || 0) + 1;
                            const tries = window.turnstileRetry[widgetId];
                            
                            if (tries <= 2) { // Only 2 retries for network issues
                                console.log('Network error, retrying turnstile render, attempt:', tries);
                                setTimeout(() => {
                                    try { 
                                        if (window.turnstileWidgets[widgetId]) {
                                            turnstile.remove(window.turnstileWidgets[widgetId]); 
                                        }
                                    } catch(e) {
                                        console.warn('Failed to remove turnstile on network retry:', e);
                                    }
                                    delete window.turnstileWidgets[widgetId];
                                    // If the delayed re-render cannot re-establish the challenge it
                                    // returns false; nothing else will re-enable a gated form, so
                                    // surface the explicit reload recovery. Submit stays gated (#671).
                                    if (safeRenderTurnstile(widgetId, formId, tries) !== true
                                        && typeof showCaptchaReloadPrompt === 'function') {
                                        showCaptchaReloadPrompt(formId);
                                    }
                                }, 2000 * tries); // Longer delay for network issues
                            } else {
                                logBrokenCaptcha('Network connectivity failed after retries: ' + errorDetails);
                                alert("Network connectivity issue. Please check your internet connection and refresh the page.");
                                // Terminal: retries exhausted and no success callback will fire, so
                                // a form gated by resetTurnstileForForm would stay disabled forever.
                                // Offer the explicit reload recovery; submit stays gated (#671).
                                if (typeof showCaptchaReloadPrompt === 'function') { showCaptchaReloadPrompt(formId); }
                            }
                        } else if (String(err).startsWith('300') && window.turnstileWidgets[widgetId]) {
                            // 300*** == generic client error, recommended retry.
                            window.turnstileRetry[widgetId] = (window.turnstileRetry[widgetId] || 0) + 1;
                            const tries = window.turnstileRetry[widgetId];
                            
                            if (tries <= maxAttempts) {
                                console.log('Retrying turnstile render, attempt:', tries);
                                // reset and retry with backoff
                                try { 
                                    turnstile.reset(window.turnstileWidgets[widgetId]); 
                                } catch(e) {
                                    console.warn('Failed to reset turnstile:', e);
                                }
                                
                                setTimeout(() => {
                                    // remove handle then try a clean re-render
                                    try { 
                                        turnstile.remove(window.turnstileWidgets[widgetId]); 
                                    } catch(e) {
                                        console.warn('Failed to remove turnstile on retry:', e);
                                    }
                                    delete window.turnstileWidgets[widgetId];
                                    // A failed delayed re-render (returns false) leaves the gated form
                                    // with no callback to re-enable it; route to the reload recovery.
                                    // Submit stays gated until a genuine success token lands (#671).
                                    if (safeRenderTurnstile(widgetId, formId, tries) !== true
                                        && typeof showCaptchaReloadPrompt === 'function') {
                                        showCaptchaReloadPrompt(formId);
                                    }
                                }, 250 * tries);
                            } else {
                                logBrokenCaptcha('Max retry attempts exceeded: ' + errorDetails);
                                alert("Captcha failed to load after multiple attempts. Please refresh the page. Error: " + err);
                                // Terminal: see network branch above (#671).
                                if (typeof showCaptchaReloadPrompt === 'function') { showCaptchaReloadPrompt(formId); }
                            }
                        } else if (String(err) === '200100') {
                            // Clock skew: the device clock is too far from real time for the
                            // challenge to validate. ~25% of all Turnstile errors here. It was
                            // falling into the non-retryable branch below, so the widget was left
                            // dead with an empty token and the user got a generic "refresh" alert.
                            // Retrying often succeeds because Turnstile re-syncs on re-render.
                            window.turnstileRetry[widgetId] = (window.turnstileRetry[widgetId] || 0) + 1;
                            const tries = window.turnstileRetry[widgetId];

                            if (tries <= 2) {
                                console.log('Clock skew, retrying turnstile render, attempt:', tries);
                                setTimeout(() => {
                                    try {
                                        if (window.turnstileWidgets[widgetId]) {
                                            turnstile.remove(window.turnstileWidgets[widgetId]);
                                        }
                                    } catch(e) {
                                        console.warn('Failed to remove turnstile on clock-skew retry:', e);
                                    }
                                    delete window.turnstileWidgets[widgetId];
                                    // A failed delayed re-render (returns false) would strand the gated
                                    // form; route it to the explicit reload recovery. Submit stays
                                    // gated until a genuine success token lands (#671).
                                    if (safeRenderTurnstile(widgetId, formId, tries) !== true
                                        && typeof showCaptchaReloadPrompt === 'function') {
                                        showCaptchaReloadPrompt(formId);
                                    }
                                }, 1000 * tries);
                            } else {
                                logBrokenCaptcha('Clock skew persisted after retries: ' + errorDetails);
                                alert("The security check could not verify your device. Your device's date and time appear to be wrong - please set them to update automatically, then reload this page.");
                                // Terminal: see network branch above (#671).
                                if (typeof showCaptchaReloadPrompt === 'function') { showCaptchaReloadPrompt(formId); }
                            }
                        } else {
                            logBrokenCaptcha('Non-retryable error: ' + errorDetails);
                            alert("Captcha failed to load. Please refresh the page. Error: " + err);
                            // Terminal: no retry and no success callback will fire, so route a
                            // gated form to the explicit reload recovery; submit stays gated (#671).
                            if (typeof showCaptchaReloadPrompt === 'function') { showCaptchaReloadPrompt(formId); }
                        }
                    },
                    "timeout-callback": function() {
                        const timeoutDetails = 'Widget: ' + widgetId + ', User Agent: ' + navigator.userAgent + ', Connection: ' + (navigator.connection ? navigator.connection.effectiveType : 'unknown');
                        logBrokenCaptcha('Turnstile timeout: ' + timeoutDetails);
                        console.warn('Turnstile timeout on', widgetId);
                        // A timeout is terminal for this challenge: Cloudflare will not fire the
                        // success callback, so a form gated by resetTurnstileForForm would stay
                        // disabled with an empty token. Offer the explicit reload recovery;
                        // submit stays gated until a genuine success token lands (#671).
                        if (typeof showCaptchaReloadPrompt === 'function') { showCaptchaReloadPrompt(formId); }
                    }
                });
                return true;
            } catch (renderError) {
                const renderDetails = 'Widget: ' + widgetId + ', Error: ' + renderError.message + ', User Agent: ' + navigator.userAgent;
                logBrokenCaptcha('Turnstile render exception: ' + renderDetails);
                console.error('Failed to render turnstile:', renderError);
                return false;
            }
        }
        
        window.onloadTurnstileCallback = function() {
            console.log('Turnstile API loaded, initializing widgets');
            
            // Check if turnstile object is available
            if (typeof turnstile === 'undefined') {
                logBrokenCaptcha('Turnstile API loaded but turnstile object undefined (User Agent: ' + navigator.userAgent + ')');
                return;
            }
            
            // Use ResizeObserver to trigger rendering when a div becomes visible
            if (typeof ResizeObserver !== 'undefined') {
                const ro = new ResizeObserver(entries => {
                    entries.forEach(entry => {
                        const widget = entry.target.querySelector('[data-form-id]');
                        if (widget) {
                             safeRenderTurnstile(widget.id, widget.getAttribute('data-form-id'));
                        }
                    });
                });
                document.querySelectorAll('.captcha-form-div').forEach(div => ro.observe(div));
            } else {
                logBrokenCaptcha('ResizeObserver not supported (User Agent: ' + navigator.userAgent + ')');
            }

            // Also render any initially visible widgets
            document.querySelectorAll('.captcha-form-div').forEach(div => {
                const widget = div.querySelector('[data-form-id]');
                if (widget && div.offsetParent !== null) {
                    safeRenderTurnstile(widget.id, widget.getAttribute('data-form-id'));
                }
            });
        };
        
        // Add global error handler for any unhandled turnstile issues
        window.addEventListener('error', function(event) {
            if (event.message && event.message.toLowerCase().includes('turnstile')) {
                logBrokenCaptcha('Global turnstile error: ' + event.message + ' at ' + event.filename + ':' + event.lineno + ' (User Agent: ' + navigator.userAgent + ')');
            }
        });
        
        // Monitor for stuck loading states
        setInterval(function() {
            document.querySelectorAll('[data-form-id]').forEach(function(widget) {
                const widgetId = widget.id;
                const loadingIndicator = widget.querySelector('.cf-turnstile');
                
                if (loadingIndicator && window.turnstileLoadAttempts[widgetId] > 0) {
                    // Check if it's been loading for more than 30 seconds
                    const loadTime = Date.now() - (window.turnstileLoadAttempts[widgetId] * 1000);
                    if (loadTime > 30000) {
                        logBrokenCaptcha('Captcha stuck loading: ' + widgetId + ' (load time: ' + Math.round(loadTime/1000) + 's, User Agent: ' + navigator.userAgent + ')');
                    }
                }
            });
        }, 15000); // Check every 15 seconds

// ── Next Inline Block ──

window.turnstileCallbacks = window.turnstileCallbacks || {};
    window.turnstileCallbacks['signupform'] = function(response) {
        cfFormCaptchaCallback_signupform(response);
    };

    function cfFormCaptchaCallback_signupform(response) {
        try {
            const form = document.getElementById('signupform');
            if (form) {
                let tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
                if (!tokenInput) {
                    tokenInput = document.createElement('input');
                    tokenInput.type = 'hidden';
                    tokenInput.name = 'cf-turnstile-response';
                    form.appendChild(tokenInput);
                }
                tokenInput.value = response;
                
                const submitBtn = form.querySelector('input[type="submit"], input[type="button"], button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.removeAttribute('title');
                }
                
                form.dispatchEvent(new CustomEvent('captcha-verified', { detail: { token: response } }));
                console.log('Form captcha callback completed for signupform');
            } else {
                logBrokenCaptcha('Form not found in callback: signupform (User Agent: ' + navigator.userAgent + ')');
            }
        } catch (e) {
            console.error('Form callback error:', e);
            logBrokenCaptcha('Form callback exception: signupform, Error: ' + e.message + ' (User Agent: ' + navigator.userAgent + ')');
        }
    }
                    document.addEventListener('DOMContentLoaded', function() {
                    const form = document.getElementById('signupform');
                    if (form) {
                        const submitBtn = form.querySelector('input[type="submit"], input[type="button"], button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.style.opacity = '0.6';
                            submitBtn.title = 'Complete captcha to enable';
                        }
                    }
                });

// ── Next Inline Block ──

window.turnstileCallbacks = window.turnstileCallbacks || {};
    window.turnstileCallbacks['commentForm'] = function(response) {
        cfFormCaptchaCallback_commentForm(response);
    };

    function cfFormCaptchaCallback_commentForm(response) {
        try {
            const form = document.getElementById('commentForm');
            if (form) {
                let tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
                if (!tokenInput) {
                    tokenInput = document.createElement('input');
                    tokenInput.type = 'hidden';
                    tokenInput.name = 'cf-turnstile-response';
                    form.appendChild(tokenInput);
                }
                tokenInput.value = response;
                
                const submitBtn = form.querySelector('input[type="submit"], input[type="button"], button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.removeAttribute('title');
                }
                
                form.dispatchEvent(new CustomEvent('captcha-verified', { detail: { token: response } }));
                console.log('Form captcha callback completed for commentForm');
            } else {
                logBrokenCaptcha('Form not found in callback: commentForm (User Agent: ' + navigator.userAgent + ')');
            }
        } catch (e) {
            console.error('Form callback error:', e);
            logBrokenCaptcha('Form callback exception: commentForm, Error: ' + e.message + ' (User Agent: ' + navigator.userAgent + ')');
        }
    }
                    document.addEventListener('DOMContentLoaded', function() {
                    const form = document.getElementById('commentForm');
                    if (form) {
                        const submitBtn = form.querySelector('input[type="submit"], input[type="button"], button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.style.opacity = '0.6';
                            submitBtn.title = 'Complete captcha to enable';
                        }
                    }
                });

// ── Next Inline Block ──

// If terms checkbox is checked, remove the error message
    $('#terms').change(function() {
        if ($(this).is(':checked')) {
            $(".error").animate({
                top: "-100%"
            }, 500);
        }
    });



    async function dosignup() {
        var valid = true;
        const captchaToken = $('#signupform input[name="cf-turnstile-response"]')[0];

        if (!captchaToken || !captchaToken.value) {
            $("#error_msg").html("Please complete the captcha verification");
            $(".error").animate({top: "0"}, 500);
            $("#terms").addClass('required');
            valid = false;
        }

        if ($.trim($("#signup_email").val()) === '') {
            $("#signup_email").addClass('required');
            valid = false;
        }

        if (!$("#terms").is(':checked')) {
            $("#error_msg").html("You must agree to the Terms of Service and Privacy Policy");
            $(".error").animate({top: "0"}, 500);
            $("#terms").addClass('required');
            valid = false;
        }

        // New rule to check for a plus sign, space, or encoded plus sign
        var emailValue = $.trim($("#signup_email").val());
        if (/[+ ]|%2B/.test(emailValue)) { // Regex to check for plus sign, space, or encoded versions
            $("#signup_email").addClass('required');
            valid = false;
            // Remove any previous error messages to avoid duplicates
            $("#signup_email").next('.plus-error').remove();
            // Append the error message
            $("#signup_email").after('<div class="plus-error" style="color:red;">+ symbol is not allowed</div>');
        }


        if ($.trim($("#signup_password").val()) === '') {
            $("#signup_password").addClass('required');
            valid = false;
        }
        if ($.trim($("#signup_confirm_password").val()) === '') {
            $("#signup_confirm_password").addClass('required');
            valid = false;
        }
        if ($.trim($("#signup_password").val()) !== $.trim($("#signup_confirm_password").val())) {
            $("#signup_confirm_password").addClass('required');
            valid = false;
        }
        if (valid) {

            $('#qLoverlay').show();

            var url = 'lib/scripts/php/action.php';

            try {
                // Get Verisoul session ID (lazy-loads SDK with 5s timeout)
                const session_id = await window.VerisoulLoader.getSessionId();

                function submitSignupForm(ipv6Hash) {
                    var formData = $("#signupform").serializeArray();

                    if (ipv6Hash) {
                        formData.push({ name: "ipv6_hash", value: ipv6Hash });
                    }

                    if (session_id) {
                        formData.push({ name: "session_id", value: session_id });
                    }

                    $.post(url, $.param(formData))
                        .done(function(data) {
                            // A malformed / PHP-contaminated body makes parseJSON throw INSIDE
                            // this success handler; jQuery's .fail() does not run for that, so the
                            // spent single-use token would be left in place with no error shown
                            // (issue #671). Parse defensively and route any failure through the
                            // same keep-on-form reset+error path.
                            try {
                                data = (data !== null && typeof data === 'object')
                                    ? data
                                    : jQuery.parseJSON(data);
                            } catch (parseErr) {
                                console.error("Signup response parse failed:", parseErr);
                                resetTurnstileForForm('signupform');
                                $("#error_msg").html("An unexpected error occurred. Please try again.");
                                $(".error").animate({ top: "0" }, 500);
                                valid = false;
                                setTimeout(hideAllMessages, 5000);
                                return;
                            }

                            // Valid JSON can still be null, a primitive or an array — none
                            // of which carry status/msg. Only a non-null object is a usable
                            // payload; anything else routes through the same keep-on-form
                            // reset+error path so a spent token is never left in place (#671).
                            if (data === null || typeof data !== 'object' || Array.isArray(data)) {
                                console.error("Signup response was not a usable object:", data);
                                resetTurnstileForForm('signupform');
                                $("#error_msg").html("An unexpected error occurred. Please try again.");
                                $(".error").animate({ top: "0" }, 500);
                                valid = false;
                                setTimeout(hideAllMessages, 5000);
                                return;
                            }

                            if (data && data.status == '1') {
                                $("#success_msg").html(data.msg);
                                $(".success").animate({ top: "0" }, 500);
                                valid = false;
                                setTimeout(hideAllMessages, 5000);
                                localStorage.setItem('signup', 'true');
                                // The landing tab is decided server-side by signup_landing_tab()
                                // (#770) — Games for US/GB/CA/AU/DE, surveys for everyone else.
                                // The literal is the fallback for an older cached action.php
                                // that does not send data.redirect.
                                window.location.href = data.redirect || '/publishers/index.php?pg=earn&tab=all_surveys';
                            } else {
                                resetTurnstileForForm('signupform');
                                $("#error_msg").html(data.msg);
                                $(".error").animate({ top: "0" }, 500);
                                valid = false;
                                setTimeout(hideAllMessages, 5000);
                            }
                        })
                        .fail(function(err) {
                            valid = false;
                            resetTurnstileForForm('signupform');
                            console.error("Form submission failed:", err);
                        });
                }

                $.post('https://ipv6.freeprize.world/lib/scripts/php/ipv6.php')
                    .done(function(ipData) {
                        submitSignupForm(ipData.message);
                    }).fail(function(err) {
                        console.error("Failed to get IPv6:", err);
                        submitSignupForm(null);
                    });

            } catch (error) {
                console.error("Verisoul failed to get session_id:", error);
                $('#qLoverlay').hide();
                $("#error_msg").html("Verification service unavailable. Please disable any ad blocker and try again.");
                $(".error").animate({top: "0"}, 500);
                setTimeout(hideAllMessages, 5000);
                valid = false;
            }
        }

        return valid;
    }

    function dologinpopup() {
        var valid = true;

        // Check for captcha token
        const captchaToken = $('#loginbox input[name="cf-turnstile-response"]')[0];
        if (!captchaToken || !captchaToken.value) {
            $("#error_msg").html("Please complete the captcha verification");
            $(".error").animate({top: "0"}, 500);
            valid = false;
            setTimeout(hideAllMessages, 5000);
            return false;
        }

        if ($.trim($("#username_box").val()) === '') {
            $("#username_box").addClass('required');
            valid = false;
        }
        if ($.trim($("#password_box").val()) === '') {
            $("#password_box").addClass('required');
            valid = false;
        }

        if (valid) {
            $('#qLoverlay').show();

            var formData = $("#loginbox").serializeArray();
            var url = 'lib/scripts/php/action.php';

            console.log("Form Data:", formData); // Debugging line to check form data

            $.post(url, $.param(formData))
                .done(function(data) {
                    console.log(data);
                    data = $.trim(data);
                    // The captcha token is single-use and already spent server-side on any
                    // outcome that returns here; reset the widget so a retry gets a fresh
                    // token instead of resubmitting the spent one (issue #671). Skip on
                    // success ('1') where we redirect away.
                    if (data != '1') {
                        resetTurnstileForForm('loginbox');
                    }
                    if (data == "2") {
                        $("#error_msg").html("Your account is pending review.");
                        $(".error").animate({
                            top: "0"
                        }, 500);
                        valid = true;
                    } else if (data == "3") {
                        $("#error_msg").html("Please confirm your email address by clicking on link sent at your email address");
                        $(".error").animate({
                            top: "0"
                        }, 500);
                        valid = true;
                    } else if (data == '-1') {
                        $("#error_msg").html("Captcha verification failed");
                        $(".error").animate({
                            top: "0"
                        }, 500);
                        valid = true;
                    } else if (data == '0') {
                        $("#error_msg").html("Invalid Username or Password");
                        $("#username_box").addClass('required');
                        $("#password_box").addClass('required');
                        $(".error").animate({
                            top: "0"
                        }, 500);
                        setTimeout(function () {
                            hideAllMessages();
                        }, 5000);
                        valid = false;
                    } else if (data == '1') {
                        window.location = '/publishers/index.php?pg=earn&tab=all_surveys';
                        // console.log("Login successful, redirecting to:", data);
                    } else {
                        $("#error_msg").html("An unexpected error occurred. Please try again.");
                        $(".error").animate({
                            top: "0"
                        }, 500);
                        valid = false;
                    }


                }).fail(function (error) {
                console.log(error);
                resetTurnstileForForm('loginbox');
                $("#error_msg").html("Login failed. Please try again.");
                $(".error").animate({
                    top: "0"
                }, 500);
                setTimeout(hideAllMessages, 5000);
            });
        }

        return valid;
    }


    function send_message() {
        var valid = true;

        // 1. Check for Turnstile captcha token for 'commentForm'
        const captchaToken = $('#commentForm input[name="cf-turnstile-response"]')[0];
        if (!captchaToken || !captchaToken.value) {
            $("#error_msg").html("Please complete the captcha verification");
            $(".error").animate({top: "0"}, 500);
            valid = false;
            setTimeout(hideAllMessages, 5000);
            return false;
        }

        if ($.trim($("#forgot_email").val()) === '') {
            $("#forgot_email").addClass('required');
            valid = false;
        }

        if (valid) {
            $('#qLoverlay').show();
            $.post("lib/scripts/php/action.php", $("#commentForm").serialize(), function(data) {
                data = $.trim(data);
                if (data != "SUCCESS") {
                    resetTurnstileForForm('commentForm');
                    $("#error_msg").html(data);
                    $("#forgot_email").addClass('required');
                    $(".error").animate({
                        top: "0"
                    }, 500);
                    setTimeout(function() {
                        hideAllMessages();
                    }, 5000);
                } else {
                    // The submitted Turnstile token was already consumed server-side to
                    // authorise this request. The success message keeps the same form on
                    // screen, so mint a fresh token before any second recovery attempt,
                    // otherwise it resubmits a spent token -> "Captcha verification failed"
                    // (issue #671).
                    resetTurnstileForForm('commentForm');
                    $("#commentForm")[0].reset();
                    $("#success_msg").html('If there is an account with this email address, a link has been sent to your email. Be sure to check junk/spam or updates folder too.');
                    $("#forgot_email").removeClass('required');
                    $(".success").animate({
                        top: "0"
                    }, 500);
                    setTimeout(function() {
                        hideAllMessages();
                    }, 10000);
                }

            }).fail(function (error) {
                console.error("Forgot password request failed:", error);
                resetTurnstileForForm('commentForm');
                $("#error_msg").html("Password recovery failed. Please try again.");
                $(".error").animate({
                    top: "0"
                }, 500);
                setTimeout(hideAllMessages, 5000);
            });
        }
        return valid;
    }


    $(document).ready(function() {
        $(document).on('focus', '.required', function() {
            $(this).removeClass('required');
            $(this).next('.plus-error').remove();
        });

        var h = $('.error').outerHeight();
        $('.error').css('top', -h); //move element outside viewport

        var h1 = $('.success').outerHeight();
        $('.success').css('top', -h1); //move element outside viewport

        // When message is clicked, hide it
        $('.message').click(function() {
            $(this).animate({
                top: -$(this).outerHeight()
            }, 500);
        });

    });

// ── Next Inline Block ──

var myMessages = ['error', 'success'];

    function hideAllMessages() {
        var messagesHeights = new Array(); // this array will store height for each

        for (i = 0; i < myMessages.length; i++) {
            messagesHeights[i] = $('.' + myMessages[i]).outerHeight();
            $('.' + myMessages[i]).css('top', -messagesHeights[i]); //move element outside viewport
        }
    }



    $(document).ready(function() {

        // Initially, hide them all
        hideAllMessages();

        $('.message').click(function() {
            $(this).animate({
                top: -$(this).outerHeight()
            }, 500);
        });


        var fbCookie = '';

        localStorage.setItem('fbcookie', fbCookie);

    });

// ── Next Inline Block ──

$(document).bind("ajaxSend", function() {

    }).bind("ajaxComplete", function() {
        $('#qLoverlay').hide();
    });

    var currentActiveTab = 'Signup';


    $('.btnLogin').click(function(e) {
        e.preventDefault();
        $('#signup').hide();
        $('#login').show();
        $('#forgot-password').hide();
        currentActiveTab = 'Login';
    });

    $('.btnSignup').click(function(e) {
        e.preventDefault();
        $('#login').hide();
        $('#signup').show();
        $('#forgot-password').hide();
        currentActiveTab = 'Signup';
    });

    $("#forgotpassBtn").click(function(e) {
        e.preventDefault();
        $('#login').hide();
        $('#signup').hide();
        $('#forgot-password').show();
        currentActiveTab = 'ForgotPassword';
    });

    $(".form").keypress(function(e) {
        if (e.which == 13) {
            if (currentActiveTab == 'Login') {
                dologinpopup();
            } else if (currentActiveTab == 'Signup') {
                dosignup();
            }
        }
    });

    // Show additional fields when email field is clicked/focused
    $('#signup_email').on('click focus', function() {
        $('#additional-signup-fields').slideDown(300);
    });
