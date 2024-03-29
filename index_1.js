const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');

const simCount = parseInt(process.argv[2], 10) || 100; // Default to 100 if not provided
const numWorkers = os.cpus().length;
const simsPerWorker = Math.ceil(simCount / numWorkers);

let completedWorkers = 0;
let aggregateTotalOut = 0;
let aggregateTotalIn = 0;

console.time('Execution Time');

for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(path.resolve(__dirname, 'worker.js')); // Ensure 'worker.js' path is correct
    worker.postMessage({
        simCount: simsPerWorker
    });

    worker.on('message', (result) => {
        aggregateTotalOut += result.totalOut;
        aggregateTotalIn += result.totalIn;
        completedWorkers++;
        if (completedWorkers === numWorkers) {
            const finalRTP = aggregateTotalOut / aggregateTotalIn;
            console.log(`RTP: ${finalRTP}`);
            console.timeEnd('Execution Time');
            process.exit(0);
        }
    });

    worker.on('error', console.error);
}
