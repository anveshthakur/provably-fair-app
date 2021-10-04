import  { 
  // WalletSigner,
  ENV,
  programIds,
  createMint,
  toPublicKey,
  // Attribute,
  // Creator,
  StringPublicKey,
  findProgramAddress,
  createAssociatedTokenAccountInstruction,
  createMetadata,
  Data,
  sendTransactionWithRetry,
  updateMetadata,
  createMasterEdition,
  notify,
} from 'oyster-common';
import BN from 'bn.js';
import { 
  // Connection,
  Keypair,
  // PublicKey,
  SystemProgram,
  TransactionInstruction,
  
 } from '@solana/web3.js';
import { MintLayout, Token } from '@solana/spl-token';
import crypto from 'crypto';
// import bs58 from 'bs58';
import { AR_SOL_HOLDER_ID } from '../utils/ids';
import { getAssetCostToStore } from '../utils/assets';
const RESERVED_TXN_MANIFEST = 'manifest.json';


export const getNFTData = (data: any) => {
  console.log(data, 'nft details')
}

interface IArweaveResult {
  error?: string;
  messages?: Array<{
    filename: string;
    status: 'success' | 'fail';
    transactionId?: string;
    error?: string;
  }>;
}


  //@ts-ignore
  // const {solana} = window;
  // const publicKey = solana?.publicKey

