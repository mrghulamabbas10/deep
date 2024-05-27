// =================================
import Marquee from 'react-fast-marquee'

import Link from 'next/link'

import { FaBars } from 'react-icons/fa'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

import { useCallback } from 'react'
import { Paper, Snackbar, LinearProgress } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import { DefaultCandyGuardRouteSettings, Nft } from '@metaplex-foundation/js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import confetti from 'canvas-confetti'
import Countdown from 'react-countdown'

import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { GatewayProvider } from '@civic/solana-gateway-react'
import { defaultGuardGroup, network } from './config'

import { collectionImageURL } from './config'
import { collectionTitle } from './config'
import { collectionDescription } from './config'

import { tokenType } from './config'
import { websiteURL } from './config'
import { twitterURL } from './config'
import { discordURL } from './config'

import { MultiMintButton } from './MultiMintButton'
//import { MintButton } from "./MintButton";
import { MintCount, Section, Container, Column } from './styles'
import { AlertState } from './utils'
import NftsModal from './NftsModal'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import useCandyMachineV3 from './hooks/useCandyMachineV3'
import {
  CustomCandyGuardMintSettings,
  NftPaymentMintSettings,
  ParsedPricesForUI,
} from './hooks/types'
import { guardToLimitUtil } from './hooks/utils'

// icnos
import { IoLogoTwitter } from 'react-icons/io'
import { BiLogoTelegram } from 'react-icons/bi'
import { IoLogoInstagram } from 'react-icons/io5'
import { FaTiktok } from 'react-icons/fa6'
import { FaYoutube } from 'react-icons/fa'
import Icon from './assets/icon'
import SocialIcon2 from './assets/social-icon-2'
import Image from 'next/image'

// import { MdOutlineSegment } from 'react-icons/md'

const StartTimer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 32px;
  gap: 48px;
  background: var(--alt-background-color);
  border-radius: 8px;
  @media only screen and (max-width: 450px) {
    gap: 16px;
    padding: 16px;
    width: -webkit-fill-available;
    justify-content: space-between;
  }
`
const StartTimerInner = styled(Paper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 16px;
  min-width: 90px;
  border-radius: 0px !important;
  box-shadow: none !important;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 100%;
  background: none !important;
  text-transform: uppercase;
  color: var(--white);
  span {
    font-style: normal;
    font-weight: 800;
    font-size: 48px;
    line-height: 100%;
  }

  @media only screen and (max-width: 450px) {
    min-width: 70px;
    span {
      font-size: 32px;
    }
  }
`
const StartTimerWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  padding: 0px;
  gap: 16px;
  width: -webkit-fill-available;
`
const StartTimerSubtitle = styled.p`
  font-style: normal;
  font-weight: 600;
  font-size: 20px;
  line-height: 100%;
  text-transform: uppercase;
  color: #ffffff;
