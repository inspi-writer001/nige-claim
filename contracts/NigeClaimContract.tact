import "./messages.tact";
import "@stdlib/deploy";

const OP_CREATE_TASK: Int = 0xCAFEBABE;
const OP_CLAIM_TASK: Int = 0x42a0fb6d;
// const JettonTransferInternalOpcode: Int = 0x178d4519;
// Define the Task struct at top-level
struct Task {
    code: Int; // task code as number instead of string
    rewardPerUser: Int;
    maxClaims: Int;
    currentClaims: Int;
    creator: Address;
    deadline: Int;
    claimed: map<Address, Bool>;
}
struct JettonWalletData {
    balance: Int as coins;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}

fun calculateJettonWalletAddress(ownerAddress: Address, jettonMasterAddress: Address, jettonWalletCode: Cell): Address {
    let initData = JettonWalletData { balance: 0, ownerAddress, jettonMasterAddress, jettonWalletCode };
    return contractAddress(StateInit { code: jettonWalletCode, data: initData.toCell() });
}

// NigeClaimContract distributes USDT (TIP-3) via standard Jetton root and wallet

contract NigeClaimContract with Deployable {
    // USDT Jetton root (master) address
    jettonRoot: Address;
    jettonWalletCode: Cell;
    owner: Address;
    tasks: map<Int as uint64, Task>;
    pools: map<Int as uint64, Int as uint64>;
    taskCounter: Int as uint64;
    contractJettonWallet: Address;

    deposits: map<Address, Int as coins>;

    // const new_guy = crc32("hello");
    // Initializer: store Jetton root
    init(jettonRootParam: Address, jettonWalletCode: Cell) {
        // accept();
        self.jettonRoot = jettonRootParam;
        self.jettonWalletCode = jettonWalletCode;
        self.owner = sender();
        self.taskCounter = 0;
        self.tasks = emptyMap();
        self.pools = emptyMap();
        self.deposits = emptyMap();
        self.contractJettonWallet = calculateJettonWalletAddress(
            myAddress(),
            jettonRootParam,
            jettonWalletCode,
        );
    }

    // getContract()

    // Phase 1: Accept token deposits
    receive(msg: JettonNotification) {
        let sender = msg.sender;
        let amount = msg.amount;

        let initial_pool = (self.deposits.get(sender) != null) ? self.deposits.get(sender)!! : 0;

        let total_amount = initial_pool + amount;
        // Record deposit (no task logic here)
        self.deposits.set(sender, total_amount);

        // Optional: Immediate refund if you want
        if (msg.forwardPayload.refs() > 0) {
            send(SendParameters {
                to: sender,
                value: 50000000,
                body: beginCell()
                    .storeUint(0xffffffff, 32) // Custom refund op
                    .endCell(),
            });
        }
    }

    // Phase 2: Task creation
    receive(msg: CreateTaskMsg) {
        let sender = sender();
        let needed = msg.rewardPerUser * msg.maxClaims;

        // let current_pool = self.deposits.get(sender)!!;
        let current_pool = (self.deposits.get(sender) != null) ? self.deposits.get(sender)!! : 0;

        // Verify sufficient deposit
        require(
            current_pool >= needed,
            "Insufficient deposit",
        );

        // Create task
        let newTask = Task {
            code: msg.code,
            rewardPerUser: msg.rewardPerUser,
            maxClaims: msg.maxClaims,
            currentClaims: 0,
            creator: sender,
            deadline: now() + (msg.deadline * 3600),
            claimed: emptyMap(),
        };

        // Update state
        self.taskCounter += 1;
        self.tasks.set(self.taskCounter, newTask);
        self.pools.set(self.taskCounter, needed);

        self.deposits.set(sender, current_pool - needed);

        // Optional event
        send(SendParameters {
            to: sender,
            value: 50000000,
            body: beginCell()
                .storeUint(0xCAFED00D, 32) // TaskCreated op
                .storeUint(self.taskCounter, 64)
                .endCell(),
        });
    }

    receive(msg: ClaimTaskMsg) {
        require(msg.opCode == OP_CLAIM_TASK, "Invalid operation code");
        self.new_claim(msg.taskId, msg.codeInput);
    }

    fun new_claim(taskId: Int, codeInput: Int) {
        // Get task once and store in variable to avoid multiple map lookups
        let task = self.tasks.get(taskId);
        require(task != null, "Task not found");
        let taskData = task!!;

        // Get pool once and store in variable
        let pool = self.pools.get(taskId);
        require(pool != null, "Pool not found for task");
        let poolAmount = pool!!;

        // Do quick checks first (fail fast)
        require(taskData.code == codeInput, "Invalid code");
        require(taskData.claimed.get(sender()) != true, "Already claimed");
        require(now() < taskData.deadline, "Expired");
        require(taskData.currentClaims < taskData.maxClaims, "Claim limit reached");
        require(poolAmount >= taskData.rewardPerUser, "Pool emptied");

        // Pre-calculate jetton wallet address (store in contract state if possible)
        let contractJettonWallet = self.contractJettonWallet;

        // Create transfer payload
        let transferPayload = JettonTransfer {
            queryId: 42,
            amount: taskData.rewardPerUser,
            destination: sender(),
            responseDestination: sender(),
            customPayload: null,
            forwardTonAmount: 1,
            forwardPayload: rawSlice("F"),
        }.toCell();

        // Send the transfer with MORE gas
        send(SendParameters {
            to: contractJettonWallet,
            value: ton("0.05"), // Increased gas
            bounce: true,
            mode: SendRemainingValue, // Changed from SendPayGasSeparately
            body: transferPayload,
        });

        // Update state efficiently - minimize map operations
        self.pools.set(taskId, poolAmount - taskData.rewardPerUser);
        taskData.claimed.set(sender(), true);
        taskData.currentClaims += 1;
        self.tasks.set(taskId, taskData);
    }

    get fun get_all_task_ids(): Cell {
        let taskCount = 0;
        let builder = beginCell();

        // More efficient iteration without debug dumps
        foreach (taskId, _ in self.tasks) {
            if (taskCount < 255) { // Prevent cell overflow
                builder = builder.storeUint(taskId, 32);
                taskCount += 1;
            } else {
                return beginCell().endCell();
            }
        }

        return beginCell()
            .storeUint(taskCount, 8) // Store count as first byte
            .storeBuilder(builder) // Store all IDs
            .endCell();
    }

    // Method to get detailed info for a specific task
    get fun get_task_info(taskId: Int): Cell {
        require(self.tasks.exists(taskId), "Task not found");
        let task = self.tasks.get(taskId)!!;
        let pool = self.pools.get(taskId)!!;

        return beginCell()
            .storeUint(taskId, 32)
            .storeUint(task.code, 64)
            .storeAddress(task.creator)
            .storeUint(task.deadline, 64)
            .storeUint(task.maxClaims, 32)
            .storeUint(task.currentClaims, 32)
            .storeCoins(task.rewardPerUser)
            .storeCoins(pool)
            .endCell();
    }

    /// View if a user has claimed a task

    get fun has_claimed(taskId: Int, user: Address): Bool {
        let task = self.tasks.get(taskId);
        if (task != null) {
            return task!!.claimed.get(user) != null;
        }
        return false;
    }

    get fun all_tasks(): map<Int as uint64, Task> {
        return self.tasks;
    }

    get fun debug_state(): map<Int as uint64, Int as uint64> {
        let result: map<Int as uint64, Int as uint64> = emptyMap();
        let taskCount_: Int = 0;

        // Count tasks by manual iteration
        foreach (_, _ in self.tasks) {
            taskCount_ += 1;
        }

        // Store results
        result.set(0, self.taskCounter); // Last used ID
        result.set(1, taskCount_); // Actual task count

        // Optional: Sample first 3 tasks' claim counts
        let i = 0;
        foreach (taskId, task in self.tasks) {
            if (i >= 3) {
                return emptyMap();
            }
            result.set(2 + i, task.currentClaims);
            i += 1;
        }

        return result;
    }

    get fun debug_get_task_struct(id: Int): Task {
        let task = self.tasks.get(id)!!;
        return Task {
            code: task.code,
            rewardPerUser: task.rewardPerUser,
            maxClaims: task.maxClaims,
            creator: task.creator,
            deadline: task.deadline,
            currentClaims: task.currentClaims,
            claimed: task.claimed,
        };
    }

    /// View the USDT Jetton root address

    get fun get_jetton_root(): Address {
        return self.jettonRoot;
    }
}