export const mintNFT = async(
  connection: any,
  wallet: any,
  env: ENV,
  files: File[],
  metadata: any,
  // metadata: {
  //   name: string;
  //   symbol: string;
  //   description: string;
  //   image: string | undefined;
  //   animation_url: string | undefined;
  //   attributes: Attribute[] | undefined;
  //   external_url: string;
  //   properties: any;
  //   // creators: Creator[] | null;
  //   creators: any;
  //   sellerFeeBasisPoints: number;
  // },
  maxSupply?: number,
// ) => {
  ): Promise<{
  metadataAccount: StringPublicKey;
} | void> => {

  if (!wallet?._publicKey) return;
  //@ts-ignore
  // const address = JSON.parse(localStorage.getItem('walletAddress'));
  // const verifiedPublicKey = bs58.encode(Buffer.from(address))

    const metadataContent = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      seller_fee_basis_points: metadata.sellerFeeBasisPoints,
      image: metadata.image,
      animation_url: metadata.animation_url,
      attributes: metadata.attributes,
      external_url: metadata.external_url,
      properties: {
        ...metadata.properties,
        creators: metadata.creators?.map((creator: any) => {
          return {
            address: creator.address,
            share: creator.share,
          };
        }),
      },
  };
  console.log(metadata, '****metadata')
  console.log(metadataContent, '****metadataContent')

  const realFiles: any = [ ...files, new File([JSON.stringify(metadataContent)], 'metadata.json')];

  console.log(realFiles, '***realFiles')
  const { instructions: pushInstructions, signers: pushSigners } = 
      // await prepPayForFilesTxn(realFiles, metadata);
    await prepPayForFilesTxn(wallet, realFiles, metadata);
    

  const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
  const payerPublicKey = wallet._publicKey;
  const instructions: TransactionInstruction[] = [...pushInstructions];
  const signers: Keypair[] = [...pushSigners];
  const mintKey = createMint(
    instructions,
    wallet._publicKey,
    mintRent,
    0,
    // Some weird bug with phantom where it's public key doesnt mesh with data encode wellff
    toPublicKey(payerPublicKey),
    toPublicKey(payerPublicKey),
    signers,
  ).toBase58();

    const recipientKey = (
    await findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        programIds().token.toBuffer(),
        toPublicKey(mintKey).toBuffer(),
      ],
      programIds().associatedToken,
    )
  )[0];

    createAssociatedTokenAccountInstruction(
      instructions,
      toPublicKey(recipientKey),
      wallet.publicKey,
      wallet.publicKey,
      toPublicKey(mintKey),
    );
    const metadataAccount = await createMetadata(
    new Data({
      symbol: metadata.symbol,
      name: metadata.name,
      uri: ' '.repeat(64), // size of url for arweave
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      creators: metadata.creators
    }),
    payerPublicKey,
    mintKey,
    payerPublicKey,
    instructions,
    wallet.publicKey.toBase58(),
  );

  const { txid } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
  );

  try {
    await connection.confirmTransaction(txid, 'max');
  } catch {
    // ignore
  }

  const data = new FormData();

  const tags = realFiles.reduce(
    //@ts-ignore
    (acc: Record<string, Array<{ name: string; value: string }>>, f) => {
      acc[f.name] = [{ name: 'mint', value: mintKey }];
      return acc;
    },
    {},
  );
  data.append('tags', JSON.stringify(tags));
  data.append('transaction', txid);
    //@ts-ignore
  realFiles.map(f => data.append('file[]', f));

  // TODO: convert to absolute file name for image
  const uploadArweaveResponse = await fetch(
    // TODO: add CNAME
    env.startsWith('mainnet-beta')
      ? 'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFileProd2'
      : 'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile2',
    {
      method: 'POST',
      body: data,
    },
  );

  if (!uploadArweaveResponse.ok) {
    return Promise.reject(
      new Error(
        'Unable to upload the artwork to Arweave. Please wait and then try again.',
      ),
    );
  }

  const result: IArweaveResult = await uploadArweaveResponse.json();

  if (result.error) {
    return Promise.reject(new Error(result.error));
  }

  const metadataFile = result.messages?.find(
    m => m.filename === RESERVED_TXN_MANIFEST,
  );

    if (metadataFile?.transactionId && wallet.publicKey) {
    const updateInstructions: TransactionInstruction[] = [];
    const updateSigners: Keypair[] = [];

    // TODO: connect to testnet arweave
    const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;
    await updateMetadata(
      new Data({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: arweaveLink,
        creators: metadata.creators,
        sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      }),
      undefined,
      undefined,
      mintKey,
      payerPublicKey,
      updateInstructions,
      metadataAccount,
    );

    const TOKEN_PROGRAM_ID = programIds().token;

    updateInstructions.push(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        toPublicKey(mintKey),
        toPublicKey(recipientKey),
        toPublicKey(payerPublicKey),
        [],
        1,
      ),
    );
    // // In this instruction, mint authority will be removed from the main mint, while
    // // minting authority will be maintained for the Printing mint (which we want.)
    await createMasterEdition(
      maxSupply !== undefined ? new BN(maxSupply) : undefined,
      mintKey,
      payerPublicKey,
      payerPublicKey,
      payerPublicKey,
      updateInstructions,
    );

    // TODO: enable when using payer account to avoid 2nd popup
    /*  if (maxSupply !== undefined)
      updateInstructions.push(
        setAuthority({
          target: authTokenAccount,
          currentAuthority: payerPublicKey,
          newAuthority: wallet.publicKey,
          authorityType: 'AccountOwner',
        }),
      );
*/
    // TODO: enable when using payer account to avoid 2nd popup
    // Note with refactoring this needs to switch to the updateMetadataAccount command
    // await transferUpdateAuthority(
    //   metadataAccount,
    //   payerPublicKey,
    //   wallet.publicKey,
    //   updateInstructions,
    // );

    const txid = await sendTransactionWithRetry(
      connection,
      wallet,
      updateInstructions,
      updateSigners,
    );
      console.log(txid, '***txid')
    notify({
      message: 'Art created on Solana',
      description: (
        `<a href={arweaveLink} target="_blank" rel="noopener noreferrer">
          Arweave Link
        </a>`
      ),
      type: 'success',
    });

    // TODO: refund funds

    // send transfer back to user
  }
  return { metadataAccount };
}

export const prepPayForFilesTxn = async (
  wallet:any,
  files: File[],
  metadata: any,
// ) => {
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> => {
  const memo = programIds().memo;

  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];
  if (wallet._publicKey)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: AR_SOL_HOLDER_ID,
        lamports: await getAssetCostToStore(files),
      }),
    );

  for (let i = 0; i < files.length; i++) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(await files[i].text());
    const hex = hashSum.digest('hex');
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: memo,
        data: Buffer.from(hex),
      }),
    );
  }

  return {
    instructions,
    signers,
  };
};