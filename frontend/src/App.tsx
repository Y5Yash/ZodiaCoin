import React, { useState } from 'react';
import './App.css';
import QRCode from 'react-qr-code';
import { Navbar } from './components/navbar.component';
import { ethers } from 'ethers';
import contractABI from './assets/ZodiaCoin.json';
import { Proof } from '@reclaimprotocol/reclaim-sdk'
import { CompleteClaimData, ClaimInfo, createSignDataForClaim } from '@reclaimprotocol/crypto-sdk';

let provider = new ethers.providers.Web3Provider(window.ethereum);

const contractAddresses = [
    '0xc0485Cff38E35F526E0eEb5f486d4b9d18b528b0',
    '0x47d2932F561407b9C7213B5d1Ca26BB2Bf248Fc7',
    '0x18d41A4f729e7b7a4DB3B01f05b080f59588897C',
    '0x48B71Ee4461Ed3Cd337499909172Ff338952F6d4',
    '0xd911ca42F42529D5a9271D28407c6a24B8E0B683',
    '0x71DE22F75c6f542b6C516c54fa102c7220664422',
    '0x7135B0B5F92E942Efc51D17f28086Ea09f329277',
    '0xBCD432842ADeE7cf3a1976C4089cb924D4a8Dd28',
    '0x32CeCe60340864Ca7C51ccdaCF207c080Dcb7553',
    '0x1BBa60A886851f6b2B83742B02ae3c4517eB73A1',
    '0x3261557D92362CF19be96067b6CC09822D91CdBb',
    '0x38F3cAc6fD71730AEA4c9943853065c3C2D6F121'
  ];
const tokenNameList = [
  'Aries Coin',
  'Taurus Coin',
  'Gemini Coin',
  'Cancer Coin',
  'Leo Coin',
  'Virgo Coin',
  'Libra Coin',
  'Scorpio Coin',
  'Sagittarius Coin',
  'Capricorn Coin',
  'Aquarius Coin',
  'Pisces Coin'
]
// Reclaim temp Contract address: 0x7a39200A79d87A8c848e90406cc4708E73aCB3A1

