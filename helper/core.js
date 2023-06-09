/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2018-2023 Toha <tohenk@yahoo.com>
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

const path = require('path');
const Helper = require('../lib/helper');
const HelperFunctions = require('../lib/fn');
const { ScriptManager, ScriptAsset } = require('@ntlab/ntjs');
const Stringify = require('@ntlab/ntlib/stringify');
const debug = require('debug')('middleware:core');

/**
 * Express core middleware.
 */
class CoreFunctions extends HelperFunctions {

    initialize() {
        this.exportFn(this.app.locals, () => this.appFunctions());
        this.exportFn(this.res.locals, () => this.blockFunctions());
        this.exportFn(this.res.locals, () => this.scriptFunctions());
        this.exportFn(this.res, () => this.renderFunctions(), {saves: ['render']});
    }

    preApply() {
    }

    appFunctions() {
        debug(`App helper for ${this.res.req.originalUrl}`);
        return {
            apptitle: this.app.title,
            stringify: (object, level = 0) => {
                return Stringify.from(object, level);
            },
            slot: name => {
                if (this.app.slots) {
                    let slot = this.app.slots[name];
                    if (slot) {
                        if (typeof slot === 'object') {
                            if (false === slot.enabled) {
                                delete slot.enabled;
                                return;
                            }
                            if (slot.view) {
                                slot = slot.view;
                            }
                        }
                        return slot;
                    }
                }
            },
            jsloader: assets => {
                const loader = require('@ntlab/ntjs/Loader').instance().getScript();
                const queues = Stringify.from(assets);
                return `<script type="text/javascript">
${loader}
// load all assets
document.ntloader.load(${queues});
</script>
    `;
            }
        }
    }

    scriptFunctions() {
        debug(`Script helper for ${this.res.req.originalUrl}`);
        this.res.script = ScriptManager.newInstance();
        return {
            script: this.res.script,
            scripts: () => {
                debug(`Include script for ${this.res.req.originalUrl}`);
                return this.res.script.getContent();
            },
            javascripts: () => {
                debug(`Include javascript for ${this.res.req.originalUrl}`);
                return this.res.script
                    .includeAssets()
                    .getAssets(ScriptAsset.JAVASCRIPT);
            },
            stylesheets: () => {
                debug(`Include stylesheet for ${this.res.req.originalUrl}`);
                return this.res.script
                    .includeAssets()
                    .getAssets(ScriptAsset.STYLESHEET);
            }
        }
    }

    blockFunctions() {
        debug(`Block helper for ${this.res.req.originalUrl}`);
        this.res.blocks = {};
        return {
            block: (name, content) => {
                if (content === undefined) {
                    return this.res.blocks[name] ? this.res.blocks[name] : '';
                } else {
                    this.res.blocks[name] = content;
                }
            }
        }
    }

    renderFunctions() {
        debug(`Render helper for ${this.res.req.originalUrl}`);
        return {
            render: (view, options) => {
                options = options || {};
                if (this.res.locals.viewdir) {
                    view = path.join(this.res.locals.viewdir, view);
                }
                this.res._render(view, options, (err, str) => {
                    if (err) {
                        return this.res.req.next(err);
                    }
                    this.res.renderLayout(str, options);
                });
            },
            renderLayout: (content, options) => {
                let layout = this.res.req.xhr ? 'xhr' : 'default';
                if (this.res.locals.layout !== undefined) {
                    layout = this.res.locals.layout;
                } else if (this.app.locals.layout !== undefined) {
                    layout = this.app.locals.layout;
                }
                let title = options.title || '';
                let sitetitle = this.app.title;
                if (title) {
                    sitetitle = `${title} &ndash; ${sitetitle}`;
                }
                if (false !== layout) {
                    const values = {
                        sitetitle: sitetitle,
                        title: title,
                        content: content
                    }
                    Object.assign(values, this.res.blocks, this.res.locals);
                    this.res._render(`layout/${layout}`, values, (err, str) => {
                        if (err) {
                            return this.res.req.next(err);
                        }
                        this.res.send(str);
                    });
                } else {
                    this.res.send(str);
                }
            }
        }
    }
}

const helper = new Helper(CoreFunctions);

module.exports = options => helper.handle(options);