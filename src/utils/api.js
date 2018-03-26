import request from 'superagent'

export function getFiles() {
    return new Promise((res, rej) => {
        request
            .get('http://localhost:3000/files')
            .set('content-type', 'application-json')
            .set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0MSIsImlhdCI6MTUxODEwMzAxOH0.uIbYP1DbVSoFA1EF7JXp84ZNMoZsHMvS8C85tqW8aKE')
            .end((err, resp) => {
                if (!err && resp.body) {
                    res(resp.body.data);
                } else {
                    rej(err);
                }
            });
    });

}

export function getFile(file) {
    return new Promise((res, rej) => {
        request
            .get('http://localhost:3000/file/' + file)
            .set('content-type', 'application/javascript')
            .set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0MSIsImlhdCI6MTUxODEwMzAxOH0.uIbYP1DbVSoFA1EF7JXp84ZNMoZsHMvS8C85tqW8aKE')
            .end((err, resp) => {
                if (!err && resp.body) {
                    res(resp.body.data);
                } else {
                    rej(err);
                }
            });
    });

}