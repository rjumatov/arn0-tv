/*
 * Samsung's built-in screensaver (the moving dots) versus ours: the TV's own saver is a
 * system layer that can appear on top of the launcher's screensaver, costing a second remote
 * press to dismiss. Tizen exposes a per-app context switch for it — webapis.appcommon
 * (Samsung Product API), the same call a video player uses to keep the saver from covering
 * playback. While the launcher is foreground we switch the system saver off and rely on this
 * app's own saver (moving clock, drifting photo) for burn-in protection instead; when the
 * launcher loses visibility the system saver is re-enabled so it reverts with the app.
 *
 * Needs <tizen:privilege name="http://developer.samsung.com/privilege/appcommon.setscreensaver"/>
 * and the $WEBAPIS/webapis/webapis.js script in index.html. If the call throws or is rejected
 * (e.g. the signing path does not grant the privilege, or the dots come from the OLED panel
 * care saver, which this API does not own) the Lab screen surfaces the exact error, so the
 * failure is diagnosable from the TV itself.
 */
(function () {
    'use strict';

    function namespace() {
        try {
            if (typeof webapis === 'undefined') return null;
            return webapis.appcommon || null;
        } catch (e) {
            return null;
        }
    }

    function api() {
        var ac = namespace();
        if (ac && typeof ac.setScreenSaver === 'function' &&
            typeof ac.AppCommonScreenSaverState !== 'undefined') return ac;
        return null;
    }

    function shortErr(err) {
        var o = err && (err.error || err);
        var msg = o && (o.message || o.name || o.code);
        var text = msg ? (o.code ? o.code + ' ' + (o.name || msg) : String(msg)) : JSON.stringify(o || err);
        return String(text).slice(0, 140);
    }

    var ACTIONS = {
        off: function (ac, ok, fail) { ac.setScreenSaver(ac.AppCommonScreenSaverState.SCREEN_SAVER_OFF, ok, fail); },
        on: function (ac, ok, fail) { ac.setScreenSaver(ac.AppCommonScreenSaverState.SCREEN_SAVER_ON, ok, fail); }
    };

    // onResult('ok') | onResult('rejected', text) | onResult('unavailable') | onResult('threw', text)
    function set(what, onResult) {
        var ac = api();
        if (!ac) {
            DevLog.log('system saver: appcommon missing, ' + what + ' unusable');
            if (onResult) onResult('unavailable');
            return;
        }
        try {
            ACTIONS[what](ac, function () {
                DevLog.log('system saver ' + what + ': ok');
                if (onResult) onResult('ok');
            }, function (err) {
                var text = shortErr(err);
                DevLog.log('system saver ' + what + ' rejected: ' + text);
                if (onResult) onResult('rejected', text);
            });
        } catch (e) {
            var text = shortErr(e);
            DevLog.log('system saver ' + what + ' threw: ' + text);
            if (onResult) onResult('threw', text);
        }
    }

    function disable(onResult) { set('off', onResult); }
    function enable(onResult) { set('on', onResult); }

    function start() {
        if (!api()) {
            DevLog.log('system saver: API unavailable (webapis missing or appcommon absent), staying with TV default');
            return;
        }
        // Quiet when accepted, loud when the TV refuses — pair the bench test with the
        // Lab actions, which report every outcome in a toast.
        disable(function (how, text) {
            if (how !== 'ok') UI.toast('Samsung screensaver NOT switched off: ' + (text || how));
        });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) enable(); else disable();
        });
        // Keep re-applying while visible - our TV re-enables the system screensaver almost instantly unless we re-apply it periodically
        setInterval(function () {
            if (!document.hidden) disable();
        }, 60000);
    }

    window.SystemSaver = { start: start, disable: disable, enable: enable };

    // Lab actions: a manual switch plus a probe, so the TV's actual answer is visible without
    // the dev log server.
    window.SystemSaver.actions = function () {
        return [
            { label: 'System screensaver: switch OFF', run: function () {
                disable(function (how, text) {
                    UI.toast('System screensaver → ' + how + (text ? ': ' + text : ''));
                });
            } },
            { label: 'System screensaver: switch ON', run: function () {
                enable(function (how, text) {
                    UI.toast('System screensaver → ' + how + (text ? ': ' + text : ''));
                });
            } },
            { label: 'System screensaver API: probe', run: function () {
                if (typeof webapis === 'undefined') {
                    UI.toast('webapis missing — $WEBAPIS tag did not load');
                    return;
                }
                var ac = namespace();
                if (!ac) {
                    UI.toast('webapis loaded, but appcommon missing');
                    return;
                }
                var v;
                try {
                    v = ac.getVersion();
                } catch (e) {
                    UI.toast('appcommon present, getVersion threw: ' + shortErr(e));
                    return;
                }
                UI.toast('appcommon ready, version ' + (v || 'unknown'));
            } }
        ];
    };
})();
