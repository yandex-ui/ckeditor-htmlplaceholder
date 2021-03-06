(function() {
    'use strict';

    var CLASS_PLACEHOLDER = 'cke_htmlplaceholder';
    var CHECK_SHOW_EVENTS = {
        blur: null,
        change: null,
        key: null,
        loadSnapshot: null,
        mode: null,
        paste: null,
        readOnly: null
    };

    CKEDITOR.config.showPlaceholder = false;

    CKEDITOR.plugins.add('htmlplaceholder', {
        modes: { 'wysiwyg': 1, 'source': 1 },

        onLoad: function() {
            CKEDITOR.addCss(
                'textarea.cke_source::-webkit-input-placeholder {color:#ccc;padding-left:4px;}' +
                'textarea.cke_source::-moz-placeholder {color:#ccc;padding-left:4px;}' +
                'textarea.cke_source:-ms-input-placeholder {color:#ccc !important;padding-left:4px;}' +
                'textarea.cke_source::-ms-input-placeholder {color:#ccc;padding-left:4px;}' +
                'textarea.cke_source::placeholder {color:#ccc;padding-left:4px;}' +
                '.' + CLASS_PLACEHOLDER + ':before {pointer-events:none;white-space:nowrap;margin-left:4px;position:absolute;font:15px Arial;color:rgba(0,0,0,.25);content:attr(placeholder);display:block;}'
            );
        },

        init: function(editor) {
            var textPlaceholder = editor.config.showPlaceholder && editor.element.getAttribute('placeholder');
            if (!textPlaceholder) {
                return;
            }

            editor._placeholder = new Placeholder(editor, textPlaceholder);

            for (var eventName in CHECK_SHOW_EVENTS) {
                editor.on(eventName, editor._placeholder.checkShow, editor._placeholder);
            }

            editor.on('destroy', this._onDestroy);
        },

        _onDestroy: function() {
            if (this._placeholder) {
                this._placeholder.destroy();
                this._placeholder = undefined;
            }
        }
    });


    function Placeholder(editor, textPlaceholder) {
        this._textPlaceholder = textPlaceholder;
        this._editor = editor;
        this._checkShowDebounce = _.debounce(this._checkShow.bind(this), 0);
    }

    Placeholder.prototype._editorHideEvents = {
        beforeCommandExec: null,
        beforeModeUnload: null,
        destroy: null
    };

    Placeholder.prototype.destroy = function() {
        this._checkShowDebounce.cancel();
    };

    Placeholder.prototype.checkShow = function() {
        this._checkShowDebounce();
    };

    Placeholder.prototype._checkShow = function() {
        var selection = this._editor.getSelection();
        var range = selection && selection.getRanges()[ 0 ];

        if (range && !range.collapsed) {
            return;
        }

        try {
            var data = this._editor.getData();

            if (!this._editor.readOnly && isEmpty(data)) {
                this._show();

            } else {
                this._hide();
            }

        } catch (e) {
            this._hide();
        }
    };

    Placeholder.prototype._show = function() {
        if (this._hasPlaceholder()) {
            return;
        }

        var editable = this._editor.editable();
        editable.addClass(CLASS_PLACEHOLDER);
        editable.setAttribute('placeholder', this._textPlaceholder);

        for (var eventName in this._editorHideEvents) {
            this._editor.once(eventName, this._hide, this, null, 0);
        }
    };

    Placeholder.prototype._hide = function() {
        if (!this._hasPlaceholder()) {
            return;
        }

        var editable = this._editor.editable();
        editable.removeClass(CLASS_PLACEHOLDER);
        editable.removeAttribute('placeholder');

        for (var eventName in this._editorHideEvents) {
            this._editor.removeListener(eventName, this._hide);
        }
    };

    Placeholder.prototype._hasPlaceholder = function() {
        var editable = this._editor.editable();
        return Boolean(editable && editable.hasClass(CLASS_PLACEHOLDER));
    };


    function isEmpty(data) {
        if (!data) {
            return true;
        }

        if (data.length > 20) {
            return false;
        }

        data = data.replace(/[\n\t]*/g, '').toLowerCase();

        if (!data ||
            data === '<br>' ||
            data === '<p>&nbsp;<br></p>' ||
            data === '<p><br></p>' ||
            data === '<p>&nbsp;</p>' ||
            data === '&nbsp;' ||
            data === ' ' ||
            data === '&nbsp;<br>' ||
            data === ' <br>') {

            return true;
        }

        return false;
    }

}());
