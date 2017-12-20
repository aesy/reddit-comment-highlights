const apis = [
	'alarms',
	'bookmarks',
	'browserAction',
	'commands',
	'contextMenus',
	'cookies',
	'downloads',
	'events',
	'extension',
	'extensionTypes',
	'history',
	'i18n',
	'idle',
	'notifications',
	'pageAction',
	'runtime',
	'storage',
	'tabs',
	'webNavigation',
	'webRequest',
	'windows'
];

function Extension() {
	for (const api of apis) {
		try {
			if (chrome[api]) {
				this[api] = chrome[api];
				continue;
			}
		} catch (e) {}

		try {
			if (window[api]) {
				this[api] = window[api];
				continue;
			}
		} catch (e) {}

		try {
			if (browser[api]) {
				this[api] = browser[api];
				continue;
			}
		} catch (e) {}

		this[api] = null;
	}
}

// Only one instance of this class needed
export default new Extension();
