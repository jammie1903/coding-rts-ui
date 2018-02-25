import * as PIXI from "pixi.js";

// a class that stores a list of gameobjectcontainers for a given room, adding, updating, and removing them as necessary
// will need to receive events for adds/updates/deletes

// pubnub client should be wrapped in a container, should have a map x/y setting

// when map changed, should tell this object all items have been removed, then tell it all the objects in the new room have been added
// should then continue to watch for changes and let this class know about them
// this class should maybe be a subscriber to the pubnub client wrapper?

export default class GameObjectContainer {

    constructor() {
        this.spriteMap = {};
        this.container = new PIXI.Container();
    }

    onUpdated() {
        if(this.handler) this.handler();
    }

    setOnUpdated(handler) {
        this.handler = handler;
    }

    getSprite(data) {
        const circle = new PIXI.Graphics();
        console.log("here");
        circle.lineStyle(2, 0x000, 1);
        circle.beginFill(data.color, 0.5);
        circle.drawCircle(32, 32, 24);
        circle.endFill();
       
        const container = new PIXI.Container();
        container.addChild(circle);
        container.position.set(data.tile.x * 64, data.tile.y * 64);
        return container;
    }

    updateSprite(sprite, data) {
        sprite.position.set(data.tile.x * 64, data.tile.y * 64);
    }

    onAllObjectsRemoved() {
        this.container.removeChildren();
        this.spriteMap = {};
        this.onUpdated();
    }

    onObjectRemoved(name) {
        this.container.removeChild(this.spriteMap[name]);
        delete this.spriteMap[name];
        this.onUpdated();
    }

    onObjectAdded(name, data) {
        this.spriteMap[name] = this.getSprite(data);
        this.container.addChild(this.spriteMap[name]);
        this.onUpdated();
    }

    onObjectUpdated(name, newData) {
        this.updateSprite(this.spriteMap[name], newData);
        this.onUpdated();
    }
}