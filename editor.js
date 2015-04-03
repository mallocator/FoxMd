//console.log(markdown.toHTML(toMarkdown('<em>fat</em>')));

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
        this.enabled = enabled;
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
        this.enabled = enabled;
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

var editor = {
    elem: null,
    init: function() {
        this.elem = $('#editor');
        function clearTools(event) {
            if (!structure.enabled) {
                structure.elem.hide('slide', {direction: 'left'});
            }
            if (!stats.enabled) {
                stats.elem.hide('slide', {direction: 'right'});
            }
        }
        editor.elem.on('mouseenter', clearTools);
    },
    load: function() {
        $.get('test/testdata.md', function(data) {
            editor.elem.html(markdown.toHTML(data));
            editor.buildStructure();
            editor.buidlStats();
        });
    },
    buildStructure: function() {
        $('#headers').empty();
        var counter = 0;
        editor.elem.find('h1, h2, h3, h4, h5, h6').each(function (id, element) {
            var header = $(element);
            header.attr('id', 'm' + counter);
            var title = header.html();
            var level = header[0].tagName.substr(1);
            $('#headers').append('<div class="level' + level + '"><a href="#m' + counter + '">' + title + '</a></div>')
            counter++;
        })
    },
    buidlStats: function() {
        var paragraphCount = editor.elem.find('p').length;
        $('#paragraphcount span').html(paragraphCount);
        var wordCount = editor.elem.text().replace(/[^\w ]/g, "").split(/\s+/).length
        $('#wordcount span').html(wordCount);
        var charCount = editor.elem.text().replace(/[^\w]/g, "").length
        $('#charcount span').html(charCount);
        $('#pagecount span').html(Math.ceil(wordCount / 250));
    }
};

var general = {
    setKeys: function () {
        var listener = new window.keypress.Listener();
        listener.simple_combo("meta j", function () {
            structure.pin(!structure.enabled)
        });
        listener.simple_combo("meta k", function () {
            stats.pin(!stats.enabled)
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
        alert('show help');
    }
};


$(document).ready(function() {
    structure.pin();
    stats.pin();
    editor.init();
    editor.load();
    general.setKeys();
});