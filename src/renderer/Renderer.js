import React, { Component } from 'react';
import * as PIXI from "pixi.js";
import request from 'superagent'
import Measure from 'react-measure'
import debounce from "../utils/debounce";
import "./Renderer.css";

import stream from "../stream";
import GameObjectContainer from './GameObjectContainer';

class Renderer extends Component {

    constructor() {
        super();
        this.id = new Date().getTime();
        this.app = new PIXI.Application({ width: 400, height: 400 });
        
        stream.addListener({
            onAllObjectsRemoved: () => console.log("onAllObjectsRemoved"),
            onObjectRemoved: (a) => console.log("onObjectRemoved", a),
            onObjectAdded: (a, b) => console.log("onObjectAdded", a, b),
            onObjectUpdated: (a, b) => console.log("onObjectUpdated", a, b)
        });

        this.map = [];
        this.width = 20;
        this.height = 20;
        this.room = { x: 0, y: 0 };

        this.updateRendererSize = debounce((param) => {
            console.log(param);
            this.app.renderer.resize(param.bounds.width - 20, param.bounds.height - 20);
        }, 300);
    }

    render() {
        return (
            <Measure bounds onResize={contentRect => {
                this.updateRendererSize(contentRect);
            }}>
                {({ measureRef }) =>
                    <div ref={measureRef} className="Renderer" id={"renderer-" + this.id} />
                }
            </Measure>
        );
    }

    componentDidMount() {
        stream.connect();
        document.getElementById("renderer-" + this.id).appendChild(this.app.view);
        const imagePromise = new Promise((res, rej) => {
            PIXI.loader.add("tileset.json")
                .add('floor.png')
                .load(() => res());
        });
        const _this = this;

        const roomPromise = new Promise((res, rej) => {
            request
                .get('http://localhost:3000/map/room/main')
                .set('content-type', 'application-json')
                .set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0MSIsImlhdCI6MTUxODEwMzAxOH0.uIbYP1DbVSoFA1EF7JXp84ZNMoZsHMvS8C85tqW8aKE')
                .end((err, resp) => {
                    if (!err && resp.body) {
                        _this.room = resp.body.data;
                    }
                    res();
                });
        });

        const mapPromise = roomPromise.then(() => new Promise((res, rej) => {
            request
                .get('http://localhost:3000/map/room')
                .query({ x: this.room.x })
                .query({ y: this.room.y })
                .set('content-type', 'application-json')
                .set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0MSIsImlhdCI6MTUxODEwMzAxOH0.uIbYP1DbVSoFA1EF7JXp84ZNMoZsHMvS8C85tqW8aKE')
                .end((err, resp) => {
                    if (!err && resp.body) {
                        _this.map = resp.body.data;
                        res();
                    } else {
                        rej(err);
                    }
                });
        }));

        Promise.all([imagePromise, mapPromise])
            .then(() => this.setup())
            .catch(console.error);
    }

    changeRoom(link) {
        request
            .get('http://localhost:3000/map/room')
            .query({ x: link.room.x })
            .query({ y: link.room.y })
            .set('content-type', 'application-json')
            .set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0MSIsImlhdCI6MTUxODEwMzAxOH0.uIbYP1DbVSoFA1EF7JXp84ZNMoZsHMvS8C85tqW8aKE')
            .end((err, resp) => {
                if (!err) {
                    this.room = link.room;
                    this.map = resp.body.data;
                    this.setup(true);
                }
            })
    }

    getSpriteName(dir1, dir2, dir1Val, dir2Val, cornerVal) {
        if (dir1Val) {
            if (dir2Val) {
                return cornerVal ? "whole.png" : `${dir1}-${dir2}-inner-corner.png`
            } else {
                return dir2 + '.png';
            }
        } else {
            if (dir2Val) {
                return dir1 + '.png';
            } else {
                return `${dir1}-${dir2}-corner.png`;
            }
        }
    }

    getSprite(spriteName) {
        return new PIXI.Sprite(this.tileMap[spriteName]);
    }

    moveViewport(e) {
        if (this.dragging) {
            let x = e.pageX - this.app.view.offsetLeft;
            let y = e.pageY - this.app.view.offsetTop;
            this.container.x += x - this.lastDragX;
            this.container.y += y - this.lastDragY;
            this.lastDragX = x;
            this.lastDragY = y;
        }
    }

