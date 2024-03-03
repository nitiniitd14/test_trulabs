const config = require('./config');
const cluster = require('cluster');
const os = require('os');


const input = process.argv[2];
const simCount = parseInt(input, 10);


function getRandom(max) {
    return Math.floor(Math.random() * max);
}


randomMax = 1;
for (let i = 0; i < config.numReels; i++){
    randomMax *= config.reels[i].length;   
}


function generateBoard(numRows, numReels, reels) {
    const randomNumber = Math.floor(Math.random() * randomMax)
    let tempNumber = randomNumber;
    let board = [];
    for (let i = 0; i < numReels; i++) {
        const idx = tempNumber % reels[i].length;
        let stops = [];
        for (let j = 0; j < numRows; j++) {
            stops.push(reels[i][(idx + j) % reels[i].length]);
        }
        board.push(stops);
        tempNumber = Math.floor(tempNumber / reels[i].length);
    }
    return board 
}

function evaluateGrid(grid, lines, paytable) {
    let data = {
        winlines: [],
        totalWin: 0
    };
    const wild = config.wildCode;
    for (const line of lines) {
        let sym = grid[0][line[0]];
        let oak = 1;
        let wild_oak = 1;
        let win = 0;
        let winline = {
            line: line.join()
        }
        for (let i = 1; i < line.length; i++){
            if (sym == wild){
                if (grid[i][line[i]] == wild) {
                    wild_oak += 1;
                }
                else {
                    sym = grid[i][line[i]];
                    oak += 1
                }
            }
            else if (grid[i][line[i]] == sym || grid[i][line[i]] == wild){
                oak += 1;
            }
            else{
                break;
            }
        }
        if (paytable[wild][wild_oak] >= paytable[sym][oak]){
            win += paytable[wild][wild_oak];
        }
        else {
            win += paytable[sym][oak];
        }
        winline.symbol = sym;
        winline.oak = oak;
        winline.win = win;
        data.winlines.push(winline)
        data.totalWin += win;
    }
    return data
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
    const numCPUs = os.cpus().length;
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
    const average = sum / Object.keys(aggregatedResults).length;
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
