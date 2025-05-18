import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {
    Address,
    beginCell,
    crc32c,
    CurrencyCollection,
    Dictionary,
    DictionaryValue,
    external,
    MessageRelaxed,
    SendMode,
    Slice,
    toNano,
} from '@ton/core';
import { NigeClaimContract as SimpleCounter } from '../wrappers/SimpleCounter';
import '@ton/test-utils';
import { JettonWallet, TonClient, WalletContractV4, WalletContractV5R1, fromNano, internal } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';

const OP_CREATE_TASK = 0xcafebabe; // 32-bit op code
const OP_CLAIM_TASK = 0x42a0fb6d;
const DEPLOY_VALUE_TON = '0.1';

describe('SimpleCounter', () => {
    let contractAddress_ = 'EQDN1pPvdiF5KCpGB1_CelWIEGpJOtQcwHnu45dWyrXw6cYR';

    // it('should deploy NigeClaimContract correctly', async () => {
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

    //     // Fetch jetton data for initialization parameters
    //     const res = await client.runMethod(jettonRootAddress, 'get_jetton_data');
    //     const totalSupply = res.stack.readBigNumber(); // [0] total_supply
    //     const mintable = res.stack.readBigNumber(); // [1] mintable flag (e.g., -1 or 0)
    //     const adminCell = res.stack.readCell(); // [2] admin_address (as Cell)
    //     const contentCell = res.stack.readCell(); // [3] content (Jetton metadata)
    //     const walletCodeCell = res.stack.readCell(); // [4] jetton_wallet_code

    //     console.log('Jetton data:', {
    //         totalSupply: totalSupply.toString(),
    //         mintable: mintable.toString(),
    //     });

    //     // Make sure we're using the correct contract type
    //     // Since you're importing NigeClaimContract as SimpleCounter
    //     const nigeClaimInit = await SimpleCounter.fromInit(jettonRootAddress, walletCodeCell);
    //     const contractAddress = nigeClaimInit.address;

    //     console.log('Target contract address:', contractAddress.toString());

    //     let contract = client.open(nigeClaimInit);

    //     // Check if contract already exists
    //     try {
    //         const contractInfo = await client.getContractState(contractAddress);
    //         console.log('Contract state:', contractInfo.state);

    //         if (contractInfo.state === 'active') {
    //             console.log('Contract already deployed and active');
    //             // return;
    //         }
    //     } catch (e) {
    //         console.log('Contract does not exist yet:', e);
    //     }

    //     const seqno = await walletContract.getSeqno();
    //     console.log('Current seqno:', seqno);

    //     try {
    //         // For deployment, we should match the expected initialization and message format
    //         // Looking at your contract, it expects just the initialization with no special message
    //         // const deployMsg = internal({
    //         //     to: contractAddress,
    //         //     value: '0.05', // Increased value to ensure enough funds for deployment
    //         //     bounce: false,
    //         //     init: nigeClaimInit.init,
    //         //     // Your contract doesn't appear to have a specific receiver for initialization
    //         //     // So we're sending a simple message with just a query_id
    //         //     body: beginCell()
    //         //         .storeUint(0, 32) // query_id
    //         //         .endCell(),
    //         // });

    //         const deployResult = await contract.send(
    //             walletContract.sender(key.secretKey),
    //             {
    //                 value: toNano('0.05'),
    //             },
    //             { $$type: 'Deploy', queryId: 0n },
    //         );

    //         console.log(deployResult);

    //         // Send via wallet
    //         // const res = await walletContract.sendTransfer({
    //         //     seqno,
    //         //     secretKey: key.secretKey,
    //         //     sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
    //         //     messages: [deployMsg],
    //         // });

    //         // console.log('Deployment transaction sent:', res);

    //         // Wait a bit and then check if the contract was deployed successfully
    //         await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    //         try {
    //             const newContractInfo = await client.getContractState(contractAddress);
    //             console.log('New contract state after deployment:', newContractInfo.state);
    //         } catch (e) {
    //             console.error('Failed to check contract state after deployment:', e);
    //         }
    //     } catch (err) {
    //         console.error('Failed to send deployment message:', err);
    //         throw err;
    //     }
    // }, 40000); // Increased timeout

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    it('should test the get_jetton_root getter', async () => {
        const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
        // Test get_jetton_root getter
        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
        });

        const contractAddress = Address.parse(contractAddress_);
        const res = await client.runMethod(contractAddress, 'get_jetton_root');
        const returnedJettonRoot = res.stack.readAddress();

        console.log('Contract Jetton Root:', returnedJettonRoot.toString());
        console.log('Expected Jetton Root:', jettonRootAddress.toString());

        // Verify the returned jetton root matches the expected value
        expect(returnedJettonRoot.toString()).toBe(jettonRootAddress.toString());
    }, 15000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

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
    //     const contractAddress = Address.parse(contractAddress_);

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
    //     const taskCode = 120;
    //     const deadlineHours = 3n;

    //     // // Build payload for the jetton transfer with task creation data
    //     // const forwardPayload = beginCell()
    //     //     .storeUint(OP_CREATE_TASK, 32)
    //     //     .storeUint(taskCode, 64)
    //     //     .storeUint(rewardPerUser, 64)
    //     //     .storeUint(maxClaims, 32)
    //     //     .storeUint(deadlineHours, 32)
    //     //     .endCell();

    //     const forwardPayload = beginCell()
    //         .storeUint(OP_CREATE_TASK, 32) // Operation code
    //         .storeUint(taskCode, 64) // 64-bit task ID
    //         .storeUint(rewardPerUser, 64) // Reward per user
    //         .storeUint(maxClaims, 32) // Max claims
    //         .storeUint(deadlineHours, 32) // Deadline hours
    //         .endCell();

    //     // Build jetton transfer message to send USDT with task creation payload
    //     // This needs to go to user's USDT wallet, not directly to the contract
    //     const seqno = await walletContract.getSeqno();
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
    //         sendMode: SendMode.PAY_GAS_SEPARATELY,
    //         messages: [msg],
    //     });

    //     console.log('Transaction sent:', result);
    // }, 30000); // Increased timeout

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    async function fetchAllTasks(client: TonClient, contractAddress: Address) {
        try {
            // Step 1: Get all task IDs
            const taskIdsResult = await client.runMethod(contractAddress, 'get_all_task_ids', []);
            console.log(taskIdsResult.stack);
            const taskCell = taskIdsResult.stack.readCell();
            console.log('Task cell:', taskCell.toString());

            // Parse the cell - first byte is count, then 32-bit task IDs
            const cs = taskCell.beginParse();
            const taskCount = cs.loadUint(8); // First 8 bits is the count
            console.log(`Found ${taskCount} tasks in the contract`);
            // const taskCount = taskIdsResult.stack.readCell().asSlice().loadInt(8);
            console.log(`Found ${taskCount} tasks in the contract`);

            if (taskCount === 0) {
                console.log('No tasks exist in the contract');
                return [];
            }

            // Read all task IDs from the result
            const taskIds = [];
            for (let i = 0; i < taskCount; i++) {
                taskIds.push(taskIdsResult.stack.readNumber());
            }
            console.log('Task IDs:', taskIds);

            // Step 2: Fetch details for each task
            const taskDetails = [];
            for (const taskId of taskIds) {
                const taskInfoResult = await client.runMethod(contractAddress, 'get_task_info', [
                    { type: 'int', value: BigInt(taskId) },
                ]);

                // Parse the task info from the stack
                const task = {
                    id: taskInfoResult.stack.readNumber(),
                    code: taskInfoResult.stack.readBigNumber(), // Verification code
                    owner: taskInfoResult.stack.readAddress(),
                    deadline: taskInfoResult.stack.readNumber(),
                    maxClaims: taskInfoResult.stack.readNumber(),
                    currentClaims: taskInfoResult.stack.readNumber(),
                    rewardPerUser: taskInfoResult.stack.readBigNumber(),
                    poolAmount: taskInfoResult.stack.readBigNumber(),
                };

                // Convert timestamps to readable dates
                task.deadline = Number(new Date(task.deadline * 1000).toLocaleString());

                // Calculate if task is active
                const now = Math.floor(Date.now() / 1000);
                let isActive = task.deadline > now && task.currentClaims < task.maxClaims;

                taskDetails.push(task);

                console.log(`\nTask #${task.id} Details:`);
                console.log(`- Verification Code: ${task.code}`);
                console.log(`- Owner: ${task.owner}`);
                console.log(`- Deadline: ${task.deadline} (${task.deadline})`);
                console.log(`- Claims: ${task.currentClaims}/${task.maxClaims}`);
                console.log(`- Reward: ${task.rewardPerUser} nanoTON per user`);
                console.log(`- Pool: ${task.poolAmount} nanoTON remaining`);
                console.log(`- Status: ${isActive ? 'Active' : 'Inactive'}`);
            }

            return taskDetails;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    }

    // // Example usage in a test
    it('should fetch and display all tasks', async () => {
        // Setup client
        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
        });

        const contractAddress = Address.parse(contractAddress_);

        // Fetch all tasks
        const tasks = await fetchAllTasks(client, contractAddress);

        // Verify if the specific task ID exists
        const taskCode = 1; // The task ID we're trying to claim
        const taskExists = tasks.some((task) => task.id === taskCode);

        if (!taskExists) {
            console.log(`Task ID ${taskCode} doesn't exist! You need to create it before claiming.`);
        } else {
            const task = tasks.find((t) => t.id === taskCode);
            console.log(`Found task ID ${taskCode} with verification code ${task?.code}`);
        }
    });

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    it('should claim a task using TON transfer with forwarded payload', async () => {
        // Constants
        const taskCode = 1; // The task ID we've created
        const codeInput = 120; // The code we used when creating the task
        const OP_CLAIM_TASK = 0x42a0fb6d; // Replace with your actual operation code

        // Setup wallet
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

        // Setup client
        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
        });

        const contractAddress = Address.parse(contractAddress_);
        const walletContract = client.open(wallet);

        // Check if task already claimed (optional)
        try {
            const hasClaimed = await client.runMethod(contractAddress, 'has_claimed', [
                { type: 'int', value: BigInt(taskCode) },
                { type: 'slice', cell: beginCell().storeAddress(walletContract.address).endCell() },
            ]);

            const alreadyClaimed = hasClaimed.stack.readBoolean();
            console.log('User has already claimed:', alreadyClaimed);

            if (alreadyClaimed) {
                console.log('Task already claimed, skipping test');
                return;
            }
        } catch (error) {
            console.error('Error checking claim status:', error);
        }

        // APPROACH 1: Direct claim payload in TON transfer
        // Create a claim payload cell directly
        const directClaimPayload = beginCell()
            .storeUint(OP_CLAIM_TASK, 32) // Operation code for claim task
            .storeUint(taskCode, 32) // Task ID
            .storeUint(codeInput, 64) // Code for verification
            .endCell();

        // APPROACH 2: Claim payload in a reference cell (more common pattern)
        // Create a claim payload cell (similar pattern to task creation)
        const claimPayload = beginCell()
            .storeUint(OP_CLAIM_TASK, 32) // Operation code for claim task
            .storeUint(taskCode, 32) // Task ID
            .storeUint(codeInput, 64) // Code for verification
            .endCell();

        // Create TON transfer with payload in reference
        const tonTransferBody = beginCell()
            .storeUint(0, 32) // Simple TON transfer op code
            .storeUint(0, 64) // Query ID
            .storeRef(claimPayload) // Store the claim payload in a cell reference
            .endCell();

        // Create the message - Choose either approach based on your contract implementation
        // UNCOMMENT ONE OF THESE:

        // APPROACH 1: Direct claim in body
        // const msg = internal({
        //   to: contractAddress,
        //   value: toNano('0.1'), // Gas for processing
        //   bounce: true,
        //   body: directClaimPayload,
        // });

        // APPROACH 2: Claim in reference (more common)
        const msg = internal({
            to: contractAddress,
            value: toNano('0.1'), // Gas for processing
            bounce: true,
            body: tonTransferBody,
        });

        // Get wallet seqno and send transaction
        const seqno = await walletContract.getSeqno();
        const result = await walletContract.sendTransfer({
            seqno,
            secretKey: key.secretKey,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            messages: [msg],
        });

        console.log('Claim Transaction sent:', result);

        // Wait for transaction to complete
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Verify the claim was successful (optional)
        try {
            const hasClaimed = await client.runMethod(contractAddress, 'has_claimed', [
                { type: 'int', value: BigInt(taskCode) },
                { type: 'slice', cell: beginCell().storeAddress(walletContract.address).endCell() },
            ]);

            const nowClaimed = hasClaimed.stack.readBoolean();
            console.log('Task now claimed:', nowClaimed);
            expect(nowClaimed).toBe(true);
        } catch (error) {
            console.error('Error verifying claim status:', error);
        }
    }, 30000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    // it('should claim a task using TON transfer with forwarded payload', async () => {
    //     // Prepare new_claim parameters
    //     const taskCode = 1; // The task ID we've created
    //     const codeInput = 120; // The code we used when creating the task
    //     const OP_CLAIM_TASK = 0x42a0fb6d; // Verified from contract code

    //     const mnemonic =
    //         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
    //             ' ',
    //         );
    //     const key = await mnemonicToWalletKey(mnemonic);

    //     const wallet = WalletContractV5R1.create({
    //         workchain: 0,
    //         publicKey: key.publicKey,
    //         walletId: { networkGlobalId: -3 },
    //     });

    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    // const contractAddress = Address.parse(contractAddress_);
    //     const walletContract = client.open(wallet);

    //     try {
    //         const hasClaimed = await client.runMethod(contractAddress, 'has_claimed', [
    //             { type: 'int', value: BigInt(taskCode) },
    //             { type: 'slice', cell: beginCell().storeAddress(walletContract.address).endCell() },
    //         ]);

    //         const alreadyClaimed = hasClaimed.stack.readBoolean();
    //         console.log('User has already claimed:', alreadyClaimed);

    //         if (alreadyClaimed) {
    //             console.log('Task already claimed, skipping test');
    //             return;
    //         }
    //     } catch (error) {
    //         console.error('Error checking claim status:', error);
    //     }

    //     // Create a claim payload cell (similar pattern to task creation)
    //     const claimPayload = beginCell()
    //         .storeUint(OP_CLAIM_TASK, 32) // Operation code for claim task
    //         .storeUint(taskCode, 32) // Task ID
    //         .storeUint(codeInput, 64) // Code for verification
    //         .endCell();

    //     // Create TON transfer with payload
    //     const tonTransferBody = beginCell()
    //         .storeUint(0, 32) // Simple TON transfer op code
    //         .storeUint(0, 64) // Query ID
    //         .storeRef(claimPayload) // Store the claim payload in a cell reference
    //         .endCell();

    //     // Send the message
    //     const msg = internal({
    //         to: contractAddress,
    //         value: toNano('0.1'), // Gas for processing
    //         bounce: true,
    //         body: tonTransferBody,
    //     });

    //     // Get wallet seqno and send transaction
    //     const seqno = await walletContract.getSeqno();
    //     const result = await walletContract.sendTransfer({
    //         seqno,
    //         secretKey: key.secretKey,
    //         sendMode: SendMode.PAY_GAS_SEPARATELY,
    //         messages: [msg],
    //     });

    //     console.log('Claim Transaction sent:', result);

    //     // Wait for transaction to complete
    //     await new Promise((resolve) => setTimeout(resolve, 10000));
    // }, 30000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    // it('should test the all_tasks getter', async () => {
    //     // 1. Set up TonClient for the testnet
    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    //     // 2. Contract address
    // const contractAddress = Address.parse(contractAddress_);

    //     // 3. Call the all_tasks getter
    //     const res = await client.runMethod(contractAddress, 'all_tasks');

    //     // 4. Read the returned cell
    //     const dictCell = res.stack.readCell();
    //     expect(dictCell).toBeDefined();

    //     // --- parseClaimedMap: use the dictionary iterator directly ---
    //     function parseClaimedMap(slice: Slice): Record<string, boolean> {
    //         const claimedDict = Dictionary.loadDirect(
    //             Dictionary.Keys.Address(),
    //             Dictionary.Values.Bool(),
    //             slice.asCell(),
    //         );
    //         const claimed: Record<string, boolean> = {};
    //         // Dictionary<K,V> is iterable over [K,V]
    //         for (const [addr, hasClaimed] of claimedDict) {
    //             claimed[addr.toString()] = hasClaimed;
    //         }
    //         return claimed;
    //     }

    //     // --- parseTask struct remains unchanged ---
    //     function parseTask(slice: Slice): Task {
    //         const code = slice.loadUint(64);
    //         const rewardPerUser = slice.loadUint(64);
    //         const maxClaims = Number(slice.loadUint(32));
    //         const currentClaims = Number(slice.loadUint(32));
    //         const creator = slice.loadAddress();
    //         const deadline = slice.loadUint(64);

    //         let claimed: Record<string, boolean> = {};
    //         if (slice.remainingRefs > 0) {
    //             const claimedRef = slice.loadRef().beginParse();
    //             claimed = parseClaimedMap(claimedRef);
    //         }

    //         return {
    //             code: BigInt(code),
    //             rewardPerUser: BigInt(rewardPerUser),
    //             maxClaims,
    //             currentClaims,
    //             creator: creator.toString(),
    //             deadline: BigInt(deadline),
    //             claimed,
    //         };
    //     }

    //     // --- Provide a DictionaryValue<Task> directly ---
    //     const TaskValue: DictionaryValue<Task> = {
    //         parse: parseTask,
    //         serialize: () => {
    //             throw new Error('not needed in test');
    //         },
    //     };

    //     // 5. Load the outer dictionary of tasks
    //     const taskDict = Dictionary.loadDirect(
    //         Dictionary.Keys.Int(32), // 32‑bit integer keys
    //         TaskValue, // our custom parser
    //         dictCell!,
    //     );

    //     // 6. Convert to array via the dictionary iterator
    //     const tasks: Array<{ id: number } & Task> = [];
    //     for (const [id, task] of taskDict) {
    //         tasks.push({ id, ...task });
    //     }

    //     // 7. Log & basic validation
    //     console.log(`Parsed ${tasks.length} tasks.`);
    //     expect(Array.isArray(tasks)).toBe(true);
    // }, 15000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    // it('should test has_claimed getter when user has not claimed', async () => {
    //     const mnemonic =
    //         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
    //             ' ',
    //         );

    //     const key = await mnemonicToWalletKey(mnemonic);
    //     const wallet = WalletContractV5R1.create({
    //         workchain: 0,
    //         publicKey: key.publicKey,
    //         walletId: { networkGlobalId: -3 },
    //     });

    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    //     let walletContract = client.open(wallet);

    // const contractAddress = Address.parse(contractAddress_);
    //     const taskId = 1n;

    //     const addressCell = beginCell().storeAddress(walletContract.address).endCell();
    //     const res = await client.runMethod(contractAddress, 'has_claimed', [
    //         { type: 'int', value: taskId },
    //         { type: 'slice', cell: addressCell },
    //     ]);

    //     const hasClaimed = res.stack.readBoolean();
    //     console.log('Has User Claimed (Before Claiming):', hasClaimed);

    //     // User should not have claimed yet
    //     expect(hasClaimed).toBe(false);
    // }, 15000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    // it('should claim a task using new_claim', async () => {
    //     // Prepare new_claim parameters
    //     const taskId = 1; // The task ID we've created
    //     const codeInput = '21614'; // The code we used when creating the task

    //     const mnemonic =
    //         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
    //             ' ',
    //         );
    //     const key = await mnemonicToWalletKey(mnemonic);

    //     const wallet = WalletContractV5R1.create({
    //         workchain: 0,
    //         publicKey: key.publicKey,
    //         walletId: { networkGlobalId: -3 },
    //     });

    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    // const contractAddress = Address.parse(contractAddress_);

    //     const walletContract = client.open(wallet);
    //     console.log('Wallet Address:', walletContract.address.toString());

    //     // Build message for new_claim
    //     const body = beginCell()
    //         .storeUint(0, 32) // Default function ID for calling method
    //         .storeStringTail('new_claim')
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

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    // it('should test has_claimed getter after claiming', async () => {
    //     const mnemonic =
    //         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
    //             ' ',
    //         );

    //     const key = await mnemonicToWalletKey(mnemonic);
    //     const wallet = WalletContractV5R1.create({
    //         workchain: 0,
    //         publicKey: key.publicKey,
    //         walletId: { networkGlobalId: -3 },
    //     });

    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    //     let walletContract = client.open(wallet);

    //     const contractAddress = Address.parse('EQDHrR00s4FfMeXsgMHVum4cFGiWUjo_EyX7LxJMukrtFrok');
    //     const taskId = 1n;
    //     const addressCell = beginCell().storeAddress(walletContract.address).endCell();

    //     const res = await client.runMethod(contractAddress, 'has_claimed', [
    //         { type: 'int', value: taskId },
    //         { type: 'cell', cell: addressCell },
    //     ]);

    //     const hasClaimed = res.stack.readBoolean();
    //     console.log('Has User Claimed (After Claiming):', hasClaimed);

    //     // User should have claimed now
    //     expect(hasClaimed).toBe(true);
    // }, 15000);
});

