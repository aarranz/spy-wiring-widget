/*
 * Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* globals $, MashupPlatform, JSONEditor, StyledElements*/

(function () {

    "use strict";

    var MP = MashupPlatform;
    var layout;
    var stack_n;

    var createbtn, playbtn, runbtn, stepbtn, sendbtn, dropbtn;

    var recording = false;

    var modes = ['code', 'form', 'text', 'tree', 'view'];

    var TEXT = 'textoutput'; // Output endpoint

    var editor;

    var stack = [];

    var typeSelector;

    var init = function init () {
        layout = new StyledElements.BorderLayout();
        layout.insertInto(document.body);
        layout.getNorthContainer().addClassName('header');
        layout.getNorthContainer().wrapperElement.innerHTML = '<h4 class="text-primary">Type: <span id="type-data">No data</span></h4><div id="buttons"></div>';

        // Create the data-type selector
        var typed = $("#type-data")[0];
        var parent = typed.parentNode;
        parent.removeChild(typed);
        createTypeSelectors();
        typeSelector.insertInto(parent);

        // Create the remaining events count
        stack_n = document.createElement('div');
        document.getElementById('buttons').appendChild(stack_n);
        stack_n.className = 'badge badge-info';
        stack_n.textContent = '0';

        // Create and bind action buttons
        createbtn = new StyledElements.StyledButton({'class': 'btn-info fa fa-plus', 'title': 'Create new event'});
        createbtn.insertInto(document.getElementById('buttons'));
        createbtn.addEventListener("click", create_action);

        playbtn = new StyledElements.StyledButton({'class': 'btn-danger fa fa-circle', 'title': 'Start recording events'});
        playbtn.insertInto(document.getElementById('buttons'));
        playbtn.addEventListener("click", play_action);
        runbtn = new StyledElements.StyledButton({'class': 'btn-info fa fa-fast-forward', 'title': 'Launch all pending events'});
        runbtn.insertInto(document.getElementById('buttons'));
        runbtn.addEventListener('click', run_action);
        stepbtn = new StyledElements.StyledButton({'class': 'btn-info fa fa-step-forward', 'title': 'Launch current event'});
        stepbtn.insertInto(document.getElementById('buttons'));
        stepbtn.addEventListener('click', step_action);

        sendbtn = new StyledElements.StyledButton({'class': 'btn-info fa fa-play', 'title': 'Launch and keep current event'});
        sendbtn.insertInto(document.getElementById('buttons'));
        sendbtn.addEventListener('click', send_action);

        dropbtn = new StyledElements.StyledButton({'class': 'btn-info fa fa-trash', 'title': 'Drop current event'});
        dropbtn.insertInto(document.getElementById('buttons'));
        dropbtn.addEventListener('click', drop_action);
        // Disable the buttons
        setdisable_btns(true);

        // Set the editor options
        var options = {
            mode: 'tree',
            modes: modes,
            error: function (err) {
                window.alert(err.toString());
            }
        };

        //Create the editor
        layout.getCenterContainer().addClassName('jsoncontainer');
        editor = new JSONEditor(layout.getCenterContainer().wrapperElement, options);

        //Create loading animation
        layout.getCenterContainer().addClassName('loading');
        layout.getCenterContainer().disable();

        editor.setMode("text");
        editor.setText('');

        // Check if it has to be on recording mode
        recording = MP.prefs.get("recording");
        if (recording) {
            pause_proxy();
        }

        layout.repaint();

        MP.wiring.registerCallback('textinput', function (data) {
            updateContent(data);
            if (!recording) {
                sendData(TEXT, data);
            }
        });
        MP.widget.context.registerCallback(function (new_values) {
            layout.repaint();
        });
    };

    // Sets a value for the data-type selector
    var updateType = function updateType(type) {
        typeSelector.setValue(type);
    };

    //Create the selector to choose the type of the output data
    var createTypeSelectors = function createTypeSelectors () {
        typeSelector = new StyledElements.Select();

        var entries = [
            {label: "JSON - (Text)", value: "JSON - (Text)"},
            {label: "JSON - (Object)", value: "JSON - (Object)"},
            {label: "Text", value: "Text"}
        ];

        typeSelector.addEntries(entries);
        typeSelector.setValue("JSON - (Text)");
    };

    var parse_json = function parse_json(json, type) {
        editor.options.modes = modes;
        editor.set(json);

        if (editor.options.mode === "tree") {
            editor.setMode("text"); //Force the editor to refresh, since if its already on tree mode it gets bugged (lol)
            editor.setMode("tree");
        } else if (editor.options.mode === "text") {
            editor.setMode("tree");
        }

        if (editor.options.mode !== 'code') {
            editor.expandAll();
        }

        updateType(type);
    };

    var parse_data = function parse_data(d) {
        if (typeof d === 'string') {
            try {
                var tmp = JSON.parse(d);
                parse_json(tmp, "JSON - (Text)");
            } catch (err) {
                updateType("Text");
                editor.options.modes = ['text'];
                editor.setMode('text');
                editor.setText(d);
            }
        } else {
            parse_json(d, "JSON - (Object)");
        }
    };

    var clearEvents = function clearEvents() {
        editor.options.modes = ['text'];
        editor.setMode('text');
        //editor.options.modes = modes;
        //editor.setMode('text');
        editor.setText('');
        // Add the loading animation.
        layout.getCenterContainer().disable();

        stack = [];
        updateStackInfo();
    };

    var updateContent = function updateContent(d) {
        // Remove the loading animation
        layout.getCenterContainer().enable();

        if (recording) {
            stack.unshift(d);
            var n = parseInt(stack_n.textContent) + 1;
            stack_n.textContent = n;
            if (stack.length === 1) {
                // first event
                parse_data(d);
            }
            setdisable_btns(false);
        } else {
            stack = [d];
            parse_data(d);
        }
    };

    var updateStackInfo = function updateStackInfo() {
        stack_n.textContent = stack.length;
        setdisable_btns(stack.length === 0);
    };

    var sendData = function (output, data, keepEvents) {
        // Data is undefined if it was called by the step / play events
        if (typeof data === "undefined") {
            // Get the selected data type.
            var editordata;
            if (typeSelector.getValue() === "JSON - (Object)") {
                editordata = editor.get(); // Object
            } else {
                editordata = editor.getText(); //JSON string / string
            }

            data = stack.pop();

            if (data !== editordata) {
                data = editordata;
            }

            // Keep sent event on the editor.
            if (keepEvents) { //TODO
                stack.push(data);
                MP.wiring.pushEvent(output, data);
                return;

            } else if (stack.length > 0) {
                // Update the editor contents to view the next data
                var next = stack[stack.length - 1];
                updateStackInfo();
                parse_data(next);
            } else {
                // No events left
                clearEvents();
            }
        }
        MP.wiring.pushEvent(output, data);
    };

    var change_class = function (elem, c1, c2) {
        elem.removeClassName(c1);
        elem.addClassName(c2);
    };

    var setdisable_btns = function (value) {
        runbtn.setDisabled(value);
        stepbtn.setDisabled(value);
        sendbtn.setDisabled(value);
        dropbtn.setDisabled(value);
    };

    var play_proxy = function () {
        recording = false;
        change_class(playbtn, 'icon-stop', 'icon-circle');
        change_class(playbtn, 'btn-success', 'btn-danger');
        run_action();
        playbtn.setTitle('Start recording events');
        setdisable_btns(true);
    };

    var pause_proxy = function () {
        recording = true;
        updateStackInfo(); // There might be an event on the editor before going into record mode.
        change_class(playbtn, 'icon-circle', 'icon-stop');
        change_class(playbtn, 'btn-danger', 'btn-success');
        playbtn.setTitle('Stop recording events (Launch all pending events)');
    };

    var play_action = function () {
        if (recording) {
            // Stop recording, send all events
            play_proxy();
        } else {
            // Start recording events
            pause_proxy();
        }
    };

    var run_action = function () {
        while (stack.length > 0) {
            sendData(TEXT);
        }
    };

    var step_action = function () {
        sendData(TEXT);
    };

    var send_action = function () {
        sendData(TEXT, undefined, true);
    };

    var drop_action = function () {
        if (stack.length > 0) {
            stack.pop();
            var next;
            if (stack.length > 0) {
                next = stack[stack.length - 1];
                updateStackInfo();
                parse_data(next);
            } else {
                clearEvents();
            }
        }
    };

    // Creates a new event, going into record mode if not on it.
    var create_action = function create_action () {
        // If it was not recording
        if (!recording) {
            pause_proxy ();
        }
        //Add a new view into the blank event while keeping previous events on the stack
        stack.push("{}");
        editor.setText("{}");
        editor.options.modes = modes;
        editor.setMode('tree');
        updateStackInfo();
        // Remove the loading animation
        layout.getCenterContainer().enable();
    };

    $(document).ready(function () {init();});
})();
