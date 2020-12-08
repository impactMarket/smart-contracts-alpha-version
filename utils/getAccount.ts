import path from 'path';
import { Wallet } from 'ethers';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const filePath = path.join(__dirname, '../.secret');

async function getAccount(): Promise<Wallet> {
    if (existsSync(filePath)) {
        const data = readFileSync(filePath, { encoding: 'utf-8' });
        return new Wallet(data)
    } else {
        let randomAccount = Wallet.createRandom();
        writeFileSync(filePath, randomAccount.privateKey);
        return randomAccount;
    }
}

export {
    getAccount
}