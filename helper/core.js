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

const path = require('path');
const { ScriptManager, ScriptAsset } = require('@ntlab/ntjs');

/**
 * Express core middleware.
 */
class CoreHelper {

    blocks = {}
    finalized = false

    /**
     * Handle core helper.
     *
     * @param {Object} options Options
     */
    handle(options) {
        return (req, res, next) => {
            this.applyAppHelper(req.app);
            this.applyHelper(req, res);
            next();
        }
    }

    applyAppHelper(app) {
        if (!app.locals.apptitle) {
            app.locals.apptitle = app.title;
        }
        if (!app.locals.slot) {
            app.locals.slot = (name) => {
                if (app.slots) {
                    var slot = app.slots[name];
                    if (slot) {
                        if (typeof slot == 'object') {
                            if (false == slot.enabled) {
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
            }
        }
        if (!app.locals.block) {
            app.locals.block = (name, content) => {
                if (content == undefined) {
                    return this.blocks[name] ? this.blocks[name] : '';
                } else {
                    this.blocks[name] = content;
                }
            }
        }
        if (!app.locals.script) {
            app.locals.script = ScriptManager;
        }
        if (!app.locals.scripts) {
            app.locals.scripts = () => {
                return ScriptManager.getContent();
            }
        }
        if (!app.locals.javascripts) {
            app.locals.javascripts = () => {
                this.finalizeVars();
                return ScriptManager.getAssets(ScriptAsset.JAVASCRIPT);
            }
        }
        if (!app.locals.stylesheets) {
            app.locals.stylesheets = () => {
                this.finalizeVars();
                return ScriptManager.getAssets(ScriptAsset.STYLESHEET);
            }
        }
        if (!app.locals.jsloader) {
            app.locals.jsloader = (assets) => {
                const loader = require('@ntlab/ntjs/Loader').instance().getScript();
                const queues = JSON.stringify(assets, null, 4);
                return `<script type="text/javascript">
//<![CDATA[
${loader}
// load all assets
document.ntloader.load(${queues});
//]]>
</script>
`;
            }
        }
    }

    applyHelper(req, res) {
        this.resetVars();
        if (!res._render) {
            res._render = res.render;
            res.render = (view, options) => {
                options = options || {};
                if (res.locals.viewdir) view = path.join(res.locals.viewdir, view);
                res._render(view, options, (err, str) => {
                    if (err) {
                        return res.req.next(err);
                    }
                    res.renderLayout(str, options);
                });
            }
        }
        if (!res.renderLayout) {
            res.renderLayout = (content, options) => {
                let layout = req.xhr ? 'xhr' : 'default';
                if (res.locals.layout !== undefined) {
                    layout = res.locals.layout;
                } else if (res.app.locals.layout !== undefined) {
                    layout = res.app.locals.layout;
                }
                let title = options.title || '';
                let sitetitle = res.app.title;
                if (title) sitetitle = `${title} &ndash; ${sitetitle}`;
                if (false !== layout) {
                    const values = {
                        sitetitle: sitetitle,
                        title: title,
                        content: content
                    }
                    Object.assign(values, this.blocks);
                    res.app.render(`layout/${layout}`, values, (err, str) => {
                        if (err) {
                            return res.req.next(err);
                        }
                        res.send(str);
                    });
                } else {
                    res.send(str);
                }
            }
        }
    }

    resetVars() {
        ScriptManager.clear();
        ScriptManager.includeDefaults();
        this.blocks = {};
        this.finalized = false;
    }

    finalizeVars() {
        if (!this.finalized) {
            this.finalized = true;
            ScriptManager.includeAssets();
        }
    }

    /**
     * Create an instance.
     *
     * @returns {CoreHelper}
     */
    static create() {
        if (!CoreHelper.instance) CoreHelper.instance = new this();
        return CoreHelper.instance;
    }
}

module.exports = (options) => CoreHelper.create().handle(options);