    startDrag(e) {
        this.dragging = true;
        this.lastDragX = e.pageX - this.app.view.offsetLeft;
        this.lastDragY = e.pageY - this.app.view.offsetTop;
        this.app.view.onmousemove = (e) => this.moveViewport(e);
    }

    endDrag() {
        this.dragging = false;
        this.app.view.onmousemove = null;
    }

    setup(refresh) {
        stream.room = this.room;
        if (refresh) {
            this.mapContainer.removeChildren();
            this.uiContainer.removeChildren();
        } else {
            this.container = new PIXI.Container();
            this.mapContainer = new PIXI.Container();
            this.gameObjectContainer = new GameObjectContainer();
            this.container.addChild(this.mapContainer);
            this.container.addChild(this.gameObjectContainer.container);
            this.uiContainer = new PIXI.Container();

            stream.addListener(this.gameObjectContainer);
            this.app.stage.addChild(this.container);
            this.app.stage.addChild(this.uiContainer);
            PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
            this.app.view.onmousedown = (e) => this.startDrag(e);
            this.app.view.onmouseup = (e) => this.endDrag(e);
            this.app.view.onmouseleave = (e) => this.endDrag(e);
            // this.app.view.on('mousedown', onDragStart)
            //     .on('touchstart', onDragStart)
            //     // events for drag end
            //     .on('mouseup', onDragEnd)
            //     .on('mouseupoutside', onDragEnd)
            //     .on('touchend', onDragEnd)
            //     .on('touchendoutside', onDragEnd)
            //     // events for drag move
            //     .on('mousemove', onDragMove)
            //     .on('touchmove', onDragMove);
        }
        this.tileMap = PIXI.loader.resources["tileset.json"].textures;

        const tilingSprite = new PIXI.extras.TilingSprite(
            PIXI.loader.resources["floor.png"].texture,
            this.width * 64,
            this.height * 64
        );
        this.mapContainer.addChild(tilingSprite);

        const roomPosition = new PIXI.Text(this.room.x + ", " + this.room.y);
        roomPosition.x = 20;
        roomPosition.y = 20;

        this.uiContainer.addChild(roomPosition);

        this.map.forEach((cell, index) => {
            if (cell.link) {
                const linkSprite = this.getSprite("room-link.png");
                linkSprite.position.set((index % this.width) * 64 + 1, Math.floor(index / this.width) * 64 + 1)
                linkSprite.scale.set(2, 2);
                this.mapContainer.addChild(linkSprite);
                linkSprite.interactive = true;
                linkSprite.buttonMode = true;
                linkSprite.on('pointerdown', () => this.changeRoom(cell.link));
                return;
            }
            if (!cell.wall) return;

            const leftWall = index % this.width === 0;
            const rightWall = index % this.width === this.width - 1;
            const topWall = index < this.height;
            const bottomWall = index >= this.width * (this.height - 1);

            const topLeft = leftWall || topWall || this.map[index - 1 - this.width].wall;
            const top = topWall || this.map[index - this.width].wall;
            const topRight = rightWall || topWall || this.map[index + 1 - this.width].wall;

            const left = leftWall || this.map[index - 1].wall;
            const right = rightWall || this.map[index + 1].wall;

            const bottomLeft = leftWall || bottomWall || this.map[index - 1 + this.width].wall;
            const bottom = bottomWall || this.map[index + this.width].wall;
            const bottomRight = rightWall || bottomWall || this.map[index + 1 + this.width].wall;

            const topLeftSprite = this.getSprite(this.getSpriteName("top", "left", top, left, topLeft));
            topLeftSprite.position.set((index % this.width) * 64, Math.floor(index / this.width) * 64)
            const topRightSprite = this.getSprite(this.getSpriteName("top", "right", top, right, topRight));
            topRightSprite.position.set((index % this.width) * 64 + 32, Math.floor(index / this.width) * 64)
            const bottomLeftSprite = this.getSprite(this.getSpriteName("bottom", "left", bottom, left, bottomLeft));
            bottomLeftSprite.position.set((index % this.width) * 64, Math.floor(index / this.width) * 64 + 32)
            const bottomRightSprite = this.getSprite(this.getSpriteName("bottom", "right", bottom, right, bottomRight));
            bottomRightSprite.position.set((index % this.width) * 64 + 32, Math.floor(index / this.width) * 64 + 32)
            this.mapContainer.addChild(topLeftSprite);
            this.mapContainer.addChild(topRightSprite);
            this.mapContainer.addChild(bottomLeftSprite);
            this.mapContainer.addChild(bottomRightSprite);
        });
    }
}

export default Renderer;