// it('should hhhhh claim a task using new_claim', async () => {
//     // Prepare new_claim parameters
//     const taskId = 1; // The task ID we've created
//     const codeInput = '21614'; // The code we used when creating the task

//     const mnemonic =
//         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
//             ' ',
//         );
//     const key = await mnemonicToWalletKey(mnemonic);

//     const wallet = WalletContractV5R1.create({
//         workchain: 0,
//         publicKey: key.publicKey,
//         walletId: { networkGlobalId: -3 },
//     });

//     const client = new TonClient({
//         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
//         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
//     });

//     const contractAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');

//     const walletContract = client.open(wallet);
//     console.log('Wallet Address:', walletContract.address.toString());

//     // Build message for new_claim
//     // For TON SDK, we need to use beginCell() and properly encode parameters
//     const body = beginCell()
//         .storeUint(0, 32) // Default function ID for calling method
//         .storeStringTail('new_claim') // Method name
//         .storeUint(taskId, 32) // Task ID
//         .storeRef(beginCell().storeStringTail(codeInput).endCell()) // Store code input as a ref cell with storeStringTail
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

// -------------------------------------------------------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️-------------------------------------------------

// it('should wwwwwwwww claim a task using new_claim', async () => {
//     // Prepare new_claim parameters
//     const taskCode = 1; // The task ID we've created
//     const codeInput = 120; // The code we used when creating the task

