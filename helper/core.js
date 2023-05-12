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

/**
 * Express core middleware.
 */
class CoreFunctions extends HelperFunctions {
    
    blocks = {}

    initialize() {
        this.exportFn(this.app.locals, this.appFunctions());
        this.exportFn(this.res, this.renderFunctions(), ['render']);
    }

    preApply() {
        this.reset();
    }

    reset() {
        ScriptManager.clear();
        ScriptManager.includeDefaults();
        this.blocks = {};
    }

    finalize() {
        ScriptManager.includeAssets();
    }

    appFunctions() {
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
            block: (name, content) => {
                if (content === undefined) {
                    return this.blocks[name] ? this.blocks[name] : '';
                } else {
                    this.blocks[name] = content;
                }
            },
            script: ScriptManager,
            scripts: () => ScriptManager.getContent(),
            javascripts: () => {
                this.finalize();
                return ScriptManager.getAssets(ScriptAsset.JAVASCRIPT);
            },
            stylesheets: () => {
                this.finalize();
                return ScriptManager.getAssets(ScriptAsset.STYLESHEET);
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

    renderFunctions() {
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
                    Object.assign(values, this.blocks, this.res.locals);
                    this.app.render(`layout/${layout}`, values, (err, str) => {
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