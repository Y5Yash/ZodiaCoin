import { Address } from "viem";
import { useConnect, useDisconnect } from "wagmi";


export const Navbar =({isConnected, connectorName, userAddr}: {isConnected: boolean, connectorName: string, userAddr: Address | undefined} )=>{
    const { connect, connectors, isLoading, pendingConnector } = useConnect({
        chainId: 420,
        onError(error: Error) {
            window.alert(`wagmi useConnect Error: ${error}`);
        }
    });

    const { disconnect } = useDisconnect();

    return(
        <div className="navbar-class">
           <div className="navbar-coins">
            <div><a href="https://astrocoin.onrender.com">Astrocoin</a></div>
            <div><a href="https://zodiacoin.onrender.com">Zodiacoin</a></div>
           </div>
           <div className="navbar-wallet">
            <div>
                {!isConnected &&
                    connectors.map((connector) => (
                        <button
                            disabled={!connector.ready || isConnected}
                            key={connector.id}
                            onClick={() => connect({ connector })}
                        >
                            {connector.name}
                            {!connector.ready && ' (unsupported)'}
                            {isLoading &&
                                connector.id === pendingConnector?.id &&
                                ' (connecting)'}
                        </button>
                    ))
                }

                { isConnected &&
                    <div>Connected to {connectorName} address: {userAddr} <button onClick={() => {disconnect()}}>Disconnect</button></div>
                }
            </div>
           </div>
        </div>
    )
}