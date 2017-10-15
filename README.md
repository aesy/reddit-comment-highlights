![](img/Logo.png)

A Chrome extension that highlights unread comments on [Reddit](https://www.reddit.com) since your last visit. A feature normally reserved to Reddit gold users!

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jeodebnjeecpbmbgimbpinccfkihhjid.svg?style=flat)](https://chrome.google.com/webstore/detail/jeodebnjeecpbmbgimbpinccfkihhjid)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/jeodebnjeecpbmbgimbpinccfkihhjid.svg?style=flat)](https://chrome.google.com/webstore/detail/jeodebnjeecpbmbgimbpinccfkihhjid)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/rating/jeodebnjeecpbmbgimbpinccfkihhjid.svg?style=flat)](https://chrome.google.com/webstore/detail/jeodebnjeecpbmbgimbpinccfkihhjid)
[![Travis](https://img.shields.io/travis/aesy/chrome-reddit-comment-highlights.svg?style=flat)](https://travis-ci.org/aesy/chrome-reddit-comment-highlights)
[![Code Climate](https://api.codeclimate.com/v1/badges/58c163ade1cb44a6c8c2/maintainability)](https://codeclimate.com/github/aesy/chrome-reddit-comment-highlights)
[![xo code style](https://img.shields.io/badge/code%20style-%20XO-67d5c5.svg?style=flat)](https://github.com/sindresorhus/xo)
[![MIT license](https://img.shields.io/github/license/aesy/chrome-reddit-comment-highlights.svg?style=flat)](https://github.com/aesy/chrome-reddit-comment-highlights/blob/master/LICENSE)

### Features
* Lightweight
* Customizable
* Syncs across chrome sessions
* Requires minimal permissions
* Works well with [chrome-reddit-liveupdate](https://github.com/aesy/chrome-reddit-liveupdate)
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
A minimum Chrome version of 32 is required because of the use of [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) without a [polyfill](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill).

### Contribute
Use the [issue tracker](https://github.com/aesy/chrome-reddit-comment-highlights/issues) to report bugs or make feature requests.
Pull requests are welcome, just make sure compiliation still works (`npm run build:prod`) 
and that linting pass without errors (`npm run lint`) beforehand.

### Issues
- Reset button on options page doesn't reset view if no options were changed

### License
chrome-reddit-comment-highlights is licensed under the MIT License (see [LICENSE](./blob/master/LICENSE) file).
