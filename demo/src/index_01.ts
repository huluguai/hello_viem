import {
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  publicActions,
} from "viem";
import { foundry } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import Counter_ABI from './abis/counter-abi.json' with { type: 'json' };

// 合约地址
const COUNTER_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3" as const;

// 本地测试网络 RPC URL
const RPC_URL = "http://127.0.0.1:8545";

const main = async () => {
  console.log("=== Viem Counter 合约示例 ===\n");

  // 创建公共客户端（用于读取数据）
  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(RPC_URL),
  }).extend(publicActions);

  // 获取当前区块号
  const blockNumber = await publicClient.getBlockNumber();
  console.log(`当前区块号: ${blockNumber}\n`);

  // 创建钱包客户端（用于写入交易）
  // 注意：需要设置环境变量 PRIVATE_KEY，或者使用默认的测试账户私钥
  // 这里使用 Foundry 默认的第一个账户私钥作为示例
  const account = privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`
  );

  const walletClient = createWalletClient({
    account,
    chain: foundry,
    transport: http(RPC_URL),
  }).extend(publicActions);

  const walletAddress = await walletClient.getAddresses();
  console.log(`钱包地址: ${walletAddress[0]}\n`);

  // 方法 1: 使用 getContract 创建合约实例
  const counterContract = getContract({
    address: COUNTER_ADDRESS,
    abi: Counter_ABI,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });

  // 读取合约状态 - 获取当前 number 值
  console.log("--- 读取合约状态 ---");
  const currentNumber = await counterContract.read.number();
  console.log(`当前 number 值: ${currentNumber}\n`);

  // 方法 2: 使用 publicClient.readContract 读取
  const numberByReadContract = await publicClient.readContract({
    address: COUNTER_ADDRESS,
    abi: Counter_ABI,
    functionName: "number",
  });
  console.log(`通过 readContract 读取的 number 值: ${numberByReadContract}\n`);

  // 写入合约 - 调用 increment 方法
  console.log("--- 写入合约 - increment ---");
  try {
    const incrementHash = await counterContract.write.increment();
    console.log(`increment 交易哈希: ${incrementHash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: incrementHash,
    });
    console.log(`交易状态: ${receipt.status === 'success' ? '成功' : '失败'}\n`);

    // 再次读取 number 值，验证是否增加
    const newNumber = await counterContract.read.number();
    console.log(`increment 后的 number 值: ${newNumber}\n`);
  } catch (error) {
    console.error("调用 increment 失败:", error);
  }

  // 写入合约 - 调用 setNumber 方法
  console.log("--- 写入合约 - setNumber ---");
  try {
    const targetNumber = 100n;
    const setNumberHash = await counterContract.write.setNumber([targetNumber]);
    console.log(`setNumber 交易哈希: ${setNumberHash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: setNumberHash,
    });
    console.log(`交易状态: ${receipt.status === 'success' ? '成功' : '失败'}\n`);

    // 验证 number 值是否被设置
    const updatedNumber = await counterContract.read.number();
    console.log(`setNumber 后的 number 值: ${updatedNumber}\n`);
  } catch (error) {
    console.error("调用 setNumber 失败:", error);
  }

  // 方法 3: 使用 walletClient.writeContract 写入
  console.log("--- 使用 writeContract 写入 ---");
  try {
    const writeHash = await walletClient.writeContract({
      address: COUNTER_ADDRESS,
      abi: Counter_ABI,
      functionName: "increment",
      args: [],
    });
    console.log(`writeContract increment 交易哈希: ${writeHash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: writeHash,
    });
    console.log(`交易状态: ${receipt.status === 'success' ? '成功' : '失败'}\n`);

    // 最终读取 number 值
    const finalNumber = await counterContract.read.number();
    console.log(`最终 number 值: ${finalNumber}\n`);
  } catch (error) {
    console.error("使用 writeContract 调用失败:", error);
  }

  console.log("=== 示例完成 ===");
};

main().catch((error) => {
  console.error("执行出错:", error);
  process.exit(1);
});
