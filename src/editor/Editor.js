import React, { Component } from 'react';
import 'brace';
import AceEditor from 'react-ace';
import { Treebeard, decorators } from 'react-treebeard';
import "./Editor.css";
import { getFiles, getFile } from "../utils/api";
import { EditSession } from "brace";


import 'brace/mode/javascript';
import 'brace/theme/monokai';

decorators.Header = ({ style, node }) => {
    const iconType = node.type === 'file' ? 'file-text' : node.type;
    const iconClass = `fa fa-${iconType}`;
    const iconStyle = { marginRight: '5px' };

    return (
        <div style={style.base}>
            <div style={style.title}>
                <i className={iconClass} style={iconStyle} />

                {node.name}
            </div>
        </div>
    );
};

class Editor extends Component {

    constructor() {
        super();
        this.id = new Date().getTime();
        this.onToggle = this.onToggle.bind(this);
        this.state = {
            fileData: {}
        };
        this.sessions = {};

        getFiles().then(files => {
            this.setState({ fileData: files });
            console.log(this);
        })
    }

    onToggle(node, toggled) {
        const { cursor } = this.state;
        if (cursor) {
            cursor.active = false;
        }
        node.active = true;
        if (node.children) {
            node.toggled = toggled;
        } else if (node.type === "file") {
            const editor = this.refs.aceEditor.editor;
            if (this.sessions[node.path]) {
                editor.setSession(this.sessions[node.path]);
            } else {
                getFile(node.path).then(content => {
                    this.sessions[node.path] = new EditSession(content, 'ace/mode/javascript');
                    debugger;
                    editor.setSession(this.sessions[node.path]);
                });
            }
        }

        this.setState({ cursor: node });
    }

    render() {
        return (
            <div className="editor-pane">
                <Treebeard
                    data={this.state.fileData}
                    onToggle={this.onToggle} />
                <AceEditor
                    ref="aceEditor"
                    mode="javascript"
                    theme="monokai"
                    name={"editor" + this.id}
                    showPrintMargin={false}
                    showGutter={true}
                    highlightActiveLine={true}
                    width="100%"
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: false,
                        showLineNumbers: true,
                        tabSize: 2,
                    }}
                />
            </div>
        );
    }
}

export default Editor;
