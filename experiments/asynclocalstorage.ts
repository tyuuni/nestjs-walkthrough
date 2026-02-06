import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile } from 'node:fs/promises';

const asyncLocalStorage = new AsyncLocalStorage();

const play1 = async () => {
    asyncLocalStorage.run({ traceId: 'play1-1' }, () => {
        console.log(asyncLocalStorage.getStore());
    });
    asyncLocalStorage.run({ traceId: 'play1-2' }, () => {
        console.log(asyncLocalStorage.getStore());
    });
};

const play2 = async () => {
    asyncLocalStorage.run({ traceId: 'play2-1' }, async () => {
        const store = await new Promise((resolve) => {
            setTimeout(() => {
                console.log('inside promise', asyncLocalStorage.getStore());
                resolve(asyncLocalStorage.getStore());
            }, 1000);
        });
        console.log('after promise', store);
    });
};

const play3 = async () => {
    asyncLocalStorage.run({ traceId: 'play3-1' }, async () => {
        console.log('before readfile', asyncLocalStorage.getStore());
        const content = await readFile('./README.md');
        console.log('after readfile', asyncLocalStorage.getStore());
    });
};

const play4 = async () => {
    asyncLocalStorage.run({ traceId: 'play4-1-outer' }, async () => {
        console.log('before readfile outer', asyncLocalStorage.getStore());
        await asyncLocalStorage.run({ traceId: 'play4-1-inner' }, async () => {
            console.log('before readfile inner', asyncLocalStorage.getStore());
            const content = await readFile('./README.md');
            console.log('after readfile inner', asyncLocalStorage.getStore());
        });
        console.log('after readfile outer', asyncLocalStorage.getStore());
    });
};

Promise.all([play1(), play2(), play3(), play4()]);
