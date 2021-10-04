import { Fragment, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import {  IMetadataExtension, MetadataCategory, Creator, MetadataFile,
          shortenAddress, MAX_METADATA_LEN, StringPublicKey,
} from 'oyster-common'
// import MintedNFT from './components/MintedNFT'
import PreviewItemCard from './components/PreviewItemCard'
import { getAssetCostToStore, LAMPORT_MULTIPLIER } from 'utils/assets'
import { getLast } from 'utils'
import { Plus } from 'images'
// import bs58 from 'bs58';
import { mintNFT } from 'modules/blockchain/Methods'
import { AudioBtn, CategoriesWrapper, CategoryHeader, ImageBtn, VideoBtn } from './components/categoriesStyles'
import * as Styles from './styles'

export default function Create() {
  const NETWORK = clusterApiUrl("devnet");
  const connection = new Connection(NETWORK);
  const env = 'devnet'
  const [nft, setNft] = useState<{ metadataAccount: StringPublicKey } | undefined>(undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [goToStep, setGoToStep] = useState<number>(0)
  const [showMintedNFT, setDisplayNFT] = useState<boolean>(false);
  //@ts-ignore
  const address = JSON.parse(localStorage.getItem('walletAddress'));
  //@ts-ignore
  const creatorStructs: Creator[] = new Creator({ address: address, verified: true, share: 100 });
  //@ts-ignore
  const { solana } = window;
  const wallet = solana;
  const [attributes, setAttributes] = useState<IMetadataExtension>({
    name: '',
    symbol: '',
    description: '',
    external_url: '',
    image: '',
    animation_url: undefined,
    attributes: undefined,
    seller_fee_basis_points: 0,
    //@ts-ignore
    creators: [creatorStructs],
    properties: {
      files: [],
      category: MetadataCategory.Image,
    },
  });

  const mint = async() => {
    const metadata = {
      name: attributes.name,
      symbol: attributes.symbol,
      creators: attributes.creators,
      description: attributes.description,
      sellerFeeBasisPoints: attributes.seller_fee_basis_points,
      image: attributes.image,
      animation_url: attributes.animation_url,
      attributes: attributes.attributes,
      external_url: attributes.external_url,
      properties: {
        files: attributes.properties.files,
        category: attributes.properties?.category,
      },
    };
    try {
      const _nft = await mintNFT(
        connection,
        wallet,
        env,
        files,
        metadata,
        attributes.properties?.maxSupply,
      );
      if (_nft) setNft(_nft);
      console.log(nft, '****minted nft')
    } catch (e: any) {
      console.error(e)
    }
  }
  
  // const publicKey = bs58.encode(Buffer.from(address))
  // console.log(publicKey, '***publicKey')
  // const toggleModal = () => setDisplayNFT(false);
  // const [showCategories, setViewCategories] = useState<boolean>(false);
  // const toggleCategoriesModal = () => setViewCategories(!showCategories)
  // const [proceedUploading, setProceedUploading] = useState<boolean>(false)

  const handleViewNFT = () => setDisplayNFT(true);

  const LaunchStep = (props: {
    confirm: () => void;
    attributes: IMetadataExtension;
    files: File[];
    connection: Connection;
  }) => {
    const [cost, setCost] = useState(0);
    const { image, animation_url } = useArtworkFiles(
      props.files,
      props.attributes,
    );
    const files = props.files;
    const metadata = props.attributes;
    useEffect(() => {
      const rentCall = Promise.all([
        props.connection.getMinimumBalanceForRentExemption(MintLayout.span),
        props.connection.getMinimumBalanceForRentExemption(MAX_METADATA_LEN),
      ]);
      if (files.length)
        getAssetCostToStore([
          ...files,
          new File([JSON.stringify(metadata)], 'metadata.json'),
        ]).then(async lamports => {
          const sol = lamports / LAMPORT_MULTIPLIER;

          // TODO: cache this and batch in one call
          const [mintRent, metadataRent] = await rentCall;

          // const uriStr = 'x';
          // let uriBuilder = '';
          // for (let i = 0; i < MAX_URI_LENGTH; i++) {
          //   uriBuilder += uriStr;
          // }

          const additionalSol = (metadataRent + mintRent) / LAMPORT_MULTIPLIER;

          // TODO: add fees based on number of transactions and signers
          setCost(sol + additionalSol);
        });
    }, [files, metadata, setCost]);

    return (
      <Styles.CreateItemBtn>
        <Styles.Btn 
        // onClick={handleViewNFT}
            onClick={handleMinting}
        >
          Pay With SOL
        </Styles.Btn>
      </Styles.CreateItemBtn>
    );
  };

  const handleMinting = async() => await mint()

    return (
      <main>
        <Styles.Container>
          <CollectiblesHeader />
          <Styles.InfoContainer>
            <Styles.UploadCard>
              <Styles.UploadCardHeader>
                <h4>Basic Info</h4>
              </Styles.UploadCardHeader>
                <InfoStep
                  attributes={attributes}
                  files={files}
                  setAttributes={setAttributes}
                  // confirm={() => setGoToStep(2)}
                />
              <Styles.MainNFTFileWrapper>
                <h5>Main NFT file*</h5>
                <Styles.SingleUploadWrapper>
                  <span />
                    {goToStep === 0 &&  (
                      <Styles.UploadInnerCard>
                        <CategoryStep
                          confirm={(category: MetadataCategory) => {
                            setAttributes({
                              ...attributes,
                              properties: {
                                ...attributes.properties,
                                category,
                              },
                            });
                            setGoToStep(1)
                          }}
                        />
                        {/* <h4>Upload NFT File</h4>
                        <p>PNG, GIF, WEBP, MP4 or MP3. Max 100mb.</p> */}
                      </Styles.UploadInnerCard>
                    )}
                    {goToStep === 1 &&  (
                      <Styles.UploadInnerCard>
                        <UploadStep
                          attributes={attributes}
                          setAttributes={setAttributes}
                          files={files}
                          setFiles={setFiles}
                          confirm={() => setGoToStep(1)}
                        />
                        <h4>Upload NFT File</h4>
                        <p>PNG, GIF, WEBP, MP4 or MP3. Max 100mb.</p>
                      </Styles.UploadInnerCard>
                    )}
                </Styles.SingleUploadWrapper>
              </Styles.MainNFTFileWrapper>
            </Styles.UploadCard>
          </Styles.InfoContainer>
          <PreviewItemCard  attributes={attributes} />
          <PutOnMarketplaceCard />
          {/* <RoyalitiesCard /> */}

          <Styles.RoyalitiesCardContainer>
            <Styles.RoyalitiesCardHeader>
              <h4>Royalities</h4>
              <p>Set a percentage of the secondary sales that you’ll recieve.</p>
            </Styles.RoyalitiesCardHeader>
            <Styles.RoyalitiesPercentageWrapper>
              <h4>Percentage</h4>
              {/* <Styles.PercentageInput type='number' placeholder='10                                                                                                                           %' /> */}
              
              <RoyaltiesStep
                attributes={attributes}
                confirm={() => setGoToStep(4)}
                setAttributes={setAttributes}
              />
              <p>Suggested: 0%, 10%, 20%, 30%. Maximum is 50%</p>
            </Styles.RoyalitiesPercentageWrapper>
          </Styles.RoyalitiesCardContainer>

          
          {showMintedNFT ? (
            <LaunchStep
              attributes={attributes}
              files={files}
              confirm={() => setGoToStep(5)}
              connection={connection}
            />
          ) : (
            <Styles.CreateItemBtn>
            <Styles.Btn onClick={handleViewNFT}>Create Item</Styles.Btn>
              <h4>Unsaved changes</h4>
          </Styles.CreateItemBtn>
          )}
          {/* <CustomModal
            heading={''}
            show={showMintedNFT}
            toggleModal={toggleModal}
          >
            <MintedNFT />
          </CustomModal> */}
        </Styles.Container>
      </main>
    )
  }

  interface Royalty {
  creatorKey: string;
  amount: number;
  }interface UserValue {
    key: string;
    label: string;
    value: string;
  }

  const useArtworkFiles = (files: File[], 
    attributes: IMetadataExtension) => {
      const [data, setData] = useState<{ image: string; animation_url: string }>({
        image: '',
        animation_url: '',
  });

  useEffect(() => {
    if (attributes.image) {
      const file = files.find(f => f.name === attributes.image);
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          setData((data: any) => {
            return {
              ...(data || {}),
              image: (event.target?.result as string) || '',
            };
          });
        };
        if (file) reader.readAsDataURL(file);
      }
    }

    if (attributes.animation_url) {
      const file = files.find(f => f.name === attributes.animation_url);
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          setData((data: any) => {
            return {
              ...(data || {}),
              animation_url: (event.target?.result as string) || '',
            };
          });
        };
        if (file) reader.readAsDataURL(file);
      }
    }
  }, [files, attributes]);

  return data;
  };

  const InfoStep = (props: {
    attributes: IMetadataExtension;
    files: File[];
    setAttributes: (attr: IMetadataExtension) => void;
    // confirm: () => void;
  }) => {
    const [creators, setCreators] = useState<Array<UserValue>>([]);
    const [royalties, setRoyalties] = useState<Array<Royalty>>([]);
    const { image, animation_url } = useArtworkFiles(
      props.files,
      props.attributes,
    );
    useEffect(() => {
      setRoyalties(
        creators.map(creator => ({
          creatorKey: creator.key,
          amount: Math.trunc(100 / creators.length),
        })),
      );
    }, [creators]);

    // const hadleInputField = (evnt: any, type:any) => {
    //   if(type === 'name') {
    //     props.setAttributes({
    //     ...props.attributes,
    //       name: evnt.target.value,
    //     })
    //   } else {
    //     props.setAttributes({
    //     ...props.attributes,
    //       description: evnt.target.value,
    //     })
    //   }
    // }
    return (
      <Fragment>
        <Styles.Title>
          <h5>Title</h5>
          <Styles.InputTitle 
            type="text" 
            autoFocus
            placeholder='Enter item name' 
            value={props.attributes.name}
            onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                    name: info.target.value,
                  })
            }
            // onChange={(e) => hadleInputField(e, 'name')} 
          />
        </Styles.Title>
        <Styles.Description>
          <h5>Description</h5>
          <Styles.InputDescription 
            type="text"
            autoFocus
            value={props.attributes.description}
            placeholder='Provide a detailed description                                                        upto 15 words'
            onChange={info =>
              props.setAttributes({
                ...props.attributes,
                  description: info.target.value,
              })
            }
            // onChange={(e) => hadleInputField(e, 'description')}
          />
          </Styles.Description>
          <Styles.MaxSupplyTitle>
          <h5>Maximum Supply</h5>
          <Styles.InputSupply 
            type="number" 
            // autoFocus
            placeholder='Enter Quantity'
            onChange={(info: any) => {
                  props.setAttributes({
                    ...props.attributes,
                    properties: {
                      ...props.attributes.properties,
                      maxSupply: Number(info.target.value),
                    },
                  });
                }}
          />
        </Styles.MaxSupplyTitle>
      </Fragment>
    )
  }

 const CategoryStep = (props: {
      confirm: (category: MetadataCategory) => void;

    }) => {
    // const handleCategoryClick = (props: any, type: string) => {
    //   if(type === 'IMAGE') {
    //     props.confirm(MetadataCategory.Image);
    //     toggleCategoriesModal();
    //     setProceedUploading(true)
    //   } else if(type === 'VIDEO') {
    //     props.confirm(MetadataCategory.Video);
    //     toggleCategoriesModal();
    //     setProceedUploading(true)
    //   } else if (type === 'AUDIO') {
    //     props.confirm(MetadataCategory.Audio);
    //     toggleCategoriesModal();
    //     setProceedUploading(true)
    //   } else {
    //     toggleCategoriesModal();
    //     setProceedUploading(false)
    //   }
    // }
    return (
        <Fragment>
          <CategoriesWrapper>
            <CategoryHeader>
              <h3>Select Category</h3>
            </CategoryHeader>
            <ImageBtn
              onClick={() =>   props.confirm(MetadataCategory.Image)}
              // onClick={() => handleCategoryClick(props, 'IMAGE')}
            >
              IMAGE
            </ImageBtn>
            <VideoBtn onClick={() => props.confirm(MetadataCategory.Video)}>VIDEO</VideoBtn>
            <AudioBtn onClick={() => props.confirm(MetadataCategory.Audio)}>AUDIO</AudioBtn>
          </CategoriesWrapper>
        </Fragment>
      )
  }

  const UploadStep = (props: {
    attributes: IMetadataExtension;
    setAttributes: (attr: IMetadataExtension) => void;
    files: File[];
    setFiles: (files: File[]) => void;
    confirm: () => void;
  }) => {
    const [coverFile, setCoverFile] = useState<File | undefined>(
      props.files?.[0],
    );
    const [mainFile, setMainFile] = useState<File | undefined>(props.files?.[1]);
    const [customURL, setCustomURL] = useState<string>('');
    const [customURLErr, setCustomURLErr] = useState<string>('');
    const disableContinue = !coverFile || !!customURLErr;

    useEffect(() => {
      props.setAttributes({
        ...props.attributes,
        properties: {
          ...props.attributes.properties,
          files: [],
        },
      });
    }, []);

    // const uploadMsg = (category: MetadataCategory) => {
    //   switch (category) {
    //     case MetadataCategory.Audio:
    //       return 'Upload your audio creation (MP3, FLAC, WAV)';
    //     case MetadataCategory.Image:
    //       return 'Upload your image creation (PNG, JPG, GIF)';
    //     case MetadataCategory.Video:
    //       return 'Upload your video creation (MP4, MOV, GLB)';
    //     default:
    //       return 'Please go back and choose a category';
    //   }
    // };

  // const acceptableFiles = (category: MetadataCategory) => {
  //   switch (category) {
  //     case MetadataCategory.Audio:
  //       return '.mp3,.flac,.wav';
  //     case MetadataCategory.Image:
  //       return '.png,.jpg,.gif';
  //     case MetadataCategory.Video:
  //       return '.mp4,.mov,.webm';
  //     default:
  //       return '';
  //   }
  // };
  const handleUpload = async(evnt: any) => {
    const file = evnt.target.files[0];
    // if (file) setCoverFile(file);
    setCoverFile(file);
    // continueToMint()
    
  }

  // const continueToMint = () => {
  //   // setCustomURL('');
  //   // setCustomURLErr('');
  //   // if (file) {
  //     // setMainFile(file);
  //     // setCoverFile(file);
  //     // setCustomURL('');
  //     // setCustomURLErr('');
  //     props.setAttributes({...props.attributes,
  //       properties: {
  //         ...props.attributes.properties,
  //         files: [coverFile, mainFile, customURL]
  //           .filter(f => f)
  //           .map(f => {
  //             const uri = typeof f === 'string' ? f : f?.name || '';
  //             const type =
  //               typeof f === 'string' || !f
  //                 ? 'unknown'
  //                 : f.type || getLast(f.name.split('.')) || 'unknown';

  //             return {
  //               uri,
  //               type,
  //             } as MetadataFile;
  //           }),
  //       },
  //       image: coverFile?.name || '',
  //       animation_url:
  //         props.attributes.properties?.category !==
  //           MetadataCategory.Image && customURL
  //           ? customURL
  //           : mainFile && mainFile.name,
  //     });
  //     props.setFiles([coverFile, mainFile].filter(f => f) as File[]);
  //           props.confirm();
  //   // };
  // }
    return (
      <Fragment>
        <label htmlFor="upload-button">
          <img src={Plus.default} alt="upload" />
        </label>
        <input
          type="file"
          id="upload-button"
          style={{ display: "none" }}
          // value={coverFile ? [coverFile as any] : []}
          onChange={handleUpload}
        />
        
        {disableContinue ? (
          <Styles.ContinueToMintBtn
            // disabled
            onClick={() => alert('Please select a file')}
            style={{backgroundColor: 'gray'}}
          >Continue to Mint
        </Styles.ContinueToMintBtn>
        ) : (
          <Styles.ContinueToMintBtn
            onClick={() => {
              props.setAttributes({
                ...props.attributes,
                properties: {
                  ...props.attributes.properties,
                  files: [coverFile, mainFile, customURL]
                    .filter(f => f)
                    .map(f => {
                      const uri = typeof f === 'string' ? f : f?.name || '';
                      const type =
                        typeof f === 'string' || !f
                          ? 'unknown'
                          : f.type || getLast(f.name.split('.')) || 'unknown';

                      return {
                        uri,
                        type,
                      } as MetadataFile;
                    }),
                },
                image: coverFile?.name || '',
                animation_url:
                  props.attributes.properties?.category !==
                    MetadataCategory.Image && customURL
                    ? customURL
                    : mainFile && mainFile.name,
              });
              props.setFiles([coverFile, mainFile].filter(f => f) as File[]);
              props.confirm();
            }}
          >Continue to Mint
          </Styles.ContinueToMintBtn>
        )}
      </Fragment>
    )

  }

  const RoyaltiesStep = (props: {
    attributes: IMetadataExtension;
    setAttributes: (attr: IMetadataExtension) => void;
    confirm: () => void;
  }) => {
    const { publicKey, connected } = useWallet();
    const [creators, setCreators] = useState<Array<UserValue>>([]);
    const [fixedCreators, setFixedCreators] = useState<Array<UserValue>>([]);
    const [royalties, setRoyalties] = useState<Array<Royalty>>([]);
    const [totalRoyaltyShares, setTotalRoyaltiesShare] = useState<number>(0);
    const [showCreatorsModal, setShowCreatorsModal] = useState<boolean>(false);
    const [isShowErrors, setIsShowErrors] = useState<boolean>(false);

    useEffect(() => {
      if (publicKey) {
        const key = publicKey.toBase58();
        setFixedCreators([
          {
            key,
            label: shortenAddress(key),
            value: key,
          },
        ]);
      }
    }, [connected, setCreators]);

    useEffect(() => {
      setRoyalties(
        [...fixedCreators, ...creators].map(creator => ({
          creatorKey: creator.key,
          amount: Math.trunc(100 / [...fixedCreators, ...creators].length),
        })),
      );
    }, [creators, fixedCreators]);

    useEffect(() => {
      // When royalties changes, sum up all the amounts.
      const total = royalties.reduce((totalShares, royalty) => {
        return totalShares + royalty.amount;
      }, 0);

      setTotalRoyaltiesShare(total);
    }, [royalties]);
    return (

      <Styles.PercentageInput 
        type='number'
        // autoFocus
         min={0}
        max={50}
        placeholder='10                                                                                                                           %'
        onChange={(evnt: any) => {
          props.setAttributes({
            ...props.attributes,
            seller_fee_basis_points: Number(evnt.target.value) * 100,
          });
        }}
        // value={props.attributes.seller_fee_basis_points}
        /> 
    )
}