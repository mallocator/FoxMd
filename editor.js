var atomShell = false;
try {
    process;
    atomShell = true;
} catch (e) {}


var preferences = {
    focus: true,
    center: 0.5,
    pinStructure: false,
    pinStats: false,
    set: function(prop, value) {
        preferences[prop] = value;
        window.localStorage.setItem('preferences', JSON.stringify(preferences));
    },
    get: function(prop, def) {
        return preferences[prop] === undefined ? def : preferences[prop];
    },
    init: function() {
        var serialized = window.localStorage.getItem('preferences');
        if (serialized && serialized.length) {
            $.extend(preferences, JSON.parse(serialized));
        }
    }
};

var structure = {
    elem: null,
    hovering: false,
    init: function() {
        structure.elem = $('#structure');
        structure.pin(preferences.get('pinStructure'));
    },
    mouseMoveHandler: function(event) {
        if (event.clientX < 50) {
            structure.elem.show('slide', {direction: 'left'});
        }
    },
    mouseInHandler: function(event) {
        structure.hovering = true;
        event.stopPropagation();
    },
    pin: function(enabled) {
        preferences.set('pinStructure', enabled);
        if (enabled) {
            structure.elem.find('img').addClass('selected');
            $(document).off('mousemove', this.mouseMoveHandler);
            structure.elem.off('mouseover', this.mouseInHandler);
            structure.elem.show('slide', {direction: 'left'});
        } else {
            structure.elem.find('img').removeClass('selected');
            $(document).on('mousemove', this.mouseMoveHandler);
            structure.elem.on('mouseover', this.mouseInHandler);
            structure.elem.hide('slide', {direction: 'left'});
        }
    }
};

var stats = {
    elem: null,
    hovering: false,
    init: function() {
        stats.elem = $('#stats');
        stats.pin(preferences.get('pinStats'));
    },
    mouseMoveHandler: function (event) {
        if (event.clientX > window.innerWidth - 50) {
            stats.elem.show('slide', {direction: 'right'});
        }
    },
    mouseInHandler: function (event) {
        stats.hovering = true;
        event.stopPropagation();
    },
    pin: function (enabled) {
        preferences.set('pinStats', enabled);
        if (enabled) {
            stats.elem.find('img').addClass('selected');
            $(document).off('mousemove', this.mouseMoveHandler);
            stats.elem.off('mouseover', this.mouseInHandler);
            stats.elem.show('slide', {direction: 'right'});
        } else {
            stats.elem.find('img').removeClass('selected');
            $(document).on('mousemove', this.mouseMoveHandler);
            stats.elem.on('mouseover', this.mouseInHandler);
            stats.elem.hide('slide', {direction: 'right'});
        }
    }
};

var actions = {
    elem: null,
    hovering: false,
    init: function () {
        actions.elem = $('#bar');
        $(document).on('mousemove', this.mouseMoveHandler);
        actions.elem.on('mouseover', this.mouseInHandler);
        if (!atomShell) {
            $('#searchBox').hide();
        }
        actions.center();
        actions.focus();
    },
    mouseMoveHandler: function (event) {
        if (event.clientY < 50 && event.clientX > 185 && event.clientX < window.innerWidth - 165) {
            actions.elem.show('slide', {direction: 'up'});
        }
    },
    mouseInHandler: function (event) {
        actions.hovering = true;
        event.stopPropagation();
    },
    center: function (amount) {
        editor.elem.focus();
        if (amount) {
            preferences.set('center', amount);
        } else{
            amount = preferences.get('center');
        }
        editor.center();
        $('#centerSetting .selected').removeClass('selected');
        if (amount == 0) {
            $('#centerNone').addClass('selected');
        } else if (amount < 0.45) {
            $('#centerTop').addClass('selected');
        } else if (amount < 0.55) {
            $('#centerMiddle').addClass('selected');
        } else {
            $('#centerBottom').addClass('selected');
        }
    },
    focus: function () {
        var button = $('#focusSetting img');
        if (button.hasClass('selected')) {
            button.removeClass('selected');
            preferences.set('focus', false);
        } else {
            button.addClass('selected');
            preferences.set('focus', true);
        }
        editor.focus();
    },
    user: function () {
        // TODO open user dialog
    },
    about: function () {
        // TODO open about dialog
    },
    search: function (event) {
        event.preventDefault();
    }
};

