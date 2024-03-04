const config = require('./config');
const cluster = require('cluster');
const os = require('os');
const { coinRatio } = require('./config');


const input = process.argv[2];
const simCount = parseInt(input, 10);


function getRandom(max) {
    return Math.floor(Math.random() * max);
}


function getRandomMax(array){
    let randomMax = 1;
    for (let i = 0; i < array.length; i++){
        randomMax *= array[i].length;   
    }
    return randomMax
}


function generateBoard(numRows, numReels, reels) {
    const randomNumber = Math.floor(Math.random() * getRandomMax(reels)) // We will use only one random seed and generate stops for all reels
    let tempNumber = randomNumber;
    let board = [];
    for (let i = 0; i < numReels; i++) {
        const reel = reels[i]
        const reelLength = reel.length;
        const idx = tempNumber % reelLength;
        let stops = [];
        for (let j = 0; j < numRows; j++) {
            stops.push(reel[(idx + j) % reelLength]);
        }
        board.push(stops);
        tempNumber = Math.floor(tempNumber / reelLength);
    }
    return board 
}

function evaluateGrid(grid, lines, paytable) {
    const data = {
        winlines: [],
        totalWin: 0
    };
    const wild = config.wildCode;

    for (const line of lines) {
        let win = 0;
        let sym = grid[0][line[0]];
        let oak = 1;
        let wild_oak = 1;
        const lineLength = line.length;

        for (let i = 1; i < lineLength; i++) {
            const newSym = grid[i][line[i]];

            if (sym === wild) {
                if (newSym === wild) {
                    wild_oak++;
                } else {
                    sym = newSym;
                    oak++;
                }
            } else if (newSym === sym || newSym === wild) {
                oak++;
            } else {
                break;
            }
        }

        const wildPay = paytable[wild][wild_oak];
        const symPay = paytable[sym][oak];
        if (wildPay >= symPay) {
            win += wildPay;
            sym = wild;
            oak = wild_oak;
        } else {
            win += symPay;
        }

        const winline = {
            line: line.join(),
            symbol: sym,
            oak: oak,
            win: win
        };
        data.winlines.push(winline);
        data.totalWin += win;
    }

    return data;
}


function Round() {
    let roundData = {
        gameBoard: [],
        totalWin: 0
    }
    const board = generateBoard(config.numRows, config.numReels, config.reels);
    const evalResults = evaluateGrid(board, config.lines, config.paytable);
    roundData.gameBoard = board;
    roundData.winlines = evalResults.winlines;
    roundData.totalWin = evalResults.totalWin;
    return roundData;
}

if (cluster.isMaster) {
    console.time('Execution Time');
    const numCPUs = 2;//os.cpus().length; --> I am getting best performance at 2
    let aggregatedResults = {};
    let workersFinished = 0;

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();

        worker.on('message', (msg) => {
            aggregatedResults[worker.process.pid] = msg.result;
            workersFinished++;

            if (workersFinished === numCPUs) {
                const finalResult = processAggregatedResults(aggregatedResults);
                console.timeEnd('Execution Time');
                console.log(`RTP: ${finalResult}`);
            }
        });
    }

} 
else {
    const result = Simulation();
    process.send({ result });
    process.exit();
}


function processAggregatedResults(aggregatedResults) {
    const sum = Object.values(aggregatedResults).reduce((acc, cur) => acc + cur, 0);
    const average = sum / (Object.keys(aggregatedResults).length*config.coinRatio);
    return average;
}



function Simulation() {
    let totalOut = 0;
    let totalIn = 0;
    let sim = 0;
    while (sim < simCount){
        totalIn += config.coinRatio;
        totalOut += Round().totalWin;
        sim += 1;
    }
    return totalOut/totalIn;
}
console.log('RTP', Simulation())