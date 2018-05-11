![](img/Logo.png)

A browser extension that highlights unread comments on [Reddit](https://www.reddit.com) since your last visit. A feature normally reserved to Reddit gold users!

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jeodebnjeecpbmbgimbpinccfkihhjid.svg?style=flat)](https://chrome.google.com/webstore/detail/jeodebnjeecpbmbgimbpinccfkihhjid)
[![Mozilla Add-on](https://img.shields.io/amo/v/reddit-comment-highlights.svg)](https://addons.mozilla.org/firefox/addon/reddit-comment-highlights/)
[![Travis](https://img.shields.io/travis/aesy/reddit-comment-highlights.svg?style=flat)](https://travis-ci.org/aesy/reddit-comment-highlights)
[![Code Climate](https://api.codeclimate.com/v1/badges/de8d64dcf4384aee9014/maintainability)](https://codeclimate.com/github/aesy/reddit-comment-highlights)
[![xo code style](https://img.shields.io/badge/code%20style-%20XO-67d5c5.svg?style=flat)](https://github.com/sindresorhus/xo)
[![MIT license](https://img.shields.io/github/license/aesy/reddit-comment-highlights.svg?style=flat)](https://github.com/aesy/reddit-comment-highlights/blob/master/LICENSE)

#### Notice: The extension is currently broken due to Reddits UI redesign. Any help would be appreciated as the main maintainer [aesy](https://github.com/aesy/) won't find time to fix it until later this summer, *especially* if you have experience with the react internals. Please see the issues page if you want to help us out!

### Features
* Lightweight
* Customizable
* Syncs across browser sessions
* Requires minimal permissions
* Supports [RES (Reddit Enhancement Suite)](https://redditenhancementsuite.com/) night mode
* Supports custom CSS

### Screenshots
![](img/Screenshot_highlight.png) |
--------------------------------- |
Highlighted comments              |

![](img/Screenshot_options.png)   |
--------------------------------- |
Options page                      |

### Support
| Chrome | Firefox |
|:------:|:-------:|
| 32+    | 53+     |

### Contribute
Use the [issue tracker](https://github.com/aesy/reddit-comment-highlights/issues) to report bugs or make feature requests.
Pull requests are welcome, just make sure compiliation still works (`npm run build:prod`) 
and that linting pass without errors (`npm run lint`) beforehand.

### Issues
- Reset button on options page doesn't reset view if no options were changed

### License
reddit-comment-highlights is licensed under the MIT License (see [LICENSE](./blob/master/LICENSE) file).