//     const mnemonic =
//         'stand window ill evil laugh cricket fantasy finish detail alcohol dune meadow prefer banner rough ball body empty easy lyrics essay fruit slice suit'.split(
//             ' ',
//         );
//     const key = await mnemonicToWalletKey(mnemonic);

//     const wallet = WalletContractV5R1.create({
//         workchain: 0,
//         publicKey: key.publicKey,
//         walletId: { networkGlobalId: -3 },
//     });

//     const client = new TonClient({
//         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
//         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
//     });

// const contractAddress = Address.parse(contractAddress_);

//     const walletContract = client.open(wallet);
//     console.log('Wallet Address:', walletContract.address.toString());

//     try {
//         const hasClaimed = await client.runMethod(contractAddress, 'has_claimed', [
//             { type: 'int', value: BigInt(taskCode) },
//             { type: 'slice', cell: beginCell().storeAddress(walletContract.address).endCell() },
//         ]);

//         const alreadyClaimed = hasClaimed.stack.readBoolean();
//         console.log('User has already claimed:', alreadyClaimed);

//         if (alreadyClaimed) {
//             console.log('Task already claimed, skipping test');
//             return;
//         }
//     } catch (error) {
//         console.error('Error checking claim status:', error);
//         // Continue anyway, as the error might be due to the task not existing yet
//     }

