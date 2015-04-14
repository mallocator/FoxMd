var files = {
    create: function() {
        $('#empty').hide();
        editor.load('<p>This will be the filename title</p>');
    },
    open: function() {
        $.get('test/testdata.md', function (data) {
            $('#empty').hide();
            editor.load(data);
        });
    }
}