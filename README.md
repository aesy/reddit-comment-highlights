![](img/Logo.png)

A Chrome extension that highlights unread comments on [Reddit](https://www.reddit.com) since your last visit.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jeodebnjeecpbmbgimbpinccfkihhjid.svg?maxAge=2592000)](https://chrome.google.com/webstore/detail/reddit-au-comment-highlig/jeodebnjeecpbmbgimbpinccfkihhjid)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/jeodebnjeecpbmbgimbpinccfkihhjid.svg?maxAge=2592000)](https://chrome.google.com/webstore/detail/reddit-au-comment-highlig/jeodebnjeecpbmbgimbpinccfkihhjid)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/rating/jeodebnjeecpbmbgimbpinccfkihhjid.svg?maxAge=2592000)](https://chrome.google.com/webstore/detail/reddit-au-comment-highlig/jeodebnjeecpbmbgimbpinccfkihhjid)
[![Travis](https://img.shields.io/travis/easyfuckingpeasy/chrome-reddit-comment-highlights.svg)](https://travis-ci.org/easyfuckingpeasy/chrome-reddit-comment-highlights)
[![bitHound Overall Score](https://www.bithound.io/github/easyfuckingpeasy/chrome-reddit-comment-highlights/badges/score.svg)](https://www.bithound.io/github/easyfuckingpeasy/chrome-reddit-comment-highlights)
[![xo code style](https://img.shields.io/badge/code%20style-%20XO-67d5c5.svg)](https://github.com/sindresorhus/xo)

### Features
* Lightweight
* Customizable
* Syncs across chrome sessions
* Requires minimal permissions

###Screenshots

![](img/Screenshot_highlight.png) |
--------------------------------- |
Highlighted comments              |

![](img/Screenshot_options.png)   |
--------------------------------- |
Options page                      |

### Reddit Enhancement Suite (RES)
If you are a [RES](https://redditenhancementsuite.com/)-user and want a different look in night-mode, you can achieve this by using Custom CSS.
Here's an example of what you could use:

```css
.comment.highlight > .entry .md {
    padding: 2px;
    border: 1px dotted #CCCCCC;
    border-radius: 2px;
    background-color: #fffdcc;
}

.res-nightmode .comment.highlight > .entry .md {
    background-color: #424242;
}
```

###Support
A minimum Chrome version of 32 is required because of the use of [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) without a [polyfill](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill).

###Contribute
Please use the [issue tracker](https://github.com/easyfuckingpeasy/chrome-reddit-comment-highlights/issues) to report bugs or feature requests.
Pull requests are welcome, but please make sure compiliation still works (`npm run build:prod`) and lint (`npm run lint`) beforehand.

### License
chrome-reddit-comment-highlights is licensed under the MIT License (see [LICENSE](./blob/master/LICENSE) file).