//     // Build message for new_claim with the right ABI structure
//     // For external method calls, we typically use op + function_id approach

//     const messageBody = beginCell()
//         .storeUint(OP_CLAIM_TASK, 32) // Operation code
//         .storeUint(taskCode, 32) // Task ID
//         .storeUint(codeInput, 64) // Code for verification
//         .endCell();

//     const msg = internal({
//         to: contractAddress,
//         value: toNano('0.1'), // Increased value to ensure enough gas
//         bounce: true,
//         body: messageBody,
//     });
//     // Get wallet seqno
//     const seqno = await walletContract.getSeqno();

//     // Send transaction
//     const result = await walletContract.sendTransfer({
//         seqno,
//         secretKey: key.secretKey,
//         sendMode: SendMode.PAY_GAS_SEPARATELY, // Only this mode, don't ignore errors
//         messages: [msg],
//     });

//     console.log('Claim Transaction sent:', result);

//     // Wait for transaction to complete
//     await new Promise((resolve) => setTimeout(resolve, 10000));
// }, 30000);

//  ------------------------------------------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️----------------------------------------------------------------------------------

type Task = {
    code: bigint;
    rewardPerUser: bigint;
    maxClaims: number;
    currentClaims: number;
    creator: string;
    deadline: bigint;
    claimed: Record<string, boolean>;
};
