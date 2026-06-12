import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'

@Injectable()
export class EthereumService {
  private readonly logger = new Logger(EthereumService.name)
  private readonly provider: ethers.JsonRpcProvider

  constructor(private config: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      config.get('ETH_RPC_URL', 'https://cloudflare-eth.com'),
    )
  }

  generateKeypair() {
    const wallet = ethers.Wallet.createRandom()
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      seed: wallet.mnemonic?.phrase,
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (e) {
      this.logger.warn(`Failed to fetch ETH balance for ${address}`)
      return '0'
    }
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']
    const contract = new ethers.Contract(tokenAddress, abi, this.provider)
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals(),
    ])
    return ethers.formatUnits(balance, decimals)
  }

  async sendTransaction(params: {
    privateKey: string
    toAddress: string
    amount: string
    tokenAddress?: string
  }): Promise<string> {
    const wallet = new ethers.Wallet(params.privateKey, this.provider)

    if (params.tokenAddress) {
      const abi = ['function transfer(address to, uint256 amount) returns (bool)', 'function decimals() view returns (uint8)']
      const contract = new ethers.Contract(params.tokenAddress, abi, wallet)
      const decimals = await contract.decimals()
      const tx = await contract.transfer(
        params.toAddress,
        ethers.parseUnits(params.amount, decimals),
      )
      return tx.hash
    }

    const tx = await wallet.sendTransaction({
      to: params.toAddress,
      value: ethers.parseEther(params.amount),
    })
    return tx.hash
  }

  async estimateGas(params: { from: string; to: string; amount: string }): Promise<{
    slow: string
    standard: string
    fast: string
  }> {
    const feeData = await this.provider.getFeeData()
    const gasPrice = feeData.gasPrice ?? ethers.parseUnits('20', 'gwei')
    const gasLimit = 21000n
    const base = gasPrice * gasLimit

    return {
      slow: ethers.formatEther(base * 8n / 10n),
      standard: ethers.formatEther(base),
      fast: ethers.formatEther(base * 15n / 10n),
    }
  }
}
