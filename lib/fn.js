/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2023-2025 Toha <tohenk@yahoo.com>
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

const debug = require('debug')('middleware:fn');

class HelperFunctions {
    
    exports = []

    constructor(res) {
        this.res = res;
        this.app = res.app;
        this.initialize();
    }

    initialize() {
    }

    exportFn(target, fn, options = {}) {
        this.exports.push([target, fn, options]);
    }

    apply() {
        this.preApply();
        this.exports.forEach(fn => {
            this.applyFn(fn[0], fn[1], fn[2]);
        });
    }

    applyFn(target, fn, options = {}) {
        if (Array.isArray(options.saves)) {
            options.saves.forEach(name => {
                const savedName = '_' + name;
                if (!target[savedName]) {
                    target[savedName] = target[name];
                }
            });
        }
        fn = typeof fn === 'function' ? fn() : fn;
        Object.keys(fn).forEach(name => {
            if (!target[name] || options.force || (Array.isArray(options.saves) && options.saves.indexOf(name) >= 0)) {
                debug(`Apply ${name}`);
                target[name] = fn[name];
            }
        });
    }

    preApply() {
    }
}

module.exports = HelperFunctions;