import deepstream from 'deepstream.io-client-js';

export default class StreamListener {
    constructor() {
        this.stream = deepstream("localhost:3091");
        this.listeners = [];
        this._room = null;
        this.roomContents = [];
        this.roomRecord = null;
        this.objectRecords = {};
    }

    connect() {
        this.stream.login({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0MSIsImlhdCI6MTUxODEwMzAxOH0.uIbYP1DbVSoFA1EF7JXp84ZNMoZsHMvS8C85tqW8aKE' });
    }

    get room() {
        return this.room;
    }

    set room(room) {
        this._room = room;
        this.listeners.forEach((listener) => listener.onAllObjectsRemoved());
        this.updateRoomSubscription();
    }

    updateRoomContents(update = []) {
        const addedObjects = update.filter(item => this.roomContents.indexOf(item) < 0);
        const removedObjects = this.roomContents.filter(item => update.indexOf(item) < 0);
        this.roomContents = update;

        removedObjects.forEach(o => {
            if (this.objectRecords[o]) {
                this.objectRecords[o].discard();
                delete this.objectRecords[o];
                this.listeners.forEach((listener) => listener.onObjectRemoved(o));
            }
        });

        addedObjects.forEach(o => {
            if (!this.objectRecords[o]) {
                this.objectRecords[o] = this.stream.record.getRecord(`gameobject/${o}`);
                let firstUpdate = true;
                this.objectRecords[o].subscribe('value', (update) => {
                    this.listeners.forEach((listener) => firstUpdate ? listener.onObjectAdded(o, update) : listener.onObjectUpdated(o, update));
                    firstUpdate = false;
                }, true);
            }
        });
    }

    updateRoomSubscription() {
        console.log("getting room", this._room);
        const roomRecord = this.stream.record.getRecord(`room/${this._room.x}/${this._room.y}`)
        roomRecord.subscribe('value', (update) => this.updateRoomContents(update), true);
        if (this.roomRecord) {
            this.roomRecord.discard();
        }
        this.roomRecord = roomRecord;
    }

    addListener(listener) {
        if (this.listeners.indexOf(listener) === -1) {
            this.listeners.push(listener);
        }
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }
}