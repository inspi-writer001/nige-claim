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
    let contractAddress_ = 'EQC3F0ZdiENG5YDVRQIDL3pp9GmGPYD8Li5YwsraGVqIIPIB';

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
    //             return;
    //         }
    //     } catch (e) {
    //         console.log('Contract does not exist yet:', e);
    //     }

    //     const seqno = await walletContract.getSeqno();
    //     console.log('Current seqno:', seqno);

    //     try {
    //         const deployResult = await contract.send(
    //             walletContract.sender(key.secretKey),
    //             {
    //                 value: toNano('0.05'),
    //             },
    //             { $$type: 'Deploy', queryId: 0n },
    //         );

    //         console.log(deployResult);

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

    // it('should test the get_jetton_root getter', async () => {
    //     const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
    //     // Test get_jetton_root getter
    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    //     const contractAddress = Address.parse(contractAddress_);
    //     const res = await client.runMethod(contractAddress, 'get_jetton_root');
    //     const returnedJettonRoot = res.stack.readAddress();

    //     console.log('Contract Jetton Root:', returnedJettonRoot.toString());
    //     console.log('Expected Jetton Root:', jettonRootAddress.toString());

    //     // Verify the returned jetton root matches the expected value
    //     expect(returnedJettonRoot.toString()).toBe(jettonRootAddress.toString());
    // }, 15000);

    // ---------------------------------------------🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️-----------------------------------------

    // it('should deposit Jettons ', async () => {
    //     // 1. Wallet Setup
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

    //     // 2. Jetton Setup
    //     const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
    //     const res = await client.runMethod(jettonRootAddress, 'get_jetton_data');
    //     const totalSupply = res.stack.readBigNumber(); // [0] total_supply
    //     const mintable = res.stack.readBigNumber(); // [1] mintable flag (e.g., -1 or 0)
    //     const adminCell = res.stack.readCell(); // [2] admin_address (as Cell)
    //     const contentCell = res.stack.readCell(); // [3] content (Jetton metadata)
    //     const walletCodeCell = res.stack.readCell();

    //     // 3. Get Wallet Addresses
    //     const userJettonWallet = (
    //         await client.runMethod(jettonRootAddress, 'get_wallet_address', [
    //             { type: 'slice', cell: beginCell().storeAddress(walletContract.address).endCell() },
    //         ])
    //     ).stack.readAddress();

    //     const contract = await SimpleCounter.fromInit(jettonRootAddress, walletCodeCell);
    //     const contractJettonWallet = (
    //         await client.runMethod(jettonRootAddress, 'get_wallet_address', [
    //             { type: 'slice', cell: beginCell().storeAddress(contract.address).endCell() },
    //         ])
    //     ).stack.readAddress();

    //     // 4. Prepare Transactions
    //     const taskCode = 120;
    //     const rewardPerUser = toNano('10');
    //     const maxClaims = 5;
    //     const totalJettons = rewardPerUser * BigInt(maxClaims);
    //     const deadlineHours = 3;

    //     // A) Jetton Transfer Payload
    //     const forwardPayload = beginCell()
    //         .storeUint(taskCode, 64)
    //         .storeUint(rewardPerUser, 64)
    //         .storeUint(maxClaims, 32)
    //         .storeUint(deadlineHours, 32)
    //         .endCell();

    //     // B) Jetton Transfer Message
    //     const jettonTransferBody = beginCell()
    //         .storeUint(0xf8a7ea5, 32) // transfer op
    //         .storeUint(0, 64) // query_id
    //         .storeCoins(totalJettons)
    //         .storeAddress(contract.address) // destination
    //         .storeAddress(walletContract.address) // response
    //         .storeBit(0) // no custom payload
    //         .storeCoins(toNano('0.05')) // forward amount
    //         .storeBit(1) // forward payload
    //         .storeRef(forwardPayload)
    //         .endCell();

    //     // 5. Send Transactions
    //     const seqno = await walletContract.getSeqno();

    //     // A) First send Jettons
    //     await walletContract.sendTransfer({
    //         seqno,
    //         secretKey: key.secretKey,
    //         sendMode: SendMode.PAY_GAS_SEPARATELY,
    //         messages: [
    //             internal({
    //                 to: userJettonWallet,
    //                 value: toNano('0.15'),
    //                 body: jettonTransferBody,
    //             }),
    //         ],
    //     });
    // }, 40000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------
    // it('should create task', async () => {
    //     // 1. Wallet Setup (unchanged)
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

    //     // 2. Jetton Setup
    //     const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
    //     const jettonData = await client.runMethod(jettonRootAddress, 'get_jetton_data');

    //     const res = await client.runMethod(jettonRootAddress, 'get_jetton_data');
    //     const totalSupply = res.stack.readBigNumber(); // [0] total_supply
    //     const mintable = res.stack.readBigNumber(); // [1] mintable flag (e.g., -1 or 0)
    //     const adminCell = res.stack.readCell(); // [2] admin_address (as Cell)
    //     const contentCell = res.stack.readCell(); // [3] content (Jetton metadata)
    //     const walletCodeCell = res.stack.readCell(); // [4] jetton_wallet_code
    //     // const walletCodeCell = jettonData.stack.readCell();

    //     // 3. Contract Initialization (FIXED)
    //     const contract = await SimpleCounter.fromInit(jettonRootAddress, walletCodeCell);
    //     const openedContract = client.open(contract);

    //     // 4. Task Parameters
    //     const taskCode = 120;
    //     const rewardPerUser = toNano('10');
    //     const maxClaims = 4;
    //     const deadlineHours = 3;

    //     // 5. Create Task Message (FIXED)
    //     const createTaskMsg = {
    //         $$type: 'CreateTaskMsg' as const,
    //         opCode: BigInt(0xcafebabe),
    //         code: BigInt(taskCode),
    //         rewardPerUser: rewardPerUser,
    //         maxClaims: BigInt(maxClaims),
    //         deadline: BigInt(deadlineHours),
    //     };

    //     // 6. Send Transaction (FIXED)
    //     await openedContract.send(
    //         walletContract.sender(key.secretKey),
    //         {
    //             value: toNano('0.15'), // Increased gas
    //             bounce: false,
    //         },
    //         createTaskMsg,
    //     );

    //     // 7. Verification
    //     // const taskCount = await openedContract.get('taskCounter');
    //     // console.log('New task count:', taskCount);
    // }, 30000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    // async function fetchAllTasks(client: TonClient, contractAddress: Address) {
    //     try {
    //         // Step 1: Get all task IDs
    //         const taskIdsResult = await client.runMethod(contractAddress, 'get_all_task_ids', []);
    //         console.log(taskIdsResult.stack);
    //         const taskCell = taskIdsResult.stack.readCell();
    //         console.log('Task cell:', taskCell.toString());

    //         // Parse the cell - first byte is count, then 32-bit task IDs
    //         const cs = taskCell.beginParse();
    //         const taskCount = cs.loadUint(8); // First 8 bits is the count
    //         console.log(`Found ${taskCount} tasks in the contract`);

    //         if (taskCount === 0) {
    //             console.log('No tasks exist in the contract');
    //             return [];
    //         }

    //         // Read all task IDs from the cell slice (not from the stack again)
    //         const taskIds = [];
    //         for (let i = 0; i < taskCount; i++) {
    //             const id = cs.loadUint(32);
    //             console.log(`Read task ID ${i + 1}:`, id); // Add per-ID logging
    //             taskIds.push(id);
    //         }
    //         console.log('Task IDs:', taskIds);

    //         // Step 2: Fetch details for each task
    //         const taskDetails = [];
    //         for (const taskId of taskIds) {
    //             const taskInfoResult = await client.runMethod(contractAddress, 'get_task_info', [
    //                 { type: 'int', value: BigInt(taskId) },
    //             ]);

    //             // Parse the task info from the stack
    //             console.log('Task info stack:', taskInfoResult.stack); // DEBUG - inspect raw stack

    //             const stack = taskInfoResult.stack;
    //             console.log('stack here', stack);
    //             const taskCell = taskInfoResult.stack.readCell();
    //             const cs = taskCell.beginParse();

    //             // Parse according to the contract's store order
    //             const task = {
    //                 id: cs.loadUint(32), // taskId
    //                 code: cs.loadUint(64), // task.code
    //                 owner: cs.loadAddress(), // task.creator
    //                 deadline: cs.loadUint(64), // task.deadline
    //                 maxClaims: cs.loadUint(32), // task.maxClaims
    //                 currentClaims: cs.loadUint(32), // task.currentClaims
    //                 rewardPerUser: cs.loadCoins(), // task.rewardPerUser
    //                 poolAmount: cs.loadCoins(), // pool
    //             };

    //             console.log('individual task');
    //             console.log(task);

    //             // Convert timestamps to readable dates
    //             task.deadline = Number(new Date(task.deadline * 1000).toLocaleString());

    //             // Calculate if task is active
    //             const now = Math.floor(Date.now() / 1000);
    //             let isActive = task.deadline > now && task.currentClaims < task.maxClaims;

    //             taskDetails.push(task);

    //             console.log(`\nTask #${task.id} Details:`);
    //             console.log(`- Verification Code: ${task.code}`);
    //             console.log(`- Owner: ${task.owner}`);
    //             console.log(`- Deadline: ${task.deadline} (${task.deadline})`);
    //             console.log(`- Claims: ${task.currentClaims}/${task.maxClaims}`);
    //             console.log(`- Reward: ${task.rewardPerUser} nanoTON per user`);
    //             console.log(`- Pool: ${task.poolAmount} nanoTON remaining`);
    //             console.log(`- Status: ${isActive ? 'Active' : 'Inactive'}`);
    //         }

    //         return taskDetails;
    //     } catch (error) {
    //         console.error('Error fetching tasks:', error);
    //         return [];
    //     }
    // }

    // -----------------------🫂🫂🫂🫂🫂🫂🫂🫂🫂 ---------------------------------
    // it('should fetch and display all tasks', async () => {
    //     // Setup client
    //     const client = new TonClient({
    //         endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    //         apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
    //     });

    //     const contractAddress = Address.parse(contractAddress_);

    //     // Fetch all tasks
    //     const tasks = await fetchAllTasks(client, contractAddress);

    //     console.log('here now');
    //     console.log(tasks);
    //     // Verify if the specific task ID exists
    //     const taskCode = 1; // The task ID we're trying to claim
    //     const taskExists = tasks.some((task) => task.id === taskCode);

    //     if (!taskExists) {
    //         console.log(`Task ID ${taskCode} doesn't exist! You need to create it before claiming.`);
    //     } else {
    //         const task = tasks.find((t) => t.id === taskCode);
    //         console.log(`Found task ID ${taskCode} with verification code ${task?.code}`);
    //     }
    // }, 30000);

    // --------------------------------------------⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ ----------------------------------------------------------

    // 🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️🏆️-----------------------------------
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

        // Setup client
        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: '7bfba5a4ff93a6416d7ad114ca04ec196a12b6d4a12748608f947a43709d2a9a',
        });

        const wallet = WalletContractV5R1.create({
            workchain: 0,
            publicKey: key.publicKey,
            walletId: { networkGlobalId: -3 },
        });
        const walletContract = client.open(wallet);

        const jettonRootAddress = Address.parse('EQAb_8LdTzsDBWmiyVxdidb8xCMyuTJkNC5Cn2UpMMkHt2qC');
        const jettonData = await client.runMethod(jettonRootAddress, 'get_jetton_data');

        const res = await client.runMethod(jettonRootAddress, 'get_jetton_data');
        const totalSupply = res.stack.readBigNumber(); // [0] total_supply
        const mintable = res.stack.readBigNumber(); // [1] mintable flag (e.g., -1 or 0)
        const adminCell = res.stack.readCell(); // [2] admin_address (as Cell)
        const contentCell = res.stack.readCell(); // [3] content (Jetton metadata)
        const walletCodeCell = res.stack.readCell(); // [4] jetton_wallet_code

        const contractAddress = Address.parse(contractAddress_);
        const contract = await SimpleCounter.fromInit(jettonRootAddress, walletCodeCell);
        const openedContract = client.open(contract);

        // Check if task already claimed (optional)
        try {
            const hasClaimed = await client.runMethod(contractAddress, 'has_claimed', [
                { type: 'int', value: BigInt(taskCode) },
                { type: 'slice', cell: beginCell().storeAddress(walletContract.address).endCell() },
            ]);

            const alreadyClaimed = hasClaimed.stack.readBoolean();
            console.log('User has already claimed:', alreadyClaimed);

            // if (alreadyClaimed) {
            //     console.log('Task already claimed, skipping test');
            //     return;
            // }
        } catch (error) {
            console.error('Error checking claim status:', error);
        }

        // 2. Prepare the claim message in the same style as createTaskMsg
        const claimTaskMsg = {
            $$type: 'ClaimTaskMsg' as const,
            opCode: BigInt(OP_CLAIM_TASK),
            taskId: BigInt(taskCode),
            codeInput: BigInt(codeInput),
        };

        // 3. Send the message to the contract
        await openedContract.send(
            walletContract.sender(key.secretKey),
            {
                value: toNano('0.7'), // Enough gas
                bounce: true,
            },
            claimTaskMsg,
        );

        console.log('Claim Transaction sent');

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

type Task = {
    code: bigint;
    rewardPerUser: bigint;
    maxClaims: number;
    currentClaims: number;
    creator: string;
    deadline: bigint;
    claimed: Record<string, boolean>;
};
