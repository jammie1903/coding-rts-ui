import React, { Component } from 'react';
import 'brace';
import AceEditor from 'react-ace';
import { Treebeard, decorators } from 'react-treebeard';
import "./Editor.css";
import { getFiles, getFile, saveFile } from "../utils/api";
import { EditSession } from "brace";
import FaFloppy from 'react-icons/lib/fa/floppy-o';
import FaRefresh from 'react-icons/lib/fa/refresh';

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
        this.openFile = null;
        this.sessions = {};
        this.emptySession = new EditSession("", "ace/mode/javascript")

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

        }
        const editor = this.refs.aceEditor.editor;

        const previousSession = editor.getSession();

        editor.setSession(this.emptySession);
        this.setState({ cursor: node });

        if (node.type === "file") {
            if (this.sessions[node.path]) {
                setTimeout(() => {
                    editor.setSession(this.sessions[node.path]);
                    this.openFile = node.path;
                });
            } else {
                getFile(node.path).then(content => {
                    this.sessions[node.path] = new EditSession(content, "ace/mode/javascript");
                    editor.setSession(this.sessions[node.path]);
                    this.openFile = node.path;
                });
            }
        } else {
            setTimeout(() => editor.setSession(previousSession));
        }

    }

    save() {
        if(this.openFile) {
            const editor = this.refs.aceEditor.editor;
            const content = editor.getSession().getValue();
            saveFile(this.openFile, content);
        }
    }

    reload() {
        if(this.openFile) {
            getFile(this.openFile).then(content => {
                this.sessions[this.openFile].setValue(content);
            });
        }
    }

    render() {
        return (
            <div className="editor-pane">
                <Treebeard
                    data={this.state.fileData}
                    onToggle={this.onToggle} />
                <div className="editor">
                    <div className="toolbar">
                        <span className="right"> 
                            <a onClick={() => this.save()}><FaFloppy></FaFloppy></a>
                            <a onClick={() => this.reload()}><FaRefresh></FaRefresh></a>
                        </span>
                    </div>
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
            </div>
        );
    }
}

export default Editor;