message CreateTaskMsg {
    opCode: Int as uint32; // 0xCAFEBABE
    code: Int as uint64; // task ID as number instead of string
    rewardPerUser: Int as uint64; // rewardPerUser
    maxClaims: Int as uint32; // maxClaims
    deadline: Int as uint32; // deadlineHours
}

message ClaimTaskMsg {
    opCode: Int as uint32; // Custom op code for claim operation
    taskId: Int as uint32; // Task ID to claim
    codeInput: Int as uint64; // Code input for verification
}

message TONTransferWithPayload {
    queryId: Int as uint64;
    forwardPayload: Cell;
}

// message CreateTask {
//     opCode: Int as uint32;    // 0xCAFEBABE
//     code: Int as uint64;      // Task identifier
//     rewardPerUser: Int as uint64;
//     maxClaims: Int as uint32;
//     deadlineHours: Int as uint32;
// }

//  receive(msg: Slice) {
//         // If there's no data, just accept the TON

//         if (msg.bits() == 0) {
//             return;
//         }

//         // Check if we have enough bits for the operation code
//         if (msg.bits() >= 32) {
//             let op = msg.loadUint(32);

//             // Handle simple TON transfer (op code 0)
//             if (op == 0) {
//                 let queryId = msg.loadUint(64);

//                 // Check if there's a reference cell with the actual operation
//                 if (msg.refs() > 0) {
//                     let payloadCell = msg.loadRef();
//                     let payloadSlice = payloadCell.beginParse();

//                     if (payloadSlice.bits() >= 32) {
//                         let payloadOp = payloadSlice.loadUint(32);

//                         // Handle claim task operation in payload
//                         if (payloadOp == OP_CLAIM_TASK) {
//                             if (payloadSlice.bits() >= 32 + 64) {
//                                 let taskId = payloadSlice.loadUint(32);
//                                 let codeInput = payloadSlice.loadUint(64);
//                                 self.new_claim(taskId, codeInput);
//                                 return;
//                             }
//                         }
//                     }
//                 }
//             }

//             // Direct claim task operation (no nesting)
//         if (op == OP_CLAIM_TASK) {
//             if (msg.bits() >= 32 + 64) {
//                 let taskId = msg.loadUint(32);
//                 let codeInput = msg.loadUint(64);
//                 self.new_claim(taskId, codeInput);
//                 return;
//             }
//         }
//     }

//     // If we reach here and can't process the message, throw an error
//     throw(132); // Error code for invalid message format
// }
