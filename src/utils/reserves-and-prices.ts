import {ContractDetails} from "../interfaces/contracts.interface";
import {makeContract} from "./web3";


export const getContractReserves = async (pair: ContractDetails) => {
    const contract = makeContract(pair);
    const reserves = await contract.methods.getReserves().call();
    const decimals = await contract.methods.decimals().call();

    // 18 decimals
    const reserve0 = reserves._reserve0 * Math.pow(10, -decimals);
    const reserve1 = reserves._reserve1 * Math.pow(10, -decimals);

    return {reserve0, reserve1};
}

export const getPriceFromReserves = (reserve0:number, reserve1:number) => {
    return reserve0 / reserve1;
}
