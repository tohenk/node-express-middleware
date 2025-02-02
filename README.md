# Nodejs Express Middleware

Nodejs Express Middleware is a set of middlewares build for
[Expressjs](https://expressjs.com) aimed at:

* Support layout rendering.
* Provide block and slot mechanism to include views in Expressjs
  (`block` and `slot` helper).
* Provide [NODE-NTJS](https://github.com/tohenk/node-ntjs) script integration
  (`script`, `scripts`, `javascripts`, `stylesheets`, and `jsloader` helper).
* Provide menu builder (`menu` helper).
* Provide pager builder (`pager` helper).
* Provide a simple security to Expressjs routes (`user` helper).

## Expressjs Integration

Here is a typical usage in Expressjs app.

```js
// app.js

const { ScriptManager, ScriptAsset } = require('@ntlab/ntjs');
const { Helper, Security } = require('@ntlab/express-middleware');

// register script repository
require('@ntlab/ntjs-repo')();

// security
app.use(Security.core({}));

// app helpers
app.use(Helper.core());
app.use(Helper.menu());
app.use(Helper.pager());

ScriptManager.addDefault('SemanticUI');
ScriptManager.addAsset(ScriptAsset.STYLESHEET, 'app.css');

// relative from layout
app.slots = {
  mainmenu: {
    view: '../slot/mainmenu'
  }
};
```

```js
<%# mainmenu.ejs %>

<% menus = {
    branding: {
        type: 'brand',
        title: apptitle,
        logo: '/images/logo.png',
        url: '/'
    },
    tasks: {
        title: 'Tasks',
        class: 'right floated',
        items: {
            about: {
                title: 'About'
            }
        }
    }
} %>
<% if(user.authenticated) {
    Object.assign(menus.tasks.items, {
        divider1: {
            type: 'divider'
        },
        profile: {
            title: 'Profile'
        }
    });
} %>
<%- menu(menus, {mainmenu: true, indentation: 2}) %>
<% script.create('JQuery')
  .useDependencies(['SemanticUI/Dialog/Message'])
  .addMiddle(`
$.tasks = {
    about() {
        $.ntdlg.message('task-about', 'About', 'About App Message', $.ntdlg.ICON_INFO);
    },
    profile() {
        $.ntdlg.message('task-profile', 'Howdy', 'Welcome User', $.ntdlg.ICON_INFO);
    },
    init() {
        const self = this;
        $('.menu-about').on('click', function(e) {
            e.preventDefault();
            self.about();
        });
        $('.menu-profile').on('click', function(e) {
            e.preventDefault();
            self.profile();
        });
    }
}
`).addLast(`
$.tasks.init();
`); %>
```

## Example Usage

Nodejs Express Middleware is heavily used by [NODE-SMS-TERMINAL](https://github.com/tohenk/node-sms-terminal/blob/master/ui/app.js)
and [NODE-SMS-GATEWAY](https://github.com/tohenk/node-sms-gateway/blob/master/ui/app.js).