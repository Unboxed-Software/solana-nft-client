import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js"
import * as fs from "fs"

const tokenName = "Unicorn"
const description = "A beautiful unicorn in a dreary world"
const symbol = "BLD"
const sellerFeeBasisPoints = 500
const imageFile = "assets/unicorn.png"
const imageName = "unicorn.png"
const mintAddress = new web3.PublicKey(
  "4hWsjqPCZudjHBYMB1PEhH1rvncP2dUsYWeHP4TyMaYy"
)
const offChainMetadata =
  "https://arweave.net/vTOh3mh-MxISOktPza12u5vDssHFeGFmb6TJq5T4eDU"

async function createOffChainMetadata(
  metaplex: Metaplex,
  imageFile: string,
  imageName: string,
  name: string,
  description: string
): Promise<string> {
  // read file and convert to buffer
  const buffer = fs.readFileSync(imageFile)

  // convert buffer to metaplex file
  const file = toMetaplexFile(buffer, imageName)

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  // upload off-chain metadata and get metadata uri

  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: name,
      description: description,
      image: imageUri,
    })
    .run()

  console.log("metadata uri:", uri)

  return uri
}

async function createNft(
  metaplex: Metaplex,
  uri: string,
  tokenName: string,
  symbol: string,
  sellerFeeBasisPoints: number
): Promise<NftWithToken> {
  const { nft } = await metaplex
    .nfts()
    .create({
      uri: uri,
      name: tokenName,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
      symbol: symbol,
    })
    .run()

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )

  return nft
}

async function updateNft(
  metaplex: Metaplex,
  uri: string,
  mintAddress: web3.PublicKey,
  tokenName: string,
  symbol: string,
  sellerFeeBasisPoints: number
) {
  // Get `NftWithToken` object type
  const nft = await metaplex.nfts().findByMint({ mintAddress }).run()

  await metaplex
    .nfts()
    .update({
      nftOrSft: nft,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
      name: tokenName,
      symbol: symbol,
      uri: uri,
    })
    .run()

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  console.log("PublicKey:", user.publicKey.toBase58())

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )

  const uri = await createOffChainMetadata(
    metaplex,
    imageFile,
    imageName,
    tokenName,
    description
  )

  const nft = await createNft(
    metaplex,
    uri,
    tokenName,
    symbol,
    sellerFeeBasisPoints
  )

  console.log(JSON.stringify(nft))

  // await updateNft(
  //   metaplex,
  //   offChainMetadata,
  //   mintAddress,
  //   tokenName,
  //   symbol,
  //   sellerFeeBasisPoints
  // )
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
