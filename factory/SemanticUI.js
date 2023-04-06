/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 Toha <tohenk@yahoo.com>
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

class SemanticUIBuilder {

    indentLines(lines, size) {
        const result = lines.split('\n').map(line => {
            if (line.length) {
                line = ' '.repeat(size * 2) + line;
            }
            return line;
        });
        return result.join('\n');
    }

    buildMenu(items, options) {
        options = options || {};
        let result = '';
        let level = options.level || 0;
        let indent = options.indentation || 0;
        Object.keys(items).forEach((id) => {
            const item = items[id];
            const content = this.buildMenuItem(item, id, level);
            if (result.length) result += '\n';
            result += content;
        });
        if (result.length) {
            result = this.indentLines(result, 1);
        }
        let contclass;
        if (options.mainmenu) {
            contclass = 'ui container';
        } else {
            contclass = options.containerclass || 'menu';
        }
        result = `<div class="${contclass}">
${result}
</div>`;
        if (indent > 0) {
            result = this.indentLines(result, indent);
        }
        return result;
    }

    buildMenuItem(item, id, level) {
        let result = '';
        let title = item.title;
        let mclass = 'item';
        if (item.items) {
            mclass = 'ui simple dropdown item';
            if (level > 0) {
                title = '<i class="dropdown icon"></i> ' + title;
            } else {
                title += ' <i class="dropdown icon"></i>';
            }
            title += '\n' + this.buildMenu(item.items, {level: level + 1, indentation: 1});
            title += '\n';
        } else {
            switch (item.type) {
                case 'brand':
                    mclass = 'header item';
                    title = `<img class="logo" src="${item.logo}">
${title}`;
                    break;
                case 'divider':
                    mclass = 'divider';
                    title = '';
                    break;
                case 'header':
                    mclass = 'header';
                    break;
            }
        }
        if (item.class) mclass = item.class + ' ' + mclass;
        mclass = `menu-${id} ${mclass}`;
        const clickable = !item.items && item.url;
        if (clickable) {
            result = `<a href="${item.url}" class="${mclass}">${title}</a>`;
        } else {
            result = `<div class="${mclass}">${title}</div>`;
        }
        return result;
    }

    addPage(page, icon) {
        const result = {};
        result.page = page;
        if (icon) result.icon = icon;
        return result;
    }

    getPager(count, size, page) {
        const result = [];
        const len = 5;
        const half = Math.floor(len / 2);
        let pages = Math.floor(count / size);
        if ((count % size) > 0) pages++;
        if (pages > 1) {
            let c = 0;
            let start = Math.max(1, Math.min(page - half, pages - len < 0 ? 1 : pages));
            if (pages - start < len) start = Math.max(1, pages - len + 1);
            for (let i = start; i <= pages; i++) {
                if (c >= len) break;
                result.push(this.addPage(i));
                c++;
            }
            if (page > 1) {
                result.unshift(this.addPage(page - 1, 'angle left icon'));
            }
            if (start > 1) {
                result.unshift(this.addPage(1, 'angle double left icon'));
            }
            if (page < pages) {
                result.push(this.addPage(++page, 'angle right icon'));
            }
            if (start + c - 1 < pages) {
                result.push(this.addPage(pages, 'angle double right icon'));
            }
        }
        return result;
    }
}

module.exports = new SemanticUIBuilder();