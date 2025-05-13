import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, CurrencyCollection, external, MessageRelaxed, SendMode, Slice, toNano } from '@ton/core';
import { NigeClaimContract as SimpleCounter } from '../wrappers/SimpleCounter';
import '@ton/test-utils';
import { JettonWallet, TonClient, WalletContractV4, WalletContractV5R1, fromNano, internal } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';

const OP_CREATE_TASK = 0xcafebabe; // 32-bit op code
const DEPLOY_VALUE_TON = '0.1';

describe('SimpleCounter', () => {
    // let simpleCounter: SandboxContract<SimpleCounter>;

    // it('should deploy', async () => {
    //     const mnemonic =
    //         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
    //             ' ',
    //         );
    //     const key = await mnemonicToWalletKey(mnemonic);

    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });
    //     const wallet = WalletContractV5R1.create({
    //         workchain: 0,
    //         publicKey: key.publicKey,
    //         walletId: { networkGlobalId: -3 },
    //     });

    //     const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
    //     const walletContract = client.open(wallet);

    //     console.log('Wallet Address:', walletContract.address.toString());

    //     const res = await client.runMethod(jettonRootAddress, 'get_jetton_data');
    //     const totalSupply = res.stack.readBigNumber(); // [0] total_supply
    //     const mintable = res.stack.readBigNumber(); // [1] mintable flag (e.g., -1 or 0)
    //     const adminCell = res.stack.readCell(); // [2] admin_address (as Cell)
    //     const contentCell = res.stack.readCell(); // [3] content (Jetton metadata)
    //     const walletCodeCell = res.stack.readCell(); // [4] jetton_wallet_code

    //     console.log('cell', { totalSupply, mintable, adminCell, contentCell });

    //     const simpleCounterInit = await SimpleCounter.fromInit(jettonRootAddress, walletCodeCell);
    //     const simpleCounterAddress = simpleCounterInit.address;

    //     console.log('Target contract address:', simpleCounterAddress.toString());
    //     const seqno = await walletContract.getSeqno();

    //     try {
    //         const deployMsg = internal({
    //             to: simpleCounterInit.address,
    //             value: '0.05', // string or bigint
    //             bounce: false,
    //             init: simpleCounterInit.init,
    //             body: beginCell()
    //                 .storeUint(0, 32) // query_id
    //                 .storeStringTail('Deploy')
    //                 .endCell(),
    //         });

    //         // 5) send it via your wallet
    //         const res = await walletContract.sendTransfer({
    //             seqno,
    //             secretKey: key.secretKey,
    //             sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
    //             messages: [deployMsg],
    //         });
    //     } catch (err) {
    //         console.error('Failed to send message:', err);
    //         throw err;
    //     }
    // }, 15000);

    it('should test the get_jetton_root getter', async () => {
        const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
        // Test get_jetton_root getter
        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
        });

        const contractAddress = Address.parse('EQAdmaMV8ruFC8BK5nWKCRG-N8KRZRQOWU7trHzgl73OtEws');
        const res = await client.runMethod(contractAddress, 'get_jetton_root');
        const returnedJettonRoot = res.stack.readAddress();

        console.log('Contract Jetton Root:', returnedJettonRoot.toString());
        console.log('Expected Jetton Root:', jettonRootAddress.toString());

        // Verify the returned jetton root matches the expected value
        expect(returnedJettonRoot.toString()).toBe(jettonRootAddress.toString());
    }, 15000);

    it('should test has_claimed getter when user has not claimed', async () => {
        const mnemonic =
            'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
                ' ',
            );

        const key = await mnemonicToWalletKey(mnemonic);
        const wallet = WalletContractV5R1.create({
            workchain: 0,
            publicKey: key.publicKey,
            walletId: { networkGlobalId: -3 },
        });

        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
        });

        let walletContract = client.open(wallet);

        const contractAddress = Address.parse('EQAdmaMV8ruFC8BK5nWKCRG-N8KRZRQOWU7trHzgl73OtEws');
        const taskId = 1n;

        const addressCell = beginCell().storeAddress(walletContract.address).endCell();
        const res = await client.runMethod(contractAddress, 'has_claimed', [
            { type: 'int', value: taskId },
            { type: 'slice', cell: addressCell },
        ]);

        const hasClaimed = res.stack.readBoolean();
        console.log('Has User Claimed (Before Claiming):', hasClaimed);

        // User should not have claimed yet
        expect(hasClaimed).toBe(false);
    }, 15000);

    // it('should claim a task using new_claim', async () => {
    //     // Prepare new_claim parameters
    //     const taskId = 1; // The task ID we've created
    //     const codeInput = '21614'; // The code we used when creating the task

    //     // Build message for new_claim
    //     const body = beginCell()
    //         .storeUint(0, 32) // Default function ID for calling method
    //         .storeString('new_claim')
    //         .storeUint(taskId, 32)
    //         .storeStringTail(codeInput)
    //         .endCell();

    //     // Get wallet seqno
    //     const seqno = await walletContract.getSeqno();

    //     // Create message to contract
    //     const msg = internal({
    //         to: contractAddress,
    //         value: toNano('0.05'), // Enough TON for gas
    //         bounce: true,
    //         body: body,
    //     });

    //     // Send transaction
    //     const result = await walletContract.sendTransfer({
    //         seqno,
    //         secretKey: key.secretKey,
    //         sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
    //         messages: [msg],
    //     });

    //     console.log('Claim Transaction sent:', result);

    //     // Wait for transaction to complete
    //     await new Promise((resolve) => setTimeout(resolve, 10000));
    // }, 30000);

    it('should test has_claimed getter after claiming', async () => {
        const mnemonic =
            'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
                ' ',
            );

        const key = await mnemonicToWalletKey(mnemonic);
        const wallet = WalletContractV5R1.create({
            workchain: 0,
            publicKey: key.publicKey,
            walletId: { networkGlobalId: -3 },
        });

        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
        });

        let walletContract = client.open(wallet);

        const contractAddress = Address.parse('EQAdmaMV8ruFC8BK5nWKCRG-N8KRZRQOWU7trHzgl73OtEws');
        const taskId = 1n;
        const addressCell = beginCell().storeAddress(walletContract.address).endCell();

        const res = await client.runMethod(contractAddress, 'has_claimed', [
            { type: 'int', value: taskId },
            { type: 'cell', cell: addressCell },
        ]);

        const hasClaimed = res.stack.readBoolean();
        console.log('Has User Claimed (After Claiming):', hasClaimed);

        // User should have claimed now
        expect(hasClaimed).toBe(true);
    }, 15000);

    // it('should create task', async () => {
    //     // Set up wallet and client
    //     const mnemonic =
    //         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
    //             ' ',
    //         );
    //     const key = await mnemonicToWalletKey(mnemonic);

    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    //     const wallet = WalletContractV5R1.create({
    //         workchain: 0,
    //         publicKey: key.publicKey,
    //         walletId: { networkGlobalId: -3 },
    //     });

    //     const walletContract = client.open(wallet);
    //     console.log('Wallet Address:', walletContract.address.toString());

    //     // Get jetton data
    //     const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
    //     const res = await client.runMethod(jettonRootAddress, 'get_jetton_data');
    //     const totalSupply = res.stack.readBigNumber(); // [0] total_supply
    //     const mintable = res.stack.readBigNumber(); // [1] mintable flag (e.g., -1 or 0)
    //     const adminCell = res.stack.readCell(); // [2] admin_address (as Cell)
    //     const contentCell = res.stack.readCell(); // [3] content (Jetton metadata)
    //     const walletCodeCell = res.stack.readCell(); // [4] jetton_wallet_code

    //     // Contract address
    //     const contractAddress = Address.parse('EQAdmaMV8ruFC8BK5nWKCRG-N8KRZRQOWU7trHzgl73OtEws');

    //     // Get user's jetton wallet address
    //     const userJettonWalletRes = await client.runMethod(jettonRootAddress, 'get_wallet_address', [
    //         { type: 'slice', cell: beginCell().storeAddress(walletContract.address).endCell() },
    //     ]);
    //     const userJettonWalletAddress = userJettonWalletRes.stack.readAddress();
    //     console.log('User Jetton Wallet:', userJettonWalletAddress.toString());

    //     // Get contract's jetton wallet address
    //     const contractJettonWalletRes = await client.runMethod(jettonRootAddress, 'get_wallet_address', [
    //         { type: 'slice', cell: beginCell().storeAddress(contractAddress).endCell() },
    //     ]);
    //     const contractJettonWalletAddress = contractJettonWalletRes.stack.readAddress();
    //     console.log('Contract Jetton Wallet:', contractJettonWalletAddress.toString());

    //     // Calculate required jettons
    //     const rewardPerUser = toNano(23);
    //     const maxClaims = 5;
    //     const totalJettons = rewardPerUser * BigInt(maxClaims);

    //     // Prepare task creation message payload
    //     const taskCode = '21614';
    //     const deadlineHours = 3;

    //     // Build payload for the jetton transfer with task creation data
    //     const forwardPayload = beginCell()
    //         .storeUint(OP_CREATE_TASK, 32)
    //         .storeStringTail(taskCode)
    //         .storeUint(rewardPerUser, 64)
    //         .storeUint(maxClaims, 32)
    //         .storeUint(deadlineHours, 32)
    //         .endCell();

    //     // Get wallet seqno
    //     const seqno = await walletContract.getSeqno();

    //     // Build jetton transfer message to send USDT with task creation payload
    //     // This needs to go to user's USDT wallet, not directly to the contract
    //     const jettonTransferBody = beginCell()
    //         .storeUint(0xf8a7ea5, 32) // token transfer op
    //         .storeUint(0, 64) // query id
    //         .storeCoins(totalJettons) // amount of jettons to transfer
    //         .storeAddress(contractAddress) // destination address (the contract)
    //         .storeAddress(walletContract.address) // response destination
    //         .storeBit(0) // no custom payload
    //         .storeCoins(toNano('0.05')) // forward ton amount (for gas)
    //         .storeBit(1) // forward payload present
    //         .storeRef(forwardPayload) // forward payload with task creation data
    //         .endCell();

    //     // Message to user's jetton wallet to initiate the transfer
    //     const msg = internal({
    //         to: userJettonWalletAddress,
    //         value: toNano('0.1'), // funds to cover gas & forward amount
    //         bounce: true,
    //         body: jettonTransferBody,
    //     });

    //     // Send transaction
    //     const result = await walletContract.sendTransfer({
    //         seqno,
    //         secretKey: key.secretKey,
    //         sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
    //         messages: [msg],
    //     });

    //     console.log('Transaction sent:', result);
    // }, 30000); // Increased timeout
});
