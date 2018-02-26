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

        this.textStyle = new PIXI.TextStyle({
            fontSize: 12,
            fontWeight: 'bold',
            fill: '#ffffff',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 2,
        });
        
    }

    onUpdated() {
        if (this.handler) this.handler();
    }

    setOnUpdated(handler) {
        this.handler = handler;
    }

    getSprite(data) {
        const container = new PIXI.Container();
        let textWidth = PIXI.TextMetrics.measureText(data.name, this.textStyle).width;
        const nameText = new PIXI.Text(data.name, this.textStyle);
        if(textWidth > 64) {
            nameText.width = 64;
            textWidth = 64;
        }
        nameText.x = 32 - (textWidth/2);

        if (data.type === "structure") {
            nameText.y = -6;
            const rect = new PIXI.Graphics();
            rect.lineStyle(2, 0x000, 1);
            rect.beginFill(data.color, 1);
            rect.drawRoundedRect(12, 12, 40, 40, 8);
            rect.endFill();
            container.addChild(rect);
        } else {
            nameText.y = -2;
            const circle = new PIXI.Graphics();
            circle.lineStyle(2, 0x000, 1);
            circle.beginFill(data.color, 1);
            circle.drawCircle(32, 32, 16);
            circle.endFill();
            container.addChild(circle);
        }
        container.addChild(nameText);


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