var markdown = {
    startPatterns: {
        h1: /^# (.*)$/gm,
        h2: /^## (.*)$/gm,
        h3: /^### (.*)$/gm,
        h4: /^#### (.*)$/gm,
        h5: /^##### (.*)$/gm,
        h6: /^###### (.*)$/gm,
        hr: /^\* \*() \*$/gm,
        p: /^([\s]*[^<\s].*)$/gm
    },
    inlinePatterns: {
        strong: /\*([^\*]*)\*/g,
        em: /_([^_]*)_/g
    },
    convertLists: function (content) {
        var previousType = null;
        return content.replace(/^(.*)$/gm, function (match, p1) {
            var listType;
            var result = "";
            if (p1.match(markdown.startPatterns['hr'])) {
                previousType = null;
                return p1;
            }
            if (p1.match(/^\* /m)) {
                listType = 'ul';
            }
            if (p1.match(/^[0-9]+\. /m)) {
                listType = 'ol';
            }
            if (listType != previousType) {
                result += "</" + previousType + ">"
                if (listType != null) {
                    result += "<" + listType + ">";
                }
                previousType = listType;
            }
            if (listType != null) {
                return result + "<li>" + p1.replace(/^(\*|([0-9]+\.)) /, '') + "</p1>";
            } else {
                return result + p1;
            }
        });
    },
    convert: function (content) {
        if (!content) {
            return;
        }
        content = markdown.convertLists(content);
        for (var tag in markdown.startPatterns) {
            content = content.replace(markdown.startPatterns[tag], "<" + tag + ">$1</" + tag + ">")
        }
        for (var tag in markdown.inlinePatterns) {
            content = content.replace(markdown.inlinePatterns[tag], "<" + tag + ">$1</" + tag + ">")
        }
        return content;
    }
};

