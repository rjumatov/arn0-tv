/*
 * Tile styling per brand. `match` is tested against "<name> <id>" of an installed app.
 * `mark` is a file in img/marks/; the build recolours it in `fg` (img/tiles/<key>.svg), shown over `bg`.
 * `text` instead of `mark` draws a typographic logo (for brands without an available mark).
 * `pad` optionally overrides the mark's [vertical, horizontal] inset in % of the tile (default [26, 22]).
 */
window.BRANDS = [
    { key: 'youtube', match: /youtube|tizentube|cobalt-yt|bvH\.tizenbrew/i, mark: 'vanced', bg: '#17181d', fg: '#FF0033' },
    { key: 'netflix', match: /netflix/i, mark: 'netflix', bg: '#141414', fg: '#e50914' },
    { key: 'internet', match: /internet|browser/i, mark: 'internet', bg: '#17181d', fg: '#1aa0e0' },
    { key: 'tizenbrewinstaller', match: /s1bTI\.tizenbrew/i, mark: 'tizenbrewinstaller', bg: '#17181d', fg: '#0DC1E9' }
];

window.findBrand = function (keyOrApp) {
    if (typeof keyOrApp === 'string') {
        return window.BRANDS.find(function (b) { return b.key === keyOrApp; }) || null;
    }
    var text = (keyOrApp.name || '') + ' ' + (keyOrApp.id || '');
    return window.BRANDS.find(function (b) { return b.match && b.match.test(text); }) || null;
};
