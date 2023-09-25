import React, { useState } from 'react';
import './App.css';
import QRCode from 'react-qr-code';
import { Navbar } from './components/navbar.component';
import { AirDrop } from './components/test.component';
import { Proof } from '@reclaimprotocol/reclaim-sdk';
// wagmi
import { useAccount } from 'wagmi';

// Reclaim temp Contract address: 0x7a39200A79d87A8c848e90406cc4708E73aCB3A1
// Temp Reclaim : 0xb5dD33bC69647B690b5E8638dB9b183E0E520d8B
// Witness: 0x244897572368Eadf65bfBc5aec98D8e5443a9072

const App: React.FC = () => {
    const { address, connector, isConnected } = useAccount();
    const [template, setTemplate] = useState('');
    const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);
    const [callbackId, setCallbackId] = useState('');
    const [isTemplateOk, setIsTemplateOk] = useState(true);
    const [isProofReceived, setIsProofReceived] = useState(false);
    const [isFetchedMsgClicked, setIsFetchMsgClicked] = useState(false);
    const [isFetchingProof, setIsFetchingProof] = useState(false);
    const [proofObj, setProofObj] = useState<Proof>();


    const backendBase = 'https://zodiacoin-backend.onrender.com';
    const backendTemplateUrl = `${backendBase}/request-proofs`;
    const backendProofUrl = `${backendBase}/get-proofs`;


    const handleGetTemplate = async () => {
      setIsFetchingTemplate(true);
      try {
        console.log(`Requesting ${backendTemplateUrl}?addr=${address}`);
        const response = await fetch(`${backendTemplateUrl}?addr=${address}`);
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
          // console.log(proofData[0]);
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
      <Navbar isConnected={isConnected} connectorName={connector?.name || ''} userAddr={address}/>
      <div className='center-body'>
        <div className='leftside-container'>
          <div className='leftside'>
            <h1>ZodiaCoin</h1>
            <h2>Get your zodiac's token airdropped today!</h2>
            <br/>

            {!isConnected &&
              <div>Connect to a wallet from the navbar</div>
            }

            {isConnected && !template &&
              <div className='button-container'>
                {<button onClick={handleGetTemplate} disabled={isFetchingTemplate}>Get the proof link/QR</button>}
                {isFetchingTemplate && <div className='loading-spinner'/>}
              </div>
            }

            { isConnected && template && isTemplateOk && !isProofReceived &&
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

            { isConnected && template && !isTemplateOk && !isProofReceived && 
              // Error message if the template is not received.
              <div>{template}</div>
            }

            { isConnected && isProofReceived &&
              // initiate transaction if proof is received. Display txHash or error if successful.
              <AirDrop proofObj={proofObj!}/>
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
  )
}

export default App;