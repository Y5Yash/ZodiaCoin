// import { useState } from "react";
import { Proof } from '@reclaimprotocol/reclaim-sdk';
import { Address, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from "ethers";
import contractABI from '../assets/ZodiaCoin.json';

const contractAddresses: Address[] = [
    "0xd24554f8443281FD1Ca9E01e3D1a74D474a8621F",
    "0x3054A468f2cF08A246dBa19a30D0ECC8bAcD2C2e",
    "0x86246Cee68cE062d5720D32F3C934a297F8d5B85",
    "0x94ecEb493871d2939c9B52672135c93F6C219cEf",
    "0x2BA47AA3dE7f915B47718d10C484DA8f6fA3797a",
    "0xB6D0b60D4468F329Cd139B966D499aE5C7E8B12F",
    "0xd454035Fc9D0d826A4C1612c4B49C055A97f6d16",
    "0x5b47A6D9dbd8b3C89AfE1208Bc8a29d60dDEbeE3",
    "0x0c3943bff725EccA414742a19389E324321089d7",
    "0x8eb2bc399F70A6734e4a8B82323727A96A76bFdc",
    "0x7F451150AFC91eeEF4D707e055430023d24D6Eaa",
    "0xA55d1Bd86605FE9A1Ce5b4c55e8801020f60c604"
  ]

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

export function AirDrop({proofObj}: {proofObj: Proof}) {
    // const [isAirdropped, setIsAirdropped] = useState(false);
    // const [txHash, setTxHash] = useState('');
    // const [tokenName, setTokenName] = useState('');
    // const [currentContractAddress, setCurrentContractAddress] = useState('');
    // console.log(proofObj);

    const param = JSON.parse(proofObj?.parameters as string);
    const dobList = param.dob.split('-');
    const year = Number(dobList[0]);
    const month = Number(dobList[1]);
    const day = Number(dobList[2]);
    // console.log(dobList);

    const claimData = {
        identifier: proofObj.identifier,
        owner: ethers.computeAddress(`0x${proofObj.ownerPublicKey}`),
        timestampS: Number(proofObj.timestampS),
        epoch: proofObj.epoch
    }

    // console.log("Here")
    const contextObj = JSON.parse(proofObj.context);
    // console.log(contextObj);

    const args = [proofObj.epoch, day, month, year, proofObj.provider, contextObj.contextAddress, contextObj.sessionId, claimData, proofObj.signatures];
    console.log(args)

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
    const zodiacId = getZodiacIdFromProof(day, month) - 1;
    const tokenName = tokenNameList[zodiacId];
    const currentContractAddress = contractAddresses[zodiacId];

    const { config } = usePrepareContractWrite({
        address: contractAddresses[zodiacId],
        abi: contractABI,
        functionName: 'airDrop',
        args: args,
        chainId: 420,
        onSuccess(data) {
            console.log('Successful - proof prepare: ', data);
        },
        onError(error) {
            // console.log('Error in verify Proof: ', error);
            window.alert('Error: Try by manually switching network to Optimism Goerli testnet.\nRPC: https://goerli.optimism.io\nChain Id: 420\ncheck console.log if this doesn\'t work either.')
        }
    });

    const contractWrite = useContractWrite(config);

    return (
        <>
        { !(contractWrite.isSuccess) &&
            <>
                <div>Received your proof, you will be airdropped 1000 {tokenName} (on Optimism Goerli) on clicking the button below.</div>
                <div className='button-container'>
                    <button
                        className='glow-on-hover'
                        onClick={ ()=>{ 
                            contractWrite.write?.();
                        }}
                        disabled={contractWrite.isLoading || contractWrite.isSuccess}
                    >
                        Airdrop me!
                    </button>
                    {contractWrite.isLoading && <div className='loading-spinner'/>}
                </div>
            </>
        }

        { contractWrite.isSuccess && 
            <div>
                <div>Transaction Hash: <a href={'https://goerli-optimism.etherscan.io/tx/' + contractWrite.data?.hash}> {contractWrite.data?.hash}</a></div><br/>
                <div>Import {tokenName} from: <a href={'https://goerli-optimism.etherscan.io/address/' + currentContractAddress}> {currentContractAddress} </a></div>
            </div>
        }
        </>
    )
}