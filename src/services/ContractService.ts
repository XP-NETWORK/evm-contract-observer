import fs from 'fs'
import {ContractStruct} from '../types'
import path from 'path'

class ContractService {


    async saveToFile(contracts:ContractStruct, name:string) {


        const json = JSON.stringify(contracts);
            var file = fs.createWriteStream(`src/constants/${name}.json`);
            file.write(json);
            file.end();
    }


    async readFromFile(name:string) {
        const json = fs.readFileSync(`src/constants/${name}.json`, {encoding: 'utf-8'});
        return json
    }
}

export default () => new ContractService()