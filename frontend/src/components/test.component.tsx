import { useState } from "react";
import { Proof } from '@reclaimprotocol/reclaim-sdk'
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from "ethers";
import contractABI from '../assets/ZodiaCoin.json';

export function AirDrop({proofObj}: {proofObj: Proof}) {
    const [isAirdropped, setIsAirdropped] = useState(false);
    const [tokenName, setTokenName] = useState('');
    const [currentContractAddress, setCurrentContractAddress] = useState('');

    console.log("param:")
    const param = JSON.parse(proofObj?.parameters as string);
    const dobList = param.dob.split('-');
    const year = Number(dobList[0]);
    const month = Number(dobList[1]);
    const day = Number(dobList[2]);
    console.log(dobList);

    const cD = {
        identifier: proofObj.identifier,
        owner: ethers.computeAddress(`0x${proofObj.ownerPublicKey}`),
        epoch: proofObj.epoch,
        timestampS: Number(proofObj.timestampS)
    }
    const signatures= proofObj.signatures;

    const contextObj = JSON.parse(proofObj.context);
    console.log("The context Obj is: ", contextObj);

    const { config } = usePrepareContractWrite({
        address: '0x576B483F1704c64d39D2c77ce586F857e4b17C20',
        abi: contractABI,
        functionName: 'airDrop',
        args: [proofObj.epoch, day, month, year, "uidai-dob", contextObj.contextAddress, contextObj.sessionId, cD, signatures],
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
        { !isAirdropped && !contractWrite.isSuccess &&
            <div className='button-container'>
                <button
                    onClick={()=>{ contractWrite.write?.() }}
                    disabled={contractWrite.isLoading || contractWrite.isSuccess}
                >
                    Airdrop me!
                </button>
                {contractWrite.isLoading && <div className='loading-spinner'/>}
            </div>
        }

        { (isAirdropped || contractWrite.isSuccess )&&
            <div>
                <div>Transaction Hash: {contractWrite.data?.hash}</div><br/>
                <div>Import {tokenName} from: {currentContractAddress}</div>
            </div>
        }
        </>
    )
}

// Witness address: 0x244897572368Eadf65bfBc5aec98D8e5443a9072
// Reclaim address: 0xF93F605142Fb1Efad7Aa58253dDffF67775b4520
