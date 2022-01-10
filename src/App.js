import React, { useState, useEffect } from 'react'

import { overrideThemeVariables, Button, Card, ProgressCircular, CardContent, Alert, TextArea, Divider } from 'ui-neumorphism'
import { Box, Grid, Typography, Modal } from '@mui/material';
import 'ui-neumorphism/dist/index.css'

import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

import { Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const Profile = ({provider, loading, airDropHelper, walletConnectionHelper}) => {
 
    return (
        <Card dark style={{ padding: 12, margin: 12, marginBottom: 32 }} inset>
            <Box>
                <strong>hi, you are connected with wallet - </strong>

                <Typography sx={{ marginTop: 1, wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {provider.publicKey.toString()}
                </Typography>

                <Box sx={{ margin: '12px 0px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>

                    <Button rounded dark disabled={loading} onClick={airDropHelper} style={{ marginTop: 12 }}>AirDrop 1 SOL </Button>

                    <Button rounded dark onClick={walletConnectionHelper} disabled={loading} style={{ marginTop: 12 }}>
                        disconnect wallet
                    </Button>
                </Box>


            </Box>
        </Card>
    )
}

const App = () => {

    const TOKEN_DETAILS = {
        publicKey: 'HL7nuJxpKj5crCkLQ8pcxmGLkvBYaynQ1jkW5Tv2C1hV',
        secretKey: '{"0":167,"1":40,"2":241,"3":32,"4":136,"5":226,"6":76,"7":21,"8":125,"9":72,"10":231,"11":238,"12":18,"13":248,"14":93,"15":193,"16":254,"17":188,"18":91,"19":180,"20":242,"21":227,"22":104,"23":105,"24":237,"25":108,"26":6,"27":189,"28":146,"29":92,"30":141,"31":61,"32":66,"33":218,"34":201,"35":39,"36":154,"37":93,"38":157,"39":160,"40":162,"41":125,"42":227,"43":151,"44":173,"45":191,"46":95,"47":244,"48":155,"49":239,"50":243,"51":52,"52":60,"53":91,"54":104,"55":75,"56":7,"57":6,"58":3,"59":158,"60":116,"61":58,"62":231,"63":104}'
    };

    const loadFromTokenDetails = true;

    useEffect(() => {
        // takes an object of css variable key-value pairs
        overrideThemeVariables({
            '--light-bg': '#E4EBF5',
            '--light-bg-dark-shadow': '#bec8e4',
            '--light-bg-light-shadow': '#ffffff',
            '--dark-bg': '#292E35',
            '--dark-bg-dark-shadow': '#21252a',
            '--dark-bg-light-shadow': '#313740',
            '--primary': '#2979ff',
            '--primary-dark': '#2962ff',
            '--primary-light': '#82b1ff',
        })
    }, []);

    const [walletConnected, setWalletConnected] = useState(false);
    const [provider, setProvider] = useState();
    const [loading, setLoading] = useState();

    const [isTokenCreated, setIsTokenCreated] = useState(false);
    const [createdTokenPublicKey, setCreatedTokenPublicKey] = useState(null)
    const [mintingWalletSecretKey, setMintingWalletSecretKey] = useState(null)

    const [supplyCapped, setSupplyCapped] = useState(false);

    const [alert, setAlert] = useState();
    const [alertType, setAlertType] = useState();

    const [showTransferModal, setShowTransferModal] = useState();
    const [receiverWalletAddress, setReceiverWalletAddress] = useState();

    const getProvider = async () => {
        if ("solana" in window) {
            const provider = window.solana;
            if (provider.isPhantom) {
                return provider;
            }
        } else {
            window.open("https://www.phantom.app/", "_blank");
        }
    };

    const walletConnectionHelper = async (recursion = 1) => {

        if (walletConnected) {
            //Disconnect Wallet

            setProvider()
            setWalletConnected(false)
            setLoading(false);

        } else {
            const userWallet = await getProvider();

            await userWallet.connect();
            console.log('await over');

            userWallet.on("connect", async () => {

                console.log('connected');
                setLoading(false);
                setProvider(userWallet);
                setWalletConnected(true);

                if (loadFromTokenDetails) {
                    await loadTokenFromPublicKey();
                }

            })

            if (recursion) {
                setTimeout(() => {
                    walletConnectionHelper(0);
                }, 100)
            }
        }
    }

    const loadTokenFromPublicKey = async () => {

        setCreatedTokenPublicKey(new PublicKey(TOKEN_DETAILS.publicKey));
        setMintingWalletSecretKey(TOKEN_DETAILS.secretKey)

    }

    const airDropHelper = async () => {
        try {
            setLoading(true);
            const connection = new Connection(
                clusterApiUrl("devnet"),
                "confirmed"
            );
            var fromAirDropSignature = await connection.requestAirdrop(new PublicKey(provider.publicKey), LAMPORTS_PER_SOL);
            await connection.confirmTransaction(fromAirDropSignature, { commitment: "confirmed" })
            console.log(`1 SOL airdropped to your wallet ${provider.publicKey.toString()} successfully`)

            setAlert(`1 SOL airdropped to your wallet ${provider.publicKey.toString()} successfully`);
            setAlertType('success')

            setLoading(false);
        } catch (err) {

            console.log(err);
            setLoading(false);
            setAlert(err)
            setAlertType('error')
        }
    }

    
    const initialMintHelper = async () => {
        try {
            setLoading(true);
            const connection = new Connection(
                clusterApiUrl("devnet"),
                "confirmed"
            );
            const mintRequester = await provider.publicKey;

            //create new wallet
            const mintingFromWallet = await Keypair.generate();
            setMintingWalletSecretKey(JSON.stringify(mintingFromWallet.secretKey));

            console.log('minting secret key (store this if you want to load the same token on app reload)', JSON.stringify(mintingFromWallet.secretKey));

            //airdrop to new wallet
            var fromAirDropSignature = await connection.requestAirdrop(mintingFromWallet.publicKey, LAMPORTS_PER_SOL);
            await connection.confirmTransaction(fromAirDropSignature, { commitment: "confirmed" })

            //create mint object
            const creatorToken = await Token.createMint(connection, mintingFromWallet, mintingFromWallet.publicKey, null, 6, TOKEN_PROGRAM_ID);

            //initializing our wallet’s creator token account
            const fromTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(mintingFromWallet.publicKey);

            //mint
            await creatorToken.mintTo(fromTokenAccount.address, mintingFromWallet.publicKey, [], 1000000)

            const toTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(mintRequester);

            //transfer from minting wallet to connected wallet
            const transaction = new Transaction().add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    mintingFromWallet.publicKey,
                    [],
                    1000000
                )
            )
            const signature = await sendAndConfirmTransaction(connection, transaction, [mintingFromWallet], { commitment: "confirmed" })

            console.log("SIGNATURE:", signature);

            setCreatedTokenPublicKey(creatorToken.publicKey);
            setIsTokenCreated(true);

            setAlert(`token created successfully! ${creatorToken.publicKey.toString()}`);
            setAlertType('success')

            setLoading(false);

        } catch (err) {
            console.log(err)
            setLoading(false);

            setAlert(err)
            setAlertType('error')
        }
    }

    const mintAgainHelper = async () => {
        try {
            setLoading(true);
            const connection = new Connection(
                clusterApiUrl("devnet"),
                "confirmed"
            );
            const createMintingWallet = await Keypair.fromSecretKey(Uint8Array.from(Object.values(JSON.parse(mintingWalletSecretKey))));
            const mintRequester = await provider.publicKey;

            var fromAirDropSignature = await connection.requestAirdrop(createMintingWallet.publicKey, LAMPORTS_PER_SOL);
            await connection.confirmTransaction(fromAirDropSignature, { commitment: "confirmed" })

            const creatorToken = new Token(connection, createdTokenPublicKey, TOKEN_PROGRAM_ID, createMintingWallet)

            const fromTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(createMintingWallet.publicKey);
            const toTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(mintRequester);
            await creatorToken.mintTo(fromTokenAccount.address, createMintingWallet.publicKey, [], 100000000);
            const transaction = new Transaction().add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    createMintingWallet.publicKey,
                    [],
                    100000000
                )
            )
            await sendAndConfirmTransaction(connection, transaction, [createMintingWallet], { commitment: "confirmed" })
            setLoading(false);
        } catch (err) {

            console.log(err);
            setLoading(false);

            setAlert(err)
            setAlertType('error')
        }
    }

    const transferTokenHelper = async () => {
        try {

            setShowTransferModal(false);

            setLoading(true);

            const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

            const createMintingWallet = await Keypair.fromSecretKey(Uint8Array.from(Object.values(JSON.parse(mintingWalletSecretKey))));
            const receiverWallet = new PublicKey(receiverWalletAddress)

            var fromAirDropSignature = await connection.requestAirdrop(createMintingWallet.publicKey, LAMPORTS_PER_SOL);
            await connection.confirmTransaction(fromAirDropSignature, { commitment: "confirmed" })

            console.log('1 SOL airdropped to the wallet for free')

            const creatorToken = new Token(connection, createdTokenPublicKey, TOKEN_PROGRAM_ID, createMintingWallet)
            const fromTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(provider.publicKey);
            const toTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(receiverWallet);
            const transaction = new Transaction().add(Token.createTransferInstruction(TOKEN_PROGRAM_ID, fromTokenAccount.address, toTokenAccount.address, provider.publicKey, [], 10000000));

            transaction.feePayer = provider.publicKey;

            let blockhashObj = await connection.getRecentBlockhash();

            console.log("blockhashObj", blockhashObj);

            transaction.recentBlockhash = await blockhashObj.blockhash;

            if (transaction) {
                console.log("Txn created successfully");
            }

            let signed = await provider.signTransaction(transaction);
            let signature = await connection.sendRawTransaction(signed.serialize());
            await connection.confirmTransaction(signature);
            console.log("SIGNATURE: ", signature);

            setAlert(`txn successful: ${signature}`)
            setAlertType('success')

            setLoading(false);
        } catch (err) {

            console.log(err)

            setLoading(false);

            setAlert(err)
            setAlertType('error')
        }
    }

    const handleReceiverWalletAddressChange = (e) => {
        setReceiverWalletAddress(e.value);
    }

    return (
        <div style={{ backgroundColor: '#292E35', position: 'fixed', width: '100%', height: '100%', backgroundImage: 'linear-gradient(233deg, #ef7676, #4e95b1)' }}>
            <Box sx={{ justifyContent: 'flex-start' }}>


                {/* {loading && <ProgressCircular dark indeterminate color='var(--primary)' />} */}

                <Grid container justifyContent="center">
                    <Grid item xs={12} sm={12} md={6}>
                        <Box sx={{ justifyContent: 'center', padding: 4 }}>

                            <Card style={{ opacity: 0.6 }}>
                                <h3 style={{ padding: '18px 24px', textAlign: 'center' }}>create token on solana 🚀</h3>
                            </Card>

                            <Card dark elevation={1} loading={loading} style={{ padding: 8, marginTop: 24, opacity: 0.95 }}>

                                {
                                    alert &&
                                    <Alert inset type={alertType} closable onClose={() => { setAlert() }}>
                                        <Box sx={{ wordBreak: 'break-word' }}>
                                            {alert.toString()}
                                        </Box>

                                    </Alert>
                                }

                                {
                                    walletConnected ? (
                                        <Profile provider={provider} loading={loading} airDropHelper={airDropHelper} walletConnectionHelper={walletConnectionHelper}></Profile>
                                    ) : <Box></Box>
                                }
                                {
                                    walletConnected && !createdTokenPublicKey ? (
                                        <Card style={{ padding: 12, margin: 12 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography>let's mint your new token</Typography>
                                                </Box>


                                                <Box sx={{ margin: '12px 0px' }}>
                                                    <Button rounded dark disabled={loading}
                                                        onClick={initialMintHelper}>
                                                        mint
                                                    </Button>
                                                </Box>
                                            </Box>


                                        </Card>)
                                        :
                                        <></>
                                }

                                {
                                    mintingWalletSecretKey && createdTokenPublicKey && walletConnected ? (
                                        <Card style={{ padding: '18px 12px', margin: 12 }}>
                                            <Box>
                                                your new token
                                                <Card dark style={{ marginTop: 5, padding: 12, backgroundColor: 'black' }} elevation={2}>
                                                    {/* <Divider dense style={{ margin: '8px 0px' }}></Divider> */}
                                                    <Typography sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
                                                        {createdTokenPublicKey.toString()}
                                                    </Typography>
                                                </Card>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: '24px 0px 12px 0px' }}>
                                                <Button rounded dark disabled={loading || supplyCapped} onClick={mintAgainHelper}>mint more</Button>
                                                <Button rounded dark disabled={loading || supplyCapped} onClick={() => { setShowTransferModal(true) }}>transfer</Button>
                                            </Box>
                                        </Card>
                                    ) : <></>
                                }

                                {
                                    !walletConnected &&
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0px' }}>
                                        <Button rounded dark onClick={walletConnectionHelper} disabled={loading} size="large" style={{ width: '80%' }}>
                                            connect wallet
                                        </Button>
                                    </Box>
                                }



                            </Card>
                        </Box>
                    </Grid>
                </Grid>

            </Box>

            <Modal
                open={showTransferModal}
                onClose={() => { setShowTransferModal(false) }}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 320,
                }}>

                    <Card style={{ padding: 12 }}>

                        <Typography title sx={{ marginLeft: 1 }}>
                            receiver address
                        </Typography>

                        <TextArea
                            width={270} height={140} autoExpand={true}
                            uncontrolled
                            onChange={handleReceiverWalletAddressChange}
                            value={receiverWalletAddress}
                        >

                        </TextArea>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', margin: '12px 12px' }}>
                            <Button rounded onClick={transferTokenHelper} disabled={loading || !receiverWalletAddress} size="large" style={{ width: '50%' }}>
                                send
                            </Button>
                        </Box>

                    </Card>


                </Box>
            </Modal>
        </div>
    )
};

export default App;