var inplace = {
    convert: function(event) {
        switch (event.keyCode) {
            case 8:
                inplace.backspace(event);
                break;
            case 108:
            case 13:
                inplace.newline(event);
                break;
            default:
                inplace.detectAtStart();
                inplace.detectInline();
        }
    },
    startPattern: /^(\*|\-|[0-9]+\.|#+)\s/,
    detectAtStart: function() {
        var s = window.getSelection();
        if (s.rangeCount && s.focusOffset < 10) {
            var range = s.getRangeAt(0);
            var anchor = $('<a><br /></a>');
            range.insertNode(anchor[0]);
            var node = $(s.focusNode).closest('p');
            if (node.length && node.html().replace(/<\/?[^a]+>/g, '').indexOf('<a>') < 10) {
                 if(inplace.startPattern.test(node.text())) {
                    inplace.convertAtStart(anchor);
                    anchor = editor.elem.find('a');
                    var range = document.createRange();
                    range.setStartBefore(anchor[0]);
                    range.collapse(true);
                    s.removeAllRanges();
                    s.addRange(range);
                }
            }
            anchor.remove();
        }
    },
    startMasks: [{
            match: /^#(?:\s|&nbsp;)/,
            start: '<h1 class="focused">',
            end: '</h1>'
        }, {
            match: /^##(?:\s|&nbsp;)/,
            start: '<h2 class="focused">',
            end: '</h2>'
        }, {
            match: /^###(?:\s|&nbsp;)/,
            start: '<h3 class="focused">',
            end: '</h3>'
        }, {
            match: /^####(?:\s|&nbsp;)/,
            len: 5,
            start: '<h4 class="focused">',
            end: '</h4>'
        }, {
            match: /^#####(?:\s|&nbsp;)/,
            start: '<h5 class="focused">',
            end: '</h5>'
        }, {
            match: /^######(?:\s|&nbsp;)/,
            start: '<h6 class="focused">',
            end: '</h6>'
        }, {
            match: /^\*(?:\s|&nbsp;)(?!(\*|$))/m,
            start: '<ul class="focused"><li>',
            end: '</li></ul>'
        }, {
            match: /^[0-9]+\.(?:\s|&nbsp;)/,
            start: '<ol class="focused"><li>',
            end: '</li></ol>'
        }
    ],
    convertAtStart: function(anchor) {
        var s = window.getSelection();
        var node = $(s.focusNode).closest('p');
        var content = node.html();
        for (var i in inplace.startMasks) {
            var mask = inplace.startMasks[i];
            var match = mask.match.exec(content);
            if (match) {
                node.replaceWith(mask.start + content.substr(match[0].length) + mask.end);
                break;
            }
        }
    },
    detectInline: function() {
        var s = window.getSelection();
        if (!s.focusOffset) {
            return;
        }
        var char = s.focusNode.data.charAt(s.focusOffset - 1);
        if (char != '_' && char != '*') {
            return;
        }
        if (s.rangeCount) {
            var range = s.getRangeAt(0);
            var anchor = $('<a></a>');
            range.insertNode(anchor[0]);
            var parent = $(s.focusNode).parent();
            var content = parent.html();
            content = content.replace(/\*((?:\w|\s|<|>|&|;)+)\*/g, '<strong>$1</strong>');
            content = content.replace(/_((?:\w|\s|<|>|&|;)+)_/g, '<em>$1</em>');
            parent.html(content);
            anchor = editor.elem.find('a');
            var range = document.createRange();
            range.setStartBefore(anchor[0]);
            range.collapse(true);
            s.removeAllRanges();
            s.addRange(range);
            anchor.remove();
        }
    },
    newline: function(event) {
        var br = editor.elem.find('br');
        if (br.length) {
            if (br.parent().is(editor.elem)) {
                br.wrap('<p class="focused">');
            } else {
                var parent = br.closest('#editor > *');
                if (parent.is('font, div, span')) {
                    var content = parent.html();
                    parent.replaceWith('<p class="focused">' + content + '</p>')
                    br = editor.elem.find('br');
                }
            }
            var s = window.getSelection();
            var range = document.createRange();
            range.setStartBefore(br[0]);
            range.collapse(true);
            s.removeAllRanges();
            s.addRange(range);
            return;
        }

        debugger;
        // TODO detect empty new line (after list)
    },
    backspace: function(event) {
        //debugger;
    }
};

var editor = {
    elem: null,
    medium: null,
    init: function() {
        editor.elem = $('#editor');
        function clearTools(event) {
            if (!preferences.get('pinStructure') && structure.elem) {
                structure.elem.hide('slide', {direction: 'left'});
            }
            if (!preferences.get('pinStats') && stats.elem) {
                stats.elem.hide('slide', {direction: 'right'});
            }
            if (event.clientY > 50 && actions.elem) {
                actions.elem.hide('slide', {direction: 'up'});
            }
        }
        editor.elem.on('mousemove', clearTools);
        editor.elem.on('keyup', editor.cleanUp);
        editor.elem.on('keyup', inplace.convert);
        editor.elem.on('keydown keyup focus click', editor.focus);
        editor.elem.on('keyup focus click', editor.center);
        editor.elem.focus();
        editor.center();
    },
    load: function(data) {
        structure.init();
        stats.init();
        actions.init();
        metaInfo.init();
        editor.elem.html(markdown.convert(data));
        metaInfo.buildStructure();
        metaInfo.buildStats();
        editor.elem.show();
        editor.elem.focus();
        document.execCommand('selectAll',false,null)
        editor.center();
    },
    cleanUp: function(event) {
        editor.elem.find('span, div, font').each(function(i, elem) {
            elem = $(elem);
            var content = elem.html();
            var parent = elem.parent();
            elem.detach();
            parent.append(' ' + content);
        });
    },
    focused: null,
    focus: function() {
        if (editor.focused && editor.focused.length) {
            editor.focused.removeClass('focused');
        }
        if (preferences.get('focus')) {
            editor.elem.removeClass('focused');
            editor.focused = $(window.getSelection().focusNode).closest('p, ol, ul, h1, h2, h3, h4, h5, h6').addClass('focused');
        } else {
            editor.elem.addClass('focused');
        }
    },
    getCaretPosition: function() {
        var selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            var range = selection.getRangeAt(0);
            var node = $('<a/>')
            range.insertNode(node[0]);
            var rect = node[0].getBoundingClientRect();
            node.detach();
            return rect.top;
        }
        return null;
    },
    center: function() {
        var focus = $(window).height() * preferences.get('center');
        if (focus > 0) {
            var fontsize = parseInt($(window.getSelection().focusNode).parent().css('font-size')) * 1.5;
            var ypos = editor.getCaretPosition();
            var offset = $(document.body).scrollTop();
            $(document.body).scrollTop(offset + ypos + fontsize - focus);
        }
    }
};

