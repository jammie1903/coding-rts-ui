import React, { Component } from 'react';
import 'brace';
import AceEditor from 'react-ace';
import { Treebeard, decorators } from 'react-treebeard';
import "./Editor.css";
import { getFiles, getFile, saveFile } from "../utils/api";
import { EditSession } from "brace";
import FaFloppy from 'react-icons/lib/fa/floppy-o';
import FaRefresh from 'react-icons/lib/fa/refresh';
import Modal from 'react-modal';
import Menu, { SubMenu, MenuItem } from 'rc-menu';
import 'rc-menu/assets/index.css';

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

    safeStateChange(newState) {
        const editor = this.refs.aceEditor.editor;
        const previousSession = editor.getSession();
        editor.setSession(this.emptySession);

        this.setState(newState);

        setTimeout(() => editor.setSession(previousSession));
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
                this.openFile = node.path;
                setTimeout(() => {
                    editor.setSession(this.sessions[node.path]);
                });
            } else {
                this.openFile = node.path;
                getFile(node.path).then(content => {
                    this.sessions[node.path] = new EditSession(content, "ace/mode/javascript");
                    editor.setSession(this.sessions[node.path]);
                });
            }
        } else {
            setTimeout(() => editor.setSession(previousSession));
        }

    }

    save() {
        if (this.openFile) {
            const editor = this.refs.aceEditor.editor;
            const content = editor.getSession().getValue();
            saveFile(this.openFile, content);
        }
    }

    reload() {
        if (this.openFile) {
            getFile(this.openFile).then(content => {
                this.sessions[this.openFile].setValue(content);
            });
        }
    }

    handleMenuItemClick(key) {
        const segments = key.split("-");
        if (typeof this[segments[0]] === "function") {
            this[segments[0]].apply(this, segments.slice(1));
        }
    }

    openNewItemModal(type) {
        this.safeStateChange({
            newItemModalOpen: true,
            newItemModalType: type
        });
    }

    closeNewItemModal() {
        this.safeStateChange({
            newItemModalOpen: false
        });
    }

    flatten(data) {
        let result = [data];
        if (data.children) {
            data.children.forEach(child => {
                result = result.concat(this.flatten(child))
            });
        }
        return result;
    }

    doCreateItem(parent, name) {
        if (parent.children.filter(i => i.name === name).length) {
            this.closeNewItemModal();
        }

        const newItem = {
            name,
            type: this.state.newItemModalType,
            path: `${parent.path}/${name}`
        }
        if (newItem.type === "folder") {
            newItem.children = [];
        }

        if (this.state.newItemModalType === "file") {
            saveFile(newItem.path, "").then(() => {
                parent.children.push(newItem);
                this.closeNewItemModal();
            });
        } else {
            parent.children.push(newItem);
            this.closeNewItemModal();
        }
    }

    createItem() {
        const itemName = this.itemName;
        this.itemName = "";
        console.log(this.state.cursor, itemName, this.state.newItemModalType);
        if (this.state.cursor) {
            if (this.state.cursor.type === "folder") {
                this.doCreateItem(this.state.cursor, itemName);
            } else {
                const parentPath = this.state.cursor.path.substring(0, this.state.cursor.path.lastIndexOf("/"));
                let parent = this.flatten(this.state.fileData).filter(e => e.type === "folder" && e.path === parentPath)[0];
                if (parent) {
                    this.doCreateItem(parent, itemName);
                } else {
                    console.error(`Could not find parent for ${this.state.cursor.path}`);
                }
            }
        } else {
            this.doCreateItem(this.state.fileData, itemName);
        }
    }

    render() {
        return (
            <div className="editor-pane">
                <div className="lhs">
                    <Menu mode="horizontal" selectable={false} onClick={(info) => this.handleMenuItemClick(info.key)}>
                        <SubMenu title="File">
                            <MenuItem key="openNewItemModal-file">New File</MenuItem>
                            <MenuItem key="openNewItemModal-folder">New Folder</MenuItem>
                        </SubMenu>
                    </Menu>
                    <Treebeard
                        data={this.state.fileData}
                        onToggle={this.onToggle} />
                </div>
                <div className="editor">
                    <div className="toolbar">
                        <span className="openFile">{this.openFile}</span>
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
                <Modal
                    isOpen={this.state.newItemModalOpen}
                    onRequestClose={() => this.closeNewItemModal()}
                    contentLabel={"New " + this.state.newItemModalType}
                    className="Modal"
                    overlayClassName="Overlay"
                >
                    <div className="modal-title">
                        <h2>New {this.state.newItemModalType}</h2>
                    </div>
                    <div className="modal-content">
                        <input placeholder={`Enter ${this.state.newItemModalType} name`} onChange={(event) => this.itemName = event.target.value}></input>
                        <button onClick={() => this.createItem()}>Create</button>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default Editor;
