import { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import abi from "./contracts/MemeCoin.json";

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [inputValue, setInputValue] = useState({
    walletAddress: "",
    transferAmount: "",
    burnAmount: "",
    mintAmount: "",
  });
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenTotalSupply, setTokenTotalSupply] = useState(0);
  const [isTokenOwner, setIsTokenOwner] = useState(false);
  const [tokenOwnerAddress, setTokenOwnerAddress] = useState(null);
  const [yourWalletAddress, setYourWalletAddress] = useState(null);
  const [error, setError] = useState(null);

  const contractAddress = "0x6Dc375553522AF764FBA0483C7b1BB91050DE654";
  const contractABI = abi.abi;

  async function checkValidNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x61",
                chainName: "Smart Chain - Testnet",
                nativeCurrency: {
                  name: "BNB",
                  symbol: "BNB", // 2-6 characters long
                  decimals: 18,
                },
                rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
                blockExplorerUrls: ["https://testnet.bscscan.com"],
              },
            ],
          });
        } catch (addError) {
          // handle "add" error
        }
      }
      // handle other "switch" errors
      else {
        alert("Network Switch Denied");
      }
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        setIsWalletConnected(true);
        setYourWalletAddress(accounts[0]);

        window.ethereum.on("accountsChanged", (accounts) => {
          setYourWalletAddress(accounts[0]);
          getTokenInfo();
        });

        window.ethereum.on("chainChanged", (chainId) => {
          if (chainId != "0x61") {
            alert("Please connect to BSC");
          }

          console.log(chainId);
        });
      } else {
        setError("Install a MetaMask wallet to get our token.");
        console.log("No Metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getTokenInfo = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(signer);
        const [account] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const token = new ethers.Contract(contractAddress, contractABI, signer);

        let tokenName = await token.name();
        let tokenSymbol = await token.symbol();
        let totalSupply = await token.totalSupply();
        let tokenOwner = await token.owner();
        totalSupply = utils.formatEther(totalSupply);

        setTokenName(tokenName);
        setTokenOwnerAddress(tokenOwner);
        setTokenTotalSupply(totalSupply);
        setTokenSymbol(tokenSymbol);

        if (account.toLowerCase() === tokenOwner.toLowerCase()) {
          console.log("is token owner");
          setIsTokenOwner(true);
        } else {
          setIsTokenOwner(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const transferToken = async (event) => {
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const tokenContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const txn = await tokenContract.transfer(
          inputValue.walletAddress,
          utils.parseEther(inputValue.transferAmount)
        );

        await txn.wait();
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Install a MetaMask wallet to get our token.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const burnTokens = async (event) => {
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const tokenContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const txn = await tokenContract.burn(
          utils.parseEther(inputValue.burnAmount)
        );

        await txn.wait();

        let totalSupply = await tokenContract.totalSupply();
        totalSupply = utils.formatEther(totalSupply);
        setTokenTotalSupply(totalSupply);
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Install a MetaMask wallet to get our token.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const mintTokens = async (event) => {
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const tokenContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let tokenOwner = await tokenContract.owner();

        console.log("mintAmount: ", utils.parseEther(inputValue.mintAmount));
        const txn = await tokenContract.mint(
          tokenOwner,
          utils.parseEther(inputValue.mintAmount)
        );

        await txn.wait();

        let totalSupply = await tokenContract.totalSupply();
        totalSupply = utils.formatEther(totalSupply);
        setTokenTotalSupply(totalSupply);
      } else {
        console.log("Ethereum object not found, install Metamask.");
        setError("Install a MetaMask wallet to get our token.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (event) => {
    setInputValue((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkValidNetwork();
    getTokenInfo();
  }, []);

  return (
    <main className="main-container">
      <h2 className="headline">
        <span className="headline-gradient">Meme Coin Project</span>
        <img
          className="inline p-3 ml-2"
          src="https://i.imgur.com/5JfHKHU.png"
          alt="Meme Coin"
          width="60"
          height="30"
        />
      </h2>
      <section className="customer-section px-10 pt-5 pb-10">
        {error && <p className="text-2xl text-red-700">{error}</p>}
        <div className="mt-5">
          <span className="mr-5">
            <strong>Coin:</strong> {tokenName}{" "}
          </span>
          <span className="mr-5">
            <strong>Ticker:</strong> {tokenSymbol}{" "}
          </span>
          <span className="mr-5">
            <strong>Total Supply:</strong> {tokenTotalSupply}
          </span>
        </div>
        <div className="mt-7 mb-9">
          <form className="form-style">
            <input
              type="text"
              className="input-double"
              onChange={handleInputChange}
              name="walletAddress"
              placeholder="Wallet Address"
              value={inputValue.walletAddress}
            />
            <input
              type="text"
              className="input-double"
              onChange={handleInputChange}
              name="transferAmount"
              placeholder={`0.0000 ${tokenSymbol}`}
              value={inputValue.transferAmount}
            />
            <button className="btn-purple" onClick={transferToken}>
              Transfer Tokens
            </button>
          </form>
        </div>
        {isTokenOwner && (
          <section>
            <div className="mt-10 mb-10">
              <form className="form-style">
                <input
                  type="text"
                  className="input-style"
                  onChange={handleInputChange}
                  name="burnAmount"
                  placeholder={`0.0000 ${tokenSymbol}`}
                  value={inputValue.burnAmount}
                />
                <button className="btn-purple" onClick={burnTokens}>
                  Burn Tokens
                </button>
              </form>
            </div>
            <div className="mt-10 mb-10">
              <form className="form-style">
                <input
                  type="text"
                  className="input-style"
                  onChange={handleInputChange}
                  name="mintAmount"
                  placeholder={`0.0000 ${tokenSymbol}`}
                  value={inputValue.mintAmount}
                />
                <button className="btn-purple" onClick={mintTokens}>
                  Mint Tokens
                </button>
              </form>
            </div>
          </section>
        )}
        <div className="mt-5">
          <p>
            <span className="font-bold">Contract Address: </span>
            {contractAddress}
          </p>
        </div>
        <div className="mt-5">
          <p>
            <span className="font-bold">Token Owner Address: </span>
            {tokenOwnerAddress}
          </p>
        </div>
        <div className="mt-5">
          {isWalletConnected && (
            <p>
              <span className="font-bold">Your Wallet Address: </span>
              {yourWalletAddress}
            </p>
          )}
          <button className="btn-connect" onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Connected ????" : "Connect Wallet ????"}
          </button>
        </div>
      </section>
    </main>
  );
}
export default App;
