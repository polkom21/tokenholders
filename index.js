/**
 * Get all token holders in web3js
 *
 * @author Krzysztof Reniecki <polkom21@gmail.com>
 */

const web3 = require("web3");
const tokenAbi = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    }
];
const tokenAddress = "0x";
const host = "https://mainnet.infura.io/v3/";

const web3Instance = new web3(new web3.providers.HttpProvider(host))
const tokenInstance = new web3Instance.eth.Contract(tokenAbi, tokenAddress)

let holders = []

function getHolders(from, to = 'latest') {
    return new Promise(resolve => {
        tokenInstance.getPastEvents('allEvents', { fromBlock: from, toBlock: to }).then(events => {
            events.map(event => {
                if (event.returnValues && event.returnValues.to) {
                    const holderFindIndex = holders.findIndex(h => h.address.toUpperCase() === event.returnValues.to.toUpperCase())
                    if (holderFindIndex < 0) {
                        holders.push({
                            address: event.returnValues.to
                        })
                    }
                }
            })

            Promise.all(
                holders.map((holder, index) =>
                    new Promise(resolve => {
                        tokenInstance.methods.balanceOf(holder.address).call()
                        .then(balance => {
                            holder.balance = balance / Math.pow(10, 8)
                            resolve(holder)
                        })
                    })
                )
            ).then((data) => {
                holders = data.sort((a, b) => b.balance - a.balance)
                resolve()
            })
        })
    })
}

const CHUNK_SIZE = 100000;
web3Instance.eth.getBlockNumber().then(block => {
    let chunks = []

    for(let i = 0; i < Math.round(block / CHUNK_SIZE); i++) {
        chunks.push({
            from: i * CHUNK_SIZE,
            to: (i+1) * CHUNK_SIZE,
        })
    }
    chunks.push({
        from: chunks[chunks.length - 1].to,
        to: 'latest'
    })

    Promise.all(chunks.map(chunk =>
        getHolders(chunk.from, chunk.to)
    )).then(() => {
        console.log(holders)
        console.log(holders.length)
    })
})
