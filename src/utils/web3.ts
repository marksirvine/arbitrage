import {ContractDetails} from "../interfaces/contracts.interface";
import Web3 from "web3";
import {Providers} from "../const/web3";

const web3 = new Web3(Providers.BSC);

export function makeContract(details: ContractDetails) {
    const {abi, address} = details;
    return new web3.eth.Contract(JSON.parse(abi), address);
}

export async function getCurrentBlock() : Promise<number>{
    return await web3.eth.getBlockNumber();
}