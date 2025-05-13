import "./messages.tact";
import "@stdlib/deploy";
const OP_CREATE_TASK: Int = 0xCAFEBABE;
// Define the Task struct at top-level
struct Task {
    code: String;
    rewardPerUser: Int; // in USDT smallest unit (e.g., 6 decimals => amount * 10^6)
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
    tasks: map<Int, Task>;
    pools: map<Int, Int>;
    taskCounter: Int = 0;
    // Initializer: store Jetton root
    init(jettonRootParam: Address, jettonWalletCode: Cell){
        // accept();
        self.jettonRoot = jettonRootParam;
        self.jettonWalletCode = jettonWalletCode;
        self.owner = sender();
    }

    /// Create a new task
    fun create_task(code: String, rewardPerUser: Int, maxClaims: Int, deadlineHours: Int) {
        // Assume off-chain you ensure wallet has funds

        require(sender() == self.owner, "UnAuthorized");
        let deadlineTimestamp = now() + (deadlineHours * 3600);
        let newTask = Task{
            code: code,
            rewardPerUser: rewardPerUser,
            maxClaims: maxClaims,
            currentClaims: 0,
            creator: sender(),
            deadline: deadlineTimestamp,
            claimed: null
        };
        self.tasks.set(self.taskCounter + 1, newTask);
        self.taskCounter += 1;
    }

    receive(msg: JettonNotification){
        // 1) ensure it really is a token transfer
        // let slice = msg.forwardPayload;
        

        //  let parsed: CreateTaskMsg ;
    try {
        // Attempt to parse the forward payload into a CreateTaskMsg
       let parsed = CreateTaskMsg.fromSlice(msg.forwardPayload);
         if (parsed.opCode == OP_CREATE_TASK) {
            // pull out our params
            let taskCode = parsed.code;
            let rewardPerUser = parsed.reward;
            let maxClaims = parsed.maxClaims;
            let deadlineHours = parsed.deadline;

            dump(taskCode);
            // 2) check authorization
            // require(msg.sender == self.owner, "Only token owner can create");
            require(msg.sender == self.owner, "Not contract owner");
            // 3) compute expected deposit
            let needed = rewardPerUser * maxClaims;
            require(msg.amount >= needed, "Insufficient deposit");
            // 4) record the task + its pool
            let deadlineTs = now() + (deadlineHours * 3600);
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
            self.tasks.set(self.taskCounter, newTask);
            self.pools.set(self.taskCounter, needed);
            // 5) refund any over‐deposit
            if (msg.amount > needed) {
                // send back the dust
                let refund = msg.amount - needed;
                send(SendParameters{to: msg.sender, value: refund, bounce: false, mode: 64, body: null});
            }
        } else {
            dump("Wrong transaction deails");
             throw(134);
        }
    } catch (err) {
        // If parsing fails, exit the function
        dump(err);
        throw(err);
        // return;
    }
       
        // … other receive cases (e.g., claim notifications) …
    }

    /// Claim USDT if code is valid and within limits
    ///

    fun new_claim(taskId: Int, codeInput: String) {
        let task = self.tasks.get(taskId)!!;
        let pool = self.pools.get(taskId)!!;
        require(now() < task.deadline, "Expired");
        require(task.claimed.get(sender()) != true, "Already claimed");
        require(task.currentClaims < task.maxClaims, "Claim limit reached");
        require(task.code == codeInput, "Invalid code");
        require(pool >= task.rewardPerUser, "Pool emptied");
        // send reward
        let payload = beginCell().storeUint(0xf8a7ea5,
            32 // TokenTransfer op code
        ).storeUint(0,
            64 // query_id
        ).storeUint(task.rewardPerUser, 64).storeAddress(sender()).storeAddress(sender() // response_destination
        ).storeUint(0,
            64 // forward_ton_amount
        ).storeUint(0,
            1 // custom_payload absent
        ).storeUint(0,
            64 // forward_payload length
        ).endCell();
        send(SendParameters{
                to: calculateJettonWalletAddress(sender(),
                        self.jettonRoot,
                        self.jettonWalletCode
                    )
                ,
                value: 0,
                bounce: false,
                mode: 64,
                body: payload
            }
        );
        // decrement pool + mark claimed
        self.pools.set(taskId, pool - task.rewardPerUser);
        task.claimed.set(sender(), true);
        task.currentClaims += 1;
        self.tasks.set(taskId, task);
    }

    fun claim(taskId: Int, codeInput: String) {
        // accept();
        let task: Task = self.tasks.get(taskId)!!;
        // if (task. == null ){
        //     throw(777)
        // }

        // require(task != null, "Invalid Id");
        require(now() < task.deadline, "Expired");
        require(task.claimed.get(sender()) != true, "Already claimed");
        require(task.currentClaims < task.maxClaims, "Claim limit reached");
        require(task.code == codeInput, "Invalid code");
        // Build transfer payload for TIP-3
        let payload = beginCell().storeUint(0xf8a7ea5,
            32 // TokenTransfer op code
        ).storeUint(0,
            64 // query_id
        ).storeUint(task.rewardPerUser, 64).storeAddress(sender()).storeAddress(sender() // response_destination
        ).storeUint(0,
            64 // forward_ton_amount
        ).storeUint(0,
            1 // custom_payload absent
        ).storeUint(0,
            64 // forward_payload length
        ).endCell();
        // Send transfer to our wallet to forward
        let wallet = calculateJettonWalletAddress(myAddress(), self.jettonRoot, self.jettonWalletCode);

        // sendRawMessage(wallet.asSlice().asCell(), 0, payload);

        send(SendParameters{
                to: calculateJettonWalletAddress(sender(), self.jettonRoot, self.jettonWalletCode),
                value: 0,
                bounce: false,
                mode: 64,
                body: payload
            }
        );
        // Mark claimed and update count
        let currentTask = self.tasks.get(taskId)!!;
        currentTask.claimed.set(sender(), true);
        currentTask.currentClaims += 1;
        self.tasks.set(taskId, currentTask);
    }

    /// View if a user has claimed a task

    get fun has_claimed(taskId: Int, user: Address): Bool {
        let task = self.tasks.get(taskId);
        if (task != null){
            return !!task.claimed.get(user)!!;
        }
        return false;
    }

    /// View the USDT Jetton root address

    get fun get_jetton_root(): Address {
        return self.jettonRoot;
    }
}


message CreateTaskMsg {
  opCode:    Int as uint32;    // 0xCAFEBABE
  code:      String;           // tail‐string
  reward:    Int as uint64;    // rewardPerUser
  maxClaims: Int as uint32;    // maxClaims
  deadline:  Int as uint32;    // deadlineHours
}