# tester

This blueprint is based on the blueprint of Veams-Components.

## Usage

### Include: Page

``` hbs
{{! @INSERT :: START @id: tester, @tag: global-partial }}
{{#with tester-bp}}
	{{> stester}}
{{/with}}
{{! @INSERT :: END }}
```

### Include: SCSS

``` scss
// @INSERT :: START @tag: scss-import //
@import "globals/_stester";
// @INSERT :: END
```

### Include: JavaScript

#### Import
``` js
// @INSERT :: START @tag: js-import //
import Tester from './modules/tester/tester';
// @INSERT :: END
```

#### Initializing in Veams V2
``` js
// @INSERT :: START @tag: js-init-v2 //
/**
 * Init Tester
 */
Helpers.loadModule({
	el: '[data-js-module="tester"]',
	module: Tester,
	context: context
});
// @INSERT :: END
```

#### Initializing in Veams V3
``` js
// @INSERT :: START @tag: js-init-v3 //
/**
 * Init Tester
 */
Helpers.loadModule({
	domName: 'tester',
	module: Tester,
	context: context
});
// @INSERT :: END
```

#### Custom Events
``` js
// @INSERT :: START @tag: js-events //
/**
 * Events for Tester
 */
EVENTS.tester = {
	eventName: 'tester:eventName'
};
// @INSERT :: END
```
