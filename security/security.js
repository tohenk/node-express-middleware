/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2018-2020 Toha <tohenk@yahoo.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const debug = require('debug')('middleware:security');

/**
 * Express security middleware.
 */
class Security {

    /**
     * Handle security context.
     *
     * @param {Object} options Options
     */
    handle(options) {
        options = options || {};
        const loginroute = options.loginroute || '/login';
        const logoutroute = options.logoutroute || '/logout';
        return (req, res, next) => {
            this.applySecurity(req, res);
            const path = req.originalUrl;
            // skip security on login or logout route
            if (path.indexOf(loginroute) === 0 || path.indexOf(logoutroute) === 0) {
                debug(`Continue to login or logout route`);
                return next();
            }
            // skip if user already uthenticated
            if (req.session.user.authenticated) {
                debug(`Continue, already authenticated`);
                return next();
            }
            if (req.xhr) {
                return res.sendStatus(401);
            }
            debug(`Redirect to login route`);
            res.redirect(loginroute + '?r=' + path);
        }
    }

    /**
     * Apply security handler.
     *
     * @param {Object} req Request object
     * @param {Object} res Response object
     * @returns {Security}
     */
    applySecurity(req, res) {
        const app = req.app;
        if (!req.session.user) {
            req.session.user = {};
        }
        app.user = {
            authenticate: (username, password) => {
                if (typeof app.authenticate == 'function') {
                    return app.authenticate(username, password);
                }
                throw new Error('Application authenticate is not set');
            },
            isAuthenticated: () => {
                return req.session.user.authenticated;
            },
            login: () => {
                req.session.user.authenticated = true;
            },
            logout: () => {
                req.session.user.authenticated = false;
            }
        }
        res.user = req.user = app.user;
        app.locals.user = req.session.user;
        return this;
    }

    /**
     * Create an instance.
     *
     * @returns {Security}
     */
    static create() {
        if (!Security.instance) Security.instance = new this();
        return Security.instance;
    }
}

module.exports = (options) => Security.create().handle(options);