`

const NAV_LINKS = [
  {
    icon: <IoLogoTwitter />,
    linkPath: '',
  },
  {
    icon: <BiLogoTelegram />,
    linkPath: '',
  },
  {
    icon: <SocialIcon2 />,
    linkPath: '',
  },
  {
    icon: <IoLogoInstagram />,
    linkPath: '',
  },
  {
    icon: <FaTiktok />,
    linkPath: '',
  },
  {
    icon: <FaYoutube />,
    linkPath: '',
  },
  {
    icon: <Icon />,
    linkPath: '',
  },
]

export interface HomeProps {
  candyMachineId: PublicKey
}
const candyMachinOps = {
  allowLists: [
    {
      list: require('../cmv3-demo-initialization/allowlist.json'),
      groupLabel: 'waoed',
    },
  ],
}

export default function Home(props: HomeProps) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const candyMachineV3 = useCandyMachineV3(props.candyMachineId, candyMachinOps)

  const [balance, setBalance] = useState<number>()
  const [mintedItems, setMintedItems] = useState<Nft[]>()

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: '',
    severity: undefined,
  })

  const { guardLabel, guards, guardStates, prices } = useMemo(() => {
    const guardLabel = defaultGuardGroup
    return {
      guardLabel,
      guards:
        candyMachineV3.guards[guardLabel] ||
        candyMachineV3.guards.default ||
        {},
      guardStates: candyMachineV3.guardStates[guardLabel] ||
        candyMachineV3.guardStates.default || {
          isStarted: true,
          isEnded: false,
          isLimitReached: false,
          canPayFor: 10,
          messages: [],
          isWalletWhitelisted: true,
          hasGatekeeper: false,
        },
      prices: candyMachineV3.prices[guardLabel] ||
        candyMachineV3.prices.default || {
          payment: [],
          burn: [],
          gate: [],
        },
    }
  }, [candyMachineV3.guards, candyMachineV3.guardStates, candyMachineV3.prices])
  useEffect(() => {
    console.log({ guardLabel, guards, guardStates, prices })
  }, [guardLabel, guards, guardStates, prices])
  useEffect(() => {
    ;(async () => {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey)
        setBalance(balance / LAMPORTS_PER_SOL)
      }
    })()
  }, [wallet, connection])

  useEffect(() => {
    if (mintedItems?.length === 0) throwConfetti()
  }, [mintedItems])

  const openOnSolscan = useCallback((mint) => {
    window.open(
      `https://solscan.io/address/${mint}${
        [WalletAdapterNetwork.Devnet, WalletAdapterNetwork.Testnet].includes(
          network
        )
          ? `?cluster=${network}`
          : ''
      }`
    )
  }, [])

  const throwConfetti = useCallback(() => {
    confetti({
      particleCount: 400,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [confetti])

  const startMint = useCallback(
    async (quantityString: number = 1) => {
      const nftGuards: NftPaymentMintSettings[] = Array(quantityString)
        .fill(undefined)
        .map((_, i) => {
          return {
            burn: guards.burn?.nfts?.length
              ? {
                  mint: guards.burn.nfts[i]?.mintAddress,
                }
              : undefined,
            payment: guards.payment?.nfts?.length
              ? {
                  mint: guards.payment.nfts[i]?.mintAddress,
                }
              : undefined,
            gate: guards.gate?.nfts?.length
              ? {
                  mint: guards.gate.nfts[i]?.mintAddress,
                }
              : undefined,
          }
        })

      console.log({ nftGuards })
      // debugger;
      candyMachineV3
        .mint(quantityString, {
          groupLabel: guardLabel,
          nftGuards,
        })
        .then((items) => {
          setMintedItems(items as any)
        })
        .catch((e) =>
          setAlertState({
            open: true,
            message: e.message,
            severity: 'error',
          })
        )
    },
    [candyMachineV3.mint, guards]
  )

  useEffect(() => {
    console.log({ candyMachine: candyMachineV3.candyMachine })
  }, [candyMachineV3.candyMachine])

  const MintButton = ({
    gatekeeperNetwork,
  }: {
    gatekeeperNetwork?: PublicKey
  }) => (
    <MultiMintButton
      candyMachine={candyMachineV3.candyMachine}
      gatekeeperNetwork={gatekeeperNetwork}
      isMinting={candyMachineV3.status.minting}
      setIsMinting={() => {}}
      isActive={!!candyMachineV3.items.remaining}
      isEnded={guardStates.isEnded}
      isSoldOut={!candyMachineV3.items.remaining}
      guardStates={guardStates}
      onMint={startMint}
      prices={prices}
    />
  )

  const solCost = useMemo(
    () =>
      prices
        ? prices.payment
            .filter(({ kind }) => kind === 'sol')
            .reduce((a, { price }) => a + price, 0)
        : 0,
    [prices]
  )

  const tokenCost = useMemo(
    () =>
      prices
        ? prices.payment
            .filter(({ kind }) => kind === 'token')
            .reduce((a, { price }) => a + price, 0)
        : 0,
    [prices]
  )

  let candyPrice = null
  if (
    prices.payment
      .filter(({ kind }) => kind === 'token')
      .reduce((a, { kind }) => a + kind, '')
  ) {
    candyPrice = `${tokenCost} ${tokenType}`
  } else if (
    prices.payment
      .filter(({ kind }) => kind === 'sol')
      .reduce((a, { price }) => a + price, 0)
  ) {
    candyPrice = `◎ ${solCost}`
  } else {
    candyPrice = '1 NFT'
  }

  console.log(candyPrice)

  const [count, setCount] = useState(1)

  // new code

  const handleIncrement = () => {
    setCount(count + 1)
  }

  const handleDecrement = () => {
    if (count > 1) {
      setCount(count - 1)
    }
  }

  const [menuShow, setMenuShow] = useState(false)

  const HandleClick = () => {
    setMenuShow(true)
  }

  useGSAP(() => {
    var tl = gsap.timeline()

    tl.from('nav a span', {
      y: 100,
      duration: 0.5,
      delay: 0.3,
      opacity: 0,
      stagger: 0.15,
    })

    tl.from('nav img', {
      y: 100,
      duration: 0.5,
      delay: 0.3,
      opacity: 0,
    })
    tl.from('nav button', {
      y: 100,
      duration: 0.5,
      delay: 0.3,
      opacity: 0,
      stagger: 0.15,
    })

    tl.from('h1', {
      y: 100,
      duration: 0.5,
      delay: 0.3,
      opacity: 0,
    })

    gsap.from('.main img', {
      y: 100,
      duration: 0.5,
      delay: 0.3,
      opacity: 0,
    })
  }, [])

  return (
    <>
      {/* navbar  */}
      <div className='relative'>
        <nav className='md:px-10 px-5 py-6 flex items-center justify-between '>
          <div className='md:flex items-center gap-3 hidden'>
            {NAV_LINKS.map((item, idx) => (
              <Link
                href={`${item.linkPath}`}
                key={idx}
              >
                <span className='w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#247EDF]'>
                  {item.icon}
                </span>
              </Link>
            ))}
          </div>
          <div className='block relative md:w-[115px] md:h-[115px] w-20 h-20'>
            <Image
              src='/logo.png'
              alt='logo'
              layout='fill'
              className=''
            />
          </div>
          <div className='lg:flex gap-5 items-center hidden'>
            <button className='!capitalize underline text-white font-semibold'>
              Back to Website
            </button>
            {wallet ? (
              <div>
                <WalletMultiButton />
              </div>
            ) : (
              <WalletMultiButton />
            )}
          </div>
          <div className='md:hidden block relative text-white'>
            <button onClick={HandleClick}>
              <FaBars className='text-3xl' />
            </button>
          </div>
        </nav>
      </div>
      {/* navbar  */}
      <div className='relative main'>
        {/* bottom  */}
        <div className='w-[200px] h-[186px] absolute  top-[130%] left-10 hidden '>
          <Image
            src='/ewee-2.png'
            alt='evee'
            layout='fill'
          />
        </div>
        {/* top  */}
        <div className='w-[200px] h-[186px] absolute top-[10%] -left-20 hidden'>
          <Image
            src='/evee.png'
            alt='ewee-2'
            layout='fill'
          />
        </div>
        <div className='w-[200px] h-[186px] absolute top-[0%] -right-16 hidden'>
          <Image
            src='/ewee-2.png'
            alt='evee'
            layout='fill'
          />
        </div>
        <h1 className='md:text-[67px] text-[40px] font-bold text-center'>
          THE <br /> FAMILY TOKEN
        </h1>
        {/* Slider  */}
        <div className='slider relative -mx-4 -z-0 md:mt-5 mt-8 bg-[#FF9900] text-black py-4 lg:rotate-[-6deg] rotate-[-10deg] lg:w-[105%]'>
          <Marquee direction='left'>
            <div className='flex lg:gap-10 gap-5 items-center'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
                <div
                  className='flex items-center gap-10'
                  key={index}
                >
                  <h2 className='text-2xl font-bold'>FAMILY TOKEN</h2>
                  <span className='border border-black rounded-full w-5 h-5'></span>
                </div>
              ))}
            </div>
          </Marquee>
        </div>
        {/* Slider  */}
        <div className=' '>
          <div className='absolute z-20 left-0 top-[33%] -rotate-12'>
            <div className='lg:w-[500px] md:w-[200px] w-[230px] h-[400px]  object-contain'>
              <Image
                src='/avatar-1.png'
                alt='avatar-1'
                layout='fill'
                objectFit='contain'
              />
            </div>
          </div>

          <div className='absolute z-20 md:right-24 right-10 md:top-[10%] top-[50%] rotate-12'>
            <div className='lg:w-[300px] md:w-[150px] w-[200px] h-[400px] object-contain  '>
              <Image
                src='/avatar-2.png'
                alt='avatar-2'
                layout='fill'
                objectFit='contain'
              />
            </div>
          </div>
        </div>
        <div className='flex justify-center items-center md:mt-20 mt-14'>
          <div>
            {/* Increment Decrement */}
            <div>
              {/* <div className='flex items-center justify-center mt-2'>
                <button
                  onClick={handleDecrement}
                  className='bg-[#FFFFFF4D] text-black font-bold py-2 px-4 rounded-l'
                >
                  -
                </button>
                <div className='bg-[#FFFFFF33] text-white py-2 px-10 w-52  text-center'>
                  {count}
                </div>
                <button
                  onClick={handleIncrement}
                  className='bg-[#FFFFFF4D] text-black font-bold py-2 px-4 rounded-r'
                >
                  +
                </button>
              </div> */}
              {/* <p className='text-center mt-2 font-normal'>4 ETH + Gas</p> */}
            </div>
            {/* Increment Decrement */}
            {!guardStates.isStarted ? (
              <Countdown
                date={guards.startTime}
                renderer={renderGoLiveDateCounter}
                onComplete={() => {
                  candyMachineV3.refresh()
                }}
              />
            ) : !wallet?.publicKey ? (
              <>
                {' '}
                <p className='bg-[#FFFFFF33] text-white py-2 px-10 w-52  text-center'>
                  Please Connect Wallet First
                </p>{' '}
              </>
            ) : // ) : !guardStates.canPayFor ? (
            //   <h1>You cannot pay for the mint</h1>
            !guardStates.isWalletWhitelisted ? (
              <div>
                <p>Mint is private</p>
                <p>
                  You’re currently not allowed to mint. Try again at a later
                  time.
                </p>
              </div>
            ) : (
              <>
                <>
                  {!!candyMachineV3.items.remaining &&
                  guardStates.hasGatekeeper &&
                  wallet.publicKey &&
                  wallet.signTransaction ? (
                    <GatewayProvider
                      wallet={{
                        publicKey: wallet.publicKey,
                        //@ts-ignore
                        signTransaction: wallet.signTransaction,
                      }}
                      gatekeeperNetwork={guards.gatekeeperNetwork}
                      connection={connection}
                      cluster={
                        process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
                      }
                      options={{ autoShowModal: false }}
                    >
                      <MintButton
                        gatekeeperNetwork={guards.gatekeeperNetwork}
                      />
                    </GatewayProvider>
                  ) : (
                    <div>
                      <MintButton />
                    </div>
                  )}
                </>
              </>
            )}

            {/* <button className='bg-[#FEEB1A] text-black w-[287px] border-2 border-white rounded-lg py-3 mt-7 font-bold'>
              Mint Family
            </button> */}
          </div>
          <div className='absolute  lg:bottom-[10%] md:bottom-[20%] bottom-[12%] '>
            <div className='border border-white p-4 md:rounded-3xl rounded-md relative'>
              <span className='bg-[#FFA044] py-1 px-3 -top-5 left-[35%] rotate-6 font-bold absolute rounded-full text-black'>
                Contract Address
              </span>
              <div className='code_bg py-4 px-5 md:rounded-3xl rounded-md'>
                <h4 className='md:text-base text-[10px]'>
                  7njsg9BA1xvXX9DNpe5fERHK4zb7MbCHKZ6zsx5k3adr
                </h4>
              </div>
            </div>
          </div>{' '}
        </div>

        <div className='absolute lg:bottom-[10%]  bottom-5 right-10 block'>
          <h3 className='md:text-[36px] text-xl text-end'>
            Total NFTs <br /> Minted
          </h3>
          {guardStates.isStarted && wallet.publicKey && (
            <p className='font-light text-end'>
              {candyMachineV3.items.redeemed}/{candyMachineV3.items.available}
            </p>
          )}
        </div>
      </div>
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </>
  )
}

const renderGoLiveDateCounter = ({ days, hours, minutes, seconds }: any) => {
  return (
    <StartTimerWrap>
      <StartTimerSubtitle>Mint opens in:</StartTimerSubtitle>
      <StartTimer>
        <StartTimerInner elevation={1}>
          <span>{days}</span>Days
        </StartTimerInner>
        <StartTimerInner elevation={1}>
          <span>{hours}</span>
          Hours
        </StartTimerInner>
        <StartTimerInner elevation={1}>
          <span>{minutes}</span>Mins
        </StartTimerInner>
        <StartTimerInner elevation={1}>
          <span>{seconds}</span>Secs
        </StartTimerInner>
      </StartTimer>
    </StartTimerWrap>
  )
}
