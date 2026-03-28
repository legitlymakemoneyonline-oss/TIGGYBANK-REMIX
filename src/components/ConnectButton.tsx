import { useAccount, useConnect, useDisconnect } from "wagmi"
import React from 'react'

export const ConnectButton = () => {
  const { address } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <div className="flex flex-wrap gap-2">
      {address ? (
        <button 
          onClick={() => disconnect()}
          className="bg-red-500/20 text-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-500/30 transition-colors border border-red-500/30"
        >
          Disconnect
        </button>
      ) : (
        connectors.map((connector) => (
          <button 
            key={connector.uid} 
            onClick={() => connect({ connector })}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg"
          >
            Connect {connector.name}
          </button>
        ))
      )}
    </div>
  )
}
