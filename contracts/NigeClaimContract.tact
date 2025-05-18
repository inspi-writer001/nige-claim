import "./messages.tact";
import "@stdlib/deploy";
const OP_CREATE_TASK: Int = 0xCAFEBABE;
const OP_CLAIM_TASK: Int = 0x42a0fb6d; 
// const JettonTransferInternalOpcode: Int = 0x178d4519;
// Define the Task struct at top-level
struct Task {
    code: Int;               // task code as number instead of string
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
    let initData = JettonWalletData{balance: 0, ownerAddress, jettonMasterAddress, jettonWalletCode};
    return contractAddress(StateInit{code: jettonWalletCode, data: initData.toCell()});
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
    

    // const new_guy = crc32("hello");
    // Initializer: store Jetton root
    init(jettonRootParam: Address, jettonWalletCode: Cell){
        // accept();
        self.jettonRoot = jettonRootParam;
        self.jettonWalletCode = jettonWalletCode;
        self.owner = sender();
        self.taskCounter = 0;
        self.tasks = emptyMap();
        self.pools = emptyMap();
    }


    receive(msg: JettonNotification){
    // Debug: Log that we received a JettonNotification
    // dump("Received JettonNotification");
    // dump("From sender:");
    // dump(msg.sender);
    // dump("With amount:");
    // dump(msg.amount);
    // dump("Payload bits:");
    // dump(msg.forwardPayload.bits());
    
    // First check if the message is actually a JettonNotification
    // and if the forward payload exists
    if (msg.forwardPayload.bits() < 32) {
        // Not enough bits to even read the operation code
        // dump("Payload too short - ignoring");
        return; // Just ignore invalid notifications
    }
    
    try {
        // Read raw opcode first to check if it's what we expect
        let s = msg.forwardPayload;
        let opCode = s.loadUint(32);
        
        // dump("Received opCode:");
        // dump(opCode);
        // dump("Expected opCode (OP_CREATE_TASK):");
        // dump(OP_CREATE_TASK);
        
        if (opCode != OP_CREATE_TASK) {
            // Not our operation, just ignore
            // dump("Opcode mismatch - ignoring");
            return;
        }
        
        // Now manually parse the rest of the message fields
        // dump("Parsing task creation parameters...");
        
        // This avoids potential issues with the CreateTaskMsg.fromSlice() method
        let taskCode = s.loadUint(64);
        let rewardPerUser = s.loadUint(64);
        let maxClaims = s.loadUint(32);
        let deadlineHours = s.loadUint(32);
        
        // dump("Task parameters:");
        // dump("- taskCode: " );
        // dump(taskCode);
        // dump("- rewardPerUser: " );
        // dump(rewardPerUser);
        // dump("- maxClaims: " );
        // dump(maxClaims);
        // dump("- deadlineHours: " );
        // dump(deadlineHours);
        
        // Validate sender authorization
        // dump("Checking sender authorization...");
        // dump("Sender: " );
        // dump( msg.sender);
        // dump("Owner: " );
        // dump(self.owner);
        
        if (msg.sender != self.owner) {
            // dump("Authorization failed - not owner");
            return;
        }
        
        // Compute expected deposit
        let needed = rewardPerUser * maxClaims;
        // dump("Needed deposit: ");
        // dump(needed);
        // dump("Actual deposit: ");
        // dump(msg.amount);
        
        if (msg.amount < needed) {
            // dump("Insufficient deposit");
            return;
        }
        
        // Record the task + its pool
        let deadlineTs = now() + (deadlineHours * 3600);
        
        // dump("Creating new task...");
        // dump("Current task counter: " );
        // dump(self.taskCounter);
        
        let newTask = Task{
            code: taskCode,
            rewardPerUser: rewardPerUser,
            maxClaims: maxClaims,
            currentClaims: 0,
            creator: msg.sender,
            deadline: deadlineTs,
            claimed: null // start empty
        };
        
        self.taskCounter += 1;
        
        // dump("New task counter: " );
        // dump(self.taskCounter);
        
        // dump("Storing task in map with ID: ");
        // dump(self.taskCounter);
        self.tasks.set(self.taskCounter, newTask);
        
        // dump("Storing pool amount in map with ID: ");
        // dump(self.taskCounter);
        self.pools.set(self.taskCounter, needed);
        
        // dump("Task creation successful!");
        
        // Refund any over-deposit
        if (msg.amount > needed) {
            let refund = msg.amount - needed;
            // dump("Refunding excess: ");
            // dump( refund);
            send(SendParameters{
                to: msg.sender, 
                value: refund, 
                bounce: false, 
                mode: 64, 
                body: null
            });
        }
    } catch (err) {
        // Log the error but don't throw
        dump("ERROR in JettonNotification handler:");
        dump(err);
        // Don't throw the error - this will allow transaction to complete
        // but log the issue for debugging
        // throw(err); // Comment out to prevent transaction failure
    }
}


//   receive(msg: JettonNotification){
//     // First check if the message is actually a JettonNotification
//     // and if the forward payload exists
//     if (msg.forwardPayload.bits() < 32) {
//         // Not enough bits to even read the operation code
//         return; // Just ignore invalid notifications
//     }
    
//     try {
//         // Read raw opcode first to check if it's what we expect
//         let s = msg.forwardPayload;
//         let opCode = s.loadUint(32);
        
//         if (opCode != OP_CREATE_TASK) {
//             // Not our operation, just ignore
//             return;
//         }
        
//         // Now manually parse the rest of the message fields
//         // This avoids potential issues with the CreateTaskMsg.fromSlice() method
//         let taskCode = s.loadUint(64);
//         let rewardPerUser = s.loadUint(64);
//         let maxClaims = s.loadUint(32);
//         let deadlineHours = s.loadUint(32);
        
//         // Validate sender authorization
//         require(msg.sender == self.owner, "Not contract owner");
        
//         // Compute expected deposit
//         let needed = rewardPerUser * maxClaims;
//         require(msg.amount >= needed, "Insufficient deposit");
        
//         // Record the task + its pool
//         let deadlineTs = now() + (deadlineHours * 3600);
//         let newTask = Task{
//             code: taskCode,
//             rewardPerUser: rewardPerUser,
//             maxClaims: maxClaims,
//             currentClaims: 0,
//             creator: msg.sender,
//             deadline: deadlineTs,
//             claimed: null // start empty
//         };
        
//         self.taskCounter += 1;
//         self.tasks.set(self.taskCounter, newTask);
//         self.pools.set(self.taskCounter, needed);
        
//         // Refund any over-deposit
//         if (msg.amount > needed) {
//             let refund = msg.amount - needed;
//             send(SendParameters{
//                 to: msg.sender, 
//                 value: refund, 
//                 bounce: false, 
//                 mode: 64, 
//                 body: null
//             });
//         }
//     } catch (err) {
//         // Just log the error but don't throw
//         // This prevents the transaction from failing completely
//         dump("Error processing JettonNotification");
//         dump(err);
//          throw(err);
//     }
// }

receive(msg: ClaimTaskMsg) {
    require(msg.opCode == OP_CLAIM_TASK, "Invalid operation code");
    self.new_claim(msg.taskId, msg.codeInput);
}

receive(msg: Slice) {
    // If there's no data, just accept the TON
   
    if (msg.bits() == 0) {
        return;
    }
   
    // Check if we have enough bits for the operation code
    if (msg.bits() >= 32) {
        let op = msg.loadUint(32);
        
        // Handle simple TON transfer (op code 0)
        if (op == 0) {
            let queryId = msg.loadUint(64);
            
            // Check if there's a reference cell with the actual operation
            if (msg.refs() > 0) {
                let payloadCell = msg.loadRef();
                let payloadSlice = payloadCell.beginParse();
                
                if (payloadSlice.bits() >= 32) {
                    let payloadOp = payloadSlice.loadUint(32);
                    
                    // Handle claim task operation in payload
                    if (payloadOp == OP_CLAIM_TASK) {
                        if (payloadSlice.bits() >= 32 + 64) {
                            let taskId = payloadSlice.loadUint(32);
                            let codeInput = payloadSlice.loadUint(64);
                            self.new_claim(taskId, codeInput);
                            return;
                        }
                    }
                }
            }
        }
        
        // Direct claim task operation (no nesting)
        if (op == OP_CLAIM_TASK) {
            if (msg.bits() >= 32 + 64) {
                let taskId = msg.loadUint(32);
                let codeInput = msg.loadUint(64);
                self.new_claim(taskId, codeInput);
                return;
            }
        }
    }
    
    // If we reach here and can't process the message, throw an error
    throw(132); // Error code for invalid message format
}

fun new_claim(taskId: Int, codeInput: Int) {
    // Check if task exists before force unwrapping

    dump(self.tasks);

    
    require(self.tasks.get(taskId) != null, "Task not found");
    let task = self.tasks.get(taskId)!!;
    
    // Check if pool exists before force unwrapping
    require(self.pools.get(taskId)  != null, "Pool not found for task");
    let pool = self.pools.get(taskId)!!;
    
    // Standard validations
    require(now() < task.deadline, "Expired");
    require(task.claimed.get(sender()) != true, "Already claimed");
    require(task.currentClaims < task.maxClaims, "Claim limit reached");
    require(task.code == codeInput, "Invalid code");
    require(pool >= task.rewardPerUser, "Pool emptied");
    
    // Check jetton-related fields before using them
    require(!self.jettonRoot.asSlice().empty() , "Jetton root not set");
    require(!self.jettonWalletCode.asSlice().empty(), "Jetton wallet code not set");
    
    // Calculate wallet address safely
    let jettonWalletAddress = calculateJettonWalletAddress(
        sender(),
        self.jettonRoot, 
        self.jettonWalletCode
    );
    require(!jettonWalletAddress.asSlice().empty(), "Failed to calculate jetton wallet address");
    
    // Build token transfer payload
    let payload = beginCell()
        .storeUint(0xf8a7ea5, 32)  // TokenTransfer op code
        .storeUint(0, 64)          // query_id
        .storeUint(task.rewardPerUser, 64)
        .storeAddress(sender())
        .storeAddress(sender())    // response_destination
        .storeUint(0, 64)          // forward_ton_amount
        .storeUint(0, 1)           // custom_payload absent
        .storeUint(0, 64)          // forward_payload length
        .endCell();
    
    // Send token transfer message
    send(SendParameters{
        to: jettonWalletAddress,
        value: 0,
        bounce: false,
        mode: 64,
        body: payload
    });
    
    // Update state
    self.pools.set(taskId, pool - task.rewardPerUser);
    task.claimed.set(sender(), true);
    task.currentClaims += 1;
    self.tasks.set(taskId, task);
}