const App: React.FC = () => {
    const [isMetamask, setIsMetamask] = useState(false);
    const [defaultAccount, setDefaultAccount] = useState('');
    const [callbackId, setCallbackId] = useState('');
    const [template, setTemplate] = useState('');
    const [isTemplateOk, setIsTemplateOk] = useState(true);
    const [isProofReceived, setIsProofReceived] = useState(false);
    const [proofObj, setProofObj] = useState<Proof>()
    const [isFetchedMsgClicked, setIsFetchMsgClicked] = useState(false);
    const [isAirdropped, setIsAirdropped] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [currentContractAddress, setCurrentContractAddress] = useState('');
    const [tokenName, setTokenName] = useState('');
    const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);
    const [isFetchingProof, setIsFetchingProof] = useState(false);
    const [isFetchingTx, setIsFetchingTx] = useState(false);

    const backendBase = 'https://zodiacoin-backend.onrender.com';
    const backendTemplateUrl = `${backendBase}/request-proofs`;
    const backendProofUrl = `${backendBase}/get-proofs`;

    const connectWalletHandler = () => {
        if (window.ethereum) {
          const optChainId = 420;
          provider.send("wallet_switchEthereumChain", [{chainId: `0x${optChainId.toString(16)}`}]);
          provider = new ethers.providers.Web3Provider(window.ethereum);
          provider.send("eth_requestAccounts", []).then(async () => {
            await accountChangedHandler(provider.getSigner());
          });
          setIsMetamask(true);
        }
        else {
          setIsMetamask(false);
        }
      };

      const accountChangedHandler = async (userAddr: ethers.providers.JsonRpcSigner) => {
        const address = await userAddr.getAddress();
        setDefaultAccount(address);
        console.log(address);
      };

      const getZodiacIdFromProof = (date: number, month: number) => {
        const bday100 = 100*(month%12) + date;
        const sunSignStart = [321, 420, 521, 621, 723, 823, 923, 1023, 1122, 1222, 120, 219, 321];
        for (let i = 0; i<12; i++)
        {
            if ((sunSignStart[i]%1200) <= bday100 && bday100 < sunSignStart[i+1])
            {
                return i+1;
            }
        }
        return 0;
      };

      const initiateAirDrop = async () => {
        setIsFetchingTx(true);
        if (window.ethereum) {
            try {
                const param = JSON.parse(proofObj?.parameters as string);
                const dobList = param.dob.split('-');
                const year = Number(dobList[0]);
                const month = Number(dobList[1]);
                const day = Number(dobList[2]);
                const zodiacNum = getZodiacIdFromProof(day, month);
                if (zodiacNum === 0) {
                    throw new Error("zodiac not recognized, check dob");
                }
                const claimInfo: ClaimInfo = {
                    provider: proofObj?.provider as string,
                    parameters: param,
                    context: proofObj?.context
                }
 
                const ownerAddr = ethers.utils.computeAddress(ethers.utils.arrayify(`0x${proofObj!.ownerPublicKey}`))
                console.log("Owner Address: ", ownerAddr);
                console.log("default Account: ", defaultAccount);
                // console.log(Buffer.from(proofObj!.ownerPublicKey))

                const claimData: CompleteClaimData = {
                    claimId: 0,
                    infoHash: proofObj?.identifier as string,
                    owner: ownerAddr,
                    timestampS: Number(proofObj?.timestampS),
                    identifier: proofObj?.identifier,
                    epoch: proofObj?.epoch,
                }
                console.log("claimData: ",claimData)
                const claimDataStr = createSignDataForClaim(claimData);
                console.log("Claim Data Str to sign: ", claimDataStr);

                const zodiacAddress = await provider._getAddress(contractAddresses[zodiacNum - 1]);
                console.log(zodiacAddress);
                setCurrentContractAddress(zodiacAddress);
                setTokenName(tokenNameList[zodiacNum -1]);
                const contractZodiac = new ethers.Contract(zodiacAddress, contractABI, provider.getSigner());

                const overrides = {gasLimit: 1000000};

                // console.log(proofObj?.ownerPublicKey)
                // console.log(proofObj?.epoch, day, month, year, proofObj?.provider, defaultAccount, claimData, proofObj?.signatures, overrides);
                console.log(proofObj?.epoch, " <- epoch");
                console.log(day, " <- day");
                console.log(month, " <- month")
                console.log(year, " <- year")
                console.log(proofObj?.provider, " <- provider")
                console.log(defaultAccount, " <- contextAddress")
                console.log(claimData, " <- claimData");
                console.log(proofObj?.signatures[0], "<- proofObj.signatures[0]")

                const tx = await contractZodiac.airDrop(proofObj?.epoch, day, month, year, proofObj?.provider, defaultAccount, claimData, proofObj?.signatures, overrides);
                console.log("the transaction hash is : ", tx.hash);
                const receipt = await tx.wait();
                console.log("the transaction receipt is : ", receipt);
                setIsAirdropped(true);
                setTxHash(tx.hash);
            }
            catch (error) {
                console.log(error);
                setIsAirdropped(false);
            }
        }
        setIsFetchingTx(false);
        return;
      };

      const handleGetTemplate = async () => {
        setIsFetchingTemplate(true);
        try {
          console.log(`Requesting ${backendTemplateUrl}?addr=${defaultAccount}`);
          const response = await fetch(`${backendTemplateUrl}?addr=${defaultAccount}`);
          if (response.ok) {
            const data = await response.json();
            if (data?.error) {
              console.log(data.error);
              throw new Error(data.error);
            }
            setCallbackId(data.callbackId);
            setTemplate(data.reclaimUrl);
            setIsTemplateOk(true);
            console.log('The template generated is: ', template);
          }
          else {
            setIsTemplateOk(false);
            setTemplate('Error: Unable to receive a valid template from the backend. Check if it is up and running');
          }
        }
        catch (error) {
          setIsTemplateOk(false);
          setTemplate('Error: ' + error);
          console.log(error);
        }
        setIsFetchingTemplate(false);
        return;
      };

      const handleGetProof = async () => {
        setIsFetchingProof(true);
        try {
          console.log(`Requesting ${backendProofUrl}?id=${callbackId}`);
          const response = await fetch(`${backendProofUrl}?id=${callbackId}`);
          if (response.status === 200) {
            const proofData = await response.json();
            setIsProofReceived(true);
            setProofObj(proofData[0] as Proof);
            console.log(proofData[0]);
          }
        }
        catch (error) {
          setIsProofReceived(false);
          console.log(error);
        }
        setIsFetchMsgClicked(true);
        setIsFetchingProof(false)
        return;
      };

    return (
        <div className='App'>
            <Navbar walletAddr={defaultAccount? defaultAccount: "Wallet Not Connected"}/>
            <div className='center-body'>
                <div className='leftside-container'>
                    <div className='leftside'>
                        <h1>ZodiaCoin</h1>
                        <h2>Get your zodiac's token airdropped today!</h2>
                        <br/>
                        
                        { !defaultAccount && 
                            // Connect Metamask Wallet
                            <button onClick={connectWalletHandler}>Connect to Metamask!</button>
                        }

                        { isMetamask && defaultAccount && !template && !isProofReceived &&
                            // Await for the template
                            <div className='button-container'>
                              {<button onClick={handleGetTemplate} disabled={isFetchingTemplate}>Get the proof link/QR</button>}
                              {isFetchingTemplate && <div className='loading-spinner'/>}
                            </div>
                        }

                        { isMetamask && defaultAccount && template && isTemplateOk && !isProofReceived &&
                            // button to click once a proof is submitted.
                            // Display message if proof is not submitted when button is pressed
                            <div>
                                <div>Scan the QR code or click on it to be redirected.</div>
                                <div className='button-container'>
                                  <button onClick={handleGetProof} disabled={isFetchingProof}>Fetch Proof</button>
                                  {isFetchingProof && <div className='loading-spinner'/>}
                                </div>
                                {isFetchedMsgClicked && 
                                    <div className='error-txn'>Proof not yet received at the backend.
                                        <br/>Wait for the success message on the Reclaim Wallet and retry again. 
                                    </div>
                                }
                            </div>
                        }

                        { template && !isTemplateOk && !isProofReceived && 
                            // Error message if the template is not received.
                            <div>{template}</div>
                        }

                        { isMetamask && isProofReceived && !isAirdropped &&
                            // initiate transaction if proof is received.
                            <div className='button-container'>
                              <button onClick={initiateAirDrop} disabled={isFetchingTx}>Airdrop me!</button>
                              {isFetchingTx && <div className='loading-spinner'/>}
                            </div>
                        }
                        
                        { isAirdropped && 
                          <div>
                            <div>Transaction Hash: {txHash}</div><br/>
                            <div>Import {tokenName} from: {currentContractAddress}</div>
                          </div>
                        }
                    </div>
                </div>
                { !(template && isTemplateOk && !isProofReceived) && 
                    // Display theme image if QR is not to be displayed
                    <div className='rightside'></div>
                }

                { template && isTemplateOk && !isProofReceived && 
                    // Display the QR code
                    <div className='rightside2'>
                        <div className='QR-black'>
                            <div className='QR-white'>
                                <a href={template} target="_blank" rel="noopener noreferrer" title={template}>
                                    <QRCode
                                        size={256}
                                        value={template}
                                        fgColor="#000"
                                        bgColor="#fff"
                                        className='QR-resize'
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                }
                </div>
            </div>
    );
}

export default App;