var metaInfo = {
    elem: {
        headers: null,
        para: null,
        word: null,
        char: null,
        page: null,
        time: null
    },
    count: {
        para: 0,
        word: 0,
        char: 0,
        page: 0,
        time: 0
    },
    init: function() {
        metaInfo.elem.headers = $('#headers');
        metaInfo.elem.para = $('#paragraphcount span');
        metaInfo.elem.word = $('#wordcount span');
        metaInfo.elem.char = $('#charcount span');
        metaInfo.elem.page = $('#pagecount span');
        metaInfo.elem.time = $('#timetyping span');

        var lastUpdate = 0;
        editor.elem.on('keyup', function () {
            var sleepTime = Math.log(Math.max(metaInfo.count.word, 10)) ^ 2 * 100;
            setTimeout(function () {
                if (lastUpdate + sleepTime < Date.now()) {
                    lastUpdate = Date.now();
                    metaInfo.buildStats();
                    metaInfo.buildStructure();
                }
            }, sleepTime);
        });

        var enabled = false;
        var timeout = null;
        editor.elem.on('keydown', function() {
            clearTimeout(timeout);
            enabled = true;
            timeout = setTimeout(function() {
                enabled = false;
            }, 1001);
        });
        setInterval(function() {
            if (enabled) {
                metaInfo.count.time += 1;
                metaInfo.elem.time.html(metaInfo.count.time + ' seconds');
            }
        }, 1000)
    },
    buildStats: function() {
        metaInfo.count.para = editor.elem.find('p:not(:has(>br))').length;
        metaInfo.elem.para.html(metaInfo.count.para);
        metaInfo.count.word = editor.elem.text().replace(/[^\w ]/g, "").split(/\s+/).length;
        metaInfo.elem.word.html(metaInfo.count.word);
        metaInfo.count.char = editor.elem.text().replace(/[^\w]/g, "").length;
        metaInfo.elem.char.html(metaInfo.count.char);
        metaInfo.elem.page.html(Math.ceil(metaInfo.count.word / 250));
    },
    buildStructure: function () {
        metaInfo.elem.headers.html('- no headers so far -');
        var counter = 0;
        var html = '';
        editor.elem.find('h1, h2, h3, h4, h5, h6').each(function (id, element) {
            var header = $(element);
            header.attr('id', 'm' + counter);
            var title = header.html();
            var level = header[0].tagName.substr(1);
            html += '<div class="level' + level + '"><a href="#m' + counter + '">' + title + '</a></div>';
            counter++;
        });
        if (html.length) {
            metaInfo.elem.headers.html(html);
        }
    }
};

var general = {
    setKeys: function () {
        var listener = new window.keypress.Listener();
        listener.simple_combo("meta j", function () {
            structure.pin(!preferences.get('pinStructure'));
        });
        listener.simple_combo("meta k", function () {
            stats.pin(!preferences.get('pinStats'));
        });
        listener.simple_combo("meta ?", this.showHelp);
        listener.simple_combo("meta s", function(event) {
            return false;
        });
        if (atomShell) {
            listener.simple_combo("meta f", function (event) {
                actions.elem.show('slide', {direction: 'up'});
                $('#search').focus();
                return false;
            });
        }
        listener.simple_combo("tab", function () {
            return false;
        });
    },
    showHelp: function() {

    }
};


$(document).ready(function() {
    editor.init();
    preferences.init();
    general.setKeys();
});