    // fun new_claim(taskId: Int, codeInput: Int) {
    //     let task = self.tasks.get(taskId)!!;
    //     let pool = self.pools.get(taskId)!!;
    //     require(now() < task.deadline, "Expired");
    //     require(task.claimed.get(sender()) != true, "Already claimed");
    //     require(task.currentClaims < task.maxClaims, "Claim limit reached");
    //     require(task.code == codeInput, "Invalid code");
    //     require(pool >= task.rewardPerUser, "Pool emptied");
    //     // send reward
    //     let payload = beginCell().storeUint(0xf8a7ea5,
    //         32 // TokenTransfer op code
    //     ).storeUint(0,
    //         64 // query_id
    //     ).storeUint(task.rewardPerUser, 64).storeAddress(sender()).storeAddress(sender() // response_destination
    //     ).storeUint(0,
    //         64 // forward_ton_amount
    //     ).storeUint(0,
    //         1 // custom_payload absent
    //     ).storeUint(0,
    //         64 // forward_payload length
    //     ).endCell();
    //     send(SendParameters{
    //             to: calculateJettonWalletAddress(sender(),
    //                     self.jettonRoot,
    //                     self.jettonWalletCode
    //                 )
    //             ,
    //             value: 0,
    //             bounce: false,
    //             mode: 64,
    //             body: payload
    //         }
    //     );
    //     // decrement pool + mark claimed
    //     self.pools.set(taskId, pool - task.rewardPerUser);
    //     task.claimed.set(sender(), true);
    //     task.currentClaims += 1;
    //     self.tasks.set(taskId, task);
    // }

//    get fun get_all_task_ids(): Cell {
//     let builder = beginCell();
//     let taskCount = 0;
    
//     // Iterate through all tasks and collect their IDs
//     foreach (taskId, _ in self.tasks) {
//         if (taskCount < 255) { // Limit to prevent cell overflow
//             builder = builder.storeUint(taskId, 32);
//             taskCount += 1;
//         }
//     }
    
//     // Store the count at the beginning
//     return beginCell().storeUint(taskCount, 8).storeBuilder(builder).endCell();
// }

get fun get_all_task_ids(): Cell {
    let builder = beginCell();
    let taskCount = 0;
    
    // Debug: Check if tasks map exists and has entries
    let hasElements = self.tasks.isEmpty() != true;
    dump("Tasks map empty check: ");
    dump(hasElements);
    
    // Also dump the current task counter
    dump("Current task counter: ");
    dump(self.taskCounter);
    
    // Iterate through all tasks and collect their IDs
    foreach (taskId, _ in self.tasks) {
        // Debug: Print each task ID we find
        dump("Found task ID: ");
        dump(taskId);
        
        if (taskCount < 255) { // Limit to prevent cell overflow
            builder = builder.storeUint(taskId, 32);
            taskCount += 1;
        }
    }
    
    // Store the count at the beginning
    return beginCell().storeUint(taskCount, 8).storeBuilder(builder).endCell();
}

// Method to get detailed info for a specific task
get fun get_task_info(taskId: Int): Cell {
    require(self.tasks.get(taskId) != null , "Task not found");
    
    let task = self.tasks.get(taskId)!!;
    let poolAmount = 0;
    
    if (self.pools.get(taskId) != null) {
        poolAmount = self.pools.get(taskId)!!;
    }
    
    return beginCell()
        .storeUint(taskId, 32)      // Task ID
        .storeUint(task.code, 64)   // Verification code
        .storeAddress(task.creator)   // Owner address
        .storeUint(task.deadline, 64) // Deadline timestamp
        .storeUint(task.maxClaims, 16) // Maximum claims
        .storeUint(task.currentClaims, 16) // Current claim count
        .storeCoins(task.rewardPerUser) // Reward per user
        .storeCoins(poolAmount)     // Current pool amount
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

    /// View the USDT Jetton root address

    get fun get_jetton_root(): Address {
        return self.jettonRoot;
    }
}


message CreateTaskMsg {
  opCode:    Int as uint32;    // 0xCAFEBABE
  code:      Int as uint64;    // task ID as number instead of string
  reward:    Int as uint64;    // rewardPerUser
  maxClaims: Int as uint32;    // maxClaims
  deadline:  Int as uint32;    // deadlineHours
}

message ClaimTaskMsg {
  opCode: Int as uint32;    // Custom op code for claim operation
  taskId: Int as uint32;    // Task ID to claim
  codeInput: Int as uint64; // Code input for verification
}


message TONTransferWithPayload {
    queryId: Int as uint64;
    forwardPayload: Cell;
}