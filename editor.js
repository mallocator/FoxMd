var settings = {
    focus: true,
    center: 0.5,
    pin: {
        structure: false,
        stats: false
    }
};

var structure = {
    elem: null,
    enabled: false,
    hovering: false,
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
        settings.pin.structure = enabled;
        structure.elem = $('#structure');
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
    enabled: false,
    hovering: false,
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
        settings.pin.stats = enabled;
        stats.elem = $('#stats');
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
        strong: /\*([^\*\s]*)\*/g,
        em: /_([^_\s]*)_/g
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

var editor = {
    elem: null,
    medium: null,
    init: function() {
        editor.elem = $('#editor');
        function clearTools() {
            if (!settings.pin.structure) {
                structure.elem.hide('slide', {direction: 'left'});
            }
            if (!settings.pin.stats) {
                stats.elem.hide('slide', {direction: 'right'});
            }
        }
        editor.elem.on('mouseenter', clearTools);
        editor.elem.on('keyup', editor.cleanUp);
        editor.elem.on('keyup focus click', editor.focus);
        editor.elem.on('keyup focus click', editor.center);
    },
    load: function() {
        $.get('test/testdata.md', function(data) {
            editor.elem.html(markdown.convert(data));
            metaInfo.buildStructure();
            metaInfo.buildStats();
        });
    },
    cleanUp: function(event) {
        editor.elem.find('span, div, font').each(function(i, elem) {
            elem = $(elem)
            var content = elem.html();
            var parent = elem.parent();
            elem.detach();
            parent.append(' ' + content);
        });
    },
    focused: null,
    focus: function(event) {
        if (editor.focused && editor.focused.length) {
            editor.focused.removeClass('focused');
        }
        editor.focused = $(window.getSelection().focusNode).closest('p, ol, ul, h1, h2, h3, h4, h5, h6').addClass('focused');
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
    center: function(event) {
        var fontsize = parseInt($(window.getSelection().focusNode).parent().css('font-size')) * 1.5;
        var focus = $(window).height() * settings.center;
        var ypos = editor.getCaretPosition();
        var offset = $(document.body).scrollTop();
        $(document.body).scrollTop(offset + ypos + fontsize - focus);
    }
};

var metaInfo = {
    elem: {
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
        $('#headers').empty();
        var counter = 0;
        editor.elem.find('h1, h2, h3, h4, h5, h6').each(function (id, element) {
            var header = $(element);
            header.attr('id', 'm' + counter);
            var title = header.html();
            var level = header[0].tagName.substr(1);
            $('#headers').append('<div class="level' + level + '"><a href="#m' + counter + '">' + title + '</a></div>')
            counter++;
        });
    }
};

var general = {
    setKeys: function () {
        var listener = new window.keypress.Listener();
        listener.simple_combo("meta j", function () {
            structure.pin(!settings.pin.structure)
        });
        listener.simple_combo("meta k", function () {
            stats.pin(!settings.pin.stats)
        });
        listener.simple_combo("meta ?", this.showHelp);
        listener.simple_combo("meta s", function() {
            return false;
        });
        listener.simple_combo("tab", function () {
            return false;
        });
    },
    showHelp: function() {

    }
};


$(document).ready(function() {
    structure.pin();
    stats.pin();
    editor.init();
    metaInfo.init();
    editor.load();
    general.setKeys();
});