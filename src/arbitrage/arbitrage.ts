import {ContractDetails} from "../interfaces/contracts.interface";
import {CakeABI, CakeAddresses} from "../const/cake";
import {BakeAddresses} from "../const/bake";
import {getContractReserves, getPriceFromReserves} from "../utils/reserves-and-prices";
import {getCurrentBlock} from "../utils/web3";

const blockTime = 500;
let latestKnownBlockNumber = -1;

export async function startLoop() {
    while (true) {
        let currentBlockNum = await getCurrentBlock();
        if (latestKnownBlockNumber == -1 || currentBlockNum > latestKnownBlockNumber) {
            await processBlock2(latestKnownBlockNumber == -1 ? currentBlockNum : latestKnownBlockNumber + 1);
        }
        setTimeout(getCurrentBlock, blockTime)
    }
}

// Our function that will triggered for every block
// async function processBlock(blockNumber:number) {
//
//     latestKnownBlockNumber = blockNumber;
//
//     const bakeWbnbBusdContract: ContractDetails = {
//         abi: CakeABI.ABI,
//         address: BakeAddresses.WBNB_BUSD
//     }
//
//     const cakeWbnbBusdContract: ContractDetails = {
//         abi: CakeABI.ABI,
//         address: CakeAddresses.WBNB_BUSD
//     }
//
//     let {reserve0, reserve1} = await getContractReserves(bakeWbnbBusdContract);
//     const bakePrice = getPriceFromReserves(reserve0, reserve1);
//     let {reserve0:reserve2, reserve1:reserve3} = await getContractReserves(cakeWbnbBusdContract);
//     const cakePrice = getPriceFromReserves(reserve2, reserve3);
//
//     console.log("We process block: " + blockNumber)
//     //PRICES
//     console.log(`Bake\n r0 (wbnb): ${reserve0}, r1 (busd): ${reserve1}, price (wbnb/busd) = ${bakePrice}, price (busd/wbnb) = ${1/bakePrice}`);
//     console.log(`Cake\n r0 (wbnb): ${reserve2}, r1 (busd): ${reserve3}, price (wbnb/busd) = ${cakePrice}, price (busd/wbnb) = ${1/cakePrice}`);
//     const wBnbPrice = (reserve0+reserve2) / (reserve1+reserve3)
//     console.log(`WBNB True Price: ${wBnbPrice}, 1/price = ${1/wBnbPrice}`)
//
//     // AtoB
//     const aToB = ((reserve0  * 1) / reserve1) < wBnbPrice
//     console.log(`aToB: ${aToB}`)
//
//     const bakeInvariant = reserve0 * reserve1;
//     // const cakeInvariant = reserve2 * reserve3;
//
//     const leftSide = Math.sqrt(
//         (
//             bakeInvariant *
//             (aToB ? wBnbPrice : 1) /
//             (aToB? 1 : wBnbPrice)
//         )
//     )
//     const rightSide = (aToB ? reserve0:reserve1)
//     console.log(`Left side: ${leftSide}, Right side: ${rightSide}`)
//
//     const amountIn = leftSide - rightSide;
//
//     if (leftSide < rightSide) {
//         console.log("false 0")
//     } else {
//         console.log(amountIn)
//     }
//
//     if (!aToB) {
//         const reserve1Arb = reserve1 + amountIn;
//         const reserve3Arb = reserve3 - amountIn;
//
//         const bakePriceArb = getPriceFromReserves(reserve0, reserve1Arb);
//         const cakePriceArb = getPriceFromReserves(reserve2, reserve3Arb);
//
//         console.log(`Bake price arb: ${1/bakePriceArb}`)
//         console.log(`Cake price arb: ${1/cakePriceArb}`)
//     }
// }


// Our function that will triggered for every block
async function processBlock2(blockNumber: number) {

    latestKnownBlockNumber = blockNumber;

    const bakeWbnbBusdContract: ContractDetails = {
        abi: CakeABI.ABI,
        address: BakeAddresses.WBNB_BUSD
    }

    const cakeWbnbBusdContract: ContractDetails = {
        abi: CakeABI.ABI,
        address: CakeAddresses.WBNB_BUSD
    }

    let {reserve0, reserve1} = await getContractReserves(bakeWbnbBusdContract);
    const bakePrice = getPriceFromReserves(reserve0, reserve1);
    let {reserve0: reserve2, reserve1: reserve3} = await getContractReserves(cakeWbnbBusdContract);
    const cakePrice = getPriceFromReserves(reserve2, reserve3);

    console.log("We process block: " + blockNumber)

    //PRICES
    console.log(`Bake\n r0 (wbnb): ${reserve0}, r1 (busd): ${reserve1}, price (wbnb/busd) = ${bakePrice}, price (busd/wbnb) = ${1 / bakePrice}`);
    console.log(`Cake\n r0 (wbnb): ${reserve2}, r1 (busd): ${reserve3}, price (wbnb/busd) = ${cakePrice}, price (busd/wbnb) = ${1 / cakePrice}`);
    const wBnbPrice = (reserve0 + reserve2) / (reserve1 + reserve3)
    console.log(`WBNB True Price: ${wBnbPrice}, 1/price = ${1 / wBnbPrice}`)

    // Iteration 1 moving bUsd to equilibriate utils

    let cakeWbnbPerc = (reserve2 / (reserve0 + reserve2));
    let cakeBusdPerc = (reserve3 / (reserve1 + reserve3));
    let percDiff = cakeWbnbPerc - cakeBusdPerc;
    let bUsdToMove = percDiff * reserve3;
    let bUsdToMoveTotal = bUsdToMove;


    let reserve1Arb = reserve1 - bUsdToMove;
    let reserve3Arb = reserve3 + bUsdToMove;


    // Iteration 2
    cakeWbnbPerc = (reserve2 / (reserve0 + reserve2));
    cakeBusdPerc = (reserve3Arb / (reserve1Arb + reserve3Arb));
    percDiff = cakeWbnbPerc - cakeBusdPerc;
    bUsdToMove = percDiff * reserve3Arb;
    bUsdToMoveTotal = bUsdToMoveTotal + bUsdToMove;


    reserve1Arb = reserve1Arb - bUsdToMove;
    reserve3Arb = reserve3Arb + bUsdToMove;

    // Iteration 3
    cakeWbnbPerc = (reserve2 / (reserve0 + reserve2));
    cakeBusdPerc = (reserve3Arb / (reserve1Arb + reserve3Arb));
    percDiff = cakeWbnbPerc - cakeBusdPerc;
    bUsdToMove = percDiff * reserve3Arb;
    bUsdToMoveTotal = bUsdToMoveTotal + bUsdToMove;

    reserve1Arb = reserve1Arb - bUsdToMove;
    reserve3Arb = reserve3Arb + bUsdToMove;

    console.log(1 / getPriceFromReserves(reserve0, reserve1Arb));
    console.log(1 / getPriceFromReserves(reserve2, reserve3Arb));
    console.log(`bUsdToMoveTotal: ${bUsdToMoveTotal}`)
    // console.log(`Rough Profit: ${Math.abs(bUsdToMoveTotal * ((1 / bakePrice) - (1 / cakePrice)))}`)
}


