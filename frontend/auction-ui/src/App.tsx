import React, { useState, useCallback, useEffect } from "react";
import { type Observable } from "rxjs";
import { useDeployedAuctionContext } from "./hooks/useDeployedAuctionContext";
import { type AuctionDeployment } from "./contexts/BrowserDeployedAuctionManager";
import {
  type DeployedAuctionAPI,
  type AuctionDerivedState,
  computeCommitment,
  auctionPrivateStateKey,
} from "../../../api/src/index.js";
import { getBidderIdentity } from "./lib/identity.js";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  Stack,
  AppBar,
  Toolbar,
  Container,
  Alert,
  LinearProgress,
  Divider,
  Paper,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShieldIcon from "@mui/icons-material/Shield";
import KeyIcon from "@mui/icons-material/Key";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7c4dff" },
    secondary: { main: "#00e5ff" },
    background: { default: "#0a0e1a", paper: "#131929" },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  shape: { borderRadius: 16 },
});

type WalletStatus = "disconnected" | "connecting" | "connected";

interface LocalBid {
  amount: bigint;
  salt: Uint8Array;
  commitmentHashHex: string;
  revealed?: boolean;
}

const App: React.FC = () => {
  const apiProvider = useDeployedAuctionContext();
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
  const [walletStatus, setWalletStatus] =
    useState<WalletStatus>("disconnected");

  const [_walletAddress, setWalletAddress] = useState<string | undefined>(
    undefined,
  );
  const [auctionApi, setAuctionApi] = useState<DeployedAuctionAPI | null>(null);
  const [localAllowlistRoot, setLocalAllowlistRoot] = useState<string>("none");
  const [onChainAllowlistRoot, setOnChainAllowlistRoot] =
    useState<string>("none");

  useEffect(() => {
    if (contractAddress) {
      const root = getBidderIdentity(contractAddress).merkleRoot;
      setLocalAllowlistRoot(
        Array.from(root)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      );
    }
  }, [contractAddress]);

  useEffect(() => {
    if (apiProvider?.walletAddress$) {
      const sub = apiProvider.walletAddress$.subscribe((address) => {
        setWalletAddress(address);
      });
      return () => sub.unsubscribe();
    }
  }, [apiProvider]);

  const [deployment$, setDeployment$] =
    useState<Observable<AuctionDeployment> | null>(null);

  useEffect(() => {
    if (deployment$) {
      const sub = deployment$.subscribe((deployment) => {
        console.log("[auction-ui] deployment status:", deployment.status);
        if (deployment.status === "deployed") {
          console.log("[auction-ui] AuctionAPI resolved successfully!");
          setAuctionApi(deployment.api);
          setWalletStatus("connected");
          setStatusSeverity("success");
          setStatusMessage("Wallet connected and auction contract synced!");
        } else if (deployment.status === "failed") {
          console.error("[auction-ui] deployment failed:", deployment.error);
          setAuctionApi(null);
          setWalletStatus("disconnected");
          setStatusMessage(`Connection failed: ${deployment.error.message}`);
          setStatusSeverity("error");
        }
        // "in-progress" is silently ignored
      });
      return () => sub.unsubscribe();
    }
  }, [deployment$]);

  useEffect(() => {
    if (auctionApi) {
      const sub = auctionApi.state$.subscribe((state: AuctionDerivedState) => {
        // Map 0 -> Commit, 1 -> Reveal, 2 -> Ended
        const phaseStr =
          Number(state.state) === 0
            ? "Commit"
            : Number(state.state) === 1
              ? "Reveal"
              : "Ended";
        setAuctionPhase(phaseStr);
        setHighestBid(state.highestBidAmount);
        setHighestCommitment(
          Array.from(state.highestBidCommitment)
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join(""),
        );
        setCommitmentsCount(Number(state.commitmentCount));
        setOnChainAllowlistRoot(
          Array.from(state.allowlistMerkleRoot)
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join(""),
        );
        if (Number(state.state) === 2) {
          setWinningAmount(state.winningAmount);
        }
      });
      return () => sub.unsubscribe();
    }
  }, [auctionApi]);
  const [bidInput, setBidInput] = useState("10");
  const [auctionPhase, setAuctionPhase] = useState<
    "Commit" | "Reveal" | "Ended"
  >("Commit");
  const [highestBid, setHighestBid] = useState<bigint>(0n);
  const [highestCommitment, setHighestCommitment] = useState<string>("none");
  const [commitmentsCount, setCommitmentsCount] = useState<number>(0);
  const [myBid, setMyBid] = useState<LocalBid | null>(null);

  const [_revealedBidsCount, _setRevealedBidsCount] = useState<number>(0);
  const [winningAmount, setWinningAmount] = useState<bigint>(0n);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Welcome to the Sealed-Bid Auction! In Commit phase, bids are sealed. Switch to Reveal phase to unseal bids and update the highest bid!",
  );
  const [statusSeverity, setStatusSeverity] = useState<
    "info" | "success" | "warning" | "error"
  >("info");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const connectWallet = useCallback(() => {
    setWalletStatus("connecting");
    setStatusSeverity("info");
    setStatusMessage("Looking for Midnight Lace extension...");
    if (apiProvider) {
      setDeployment$(apiProvider.resolve(contractAddress));
    }
  }, [contractAddress, apiProvider]);

  const disconnectWallet = useCallback(() => {
    setWalletStatus("disconnected");
    setStatusSeverity("info");
    setStatusMessage("Wallet disconnected");
  }, []);

  const handleSyncAllowlist = useCallback(async () => {
    if (!auctionApi) return;
    try {
      setStatusMessage(
        "Submitting sync allowlist transaction to Lace wallet...",
      );
      setStatusSeverity("info");
      const rootBytes = getBidderIdentity(contractAddress).merkleRoot;
      await auctionApi.updateAllowlistRoot(rootBytes);
      setStatusSeverity("success");
      setStatusMessage(
        "✅ Allowlist Merkle Root synced successfully! You are now authorized to bid.",
      );
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(e);
      setStatusSeverity("error");
      setStatusMessage(`Failed to sync allowlist: ${err.message}`);
    }
  }, [auctionApi, contractAddress]);

  // 1. Commit Bid Action
  const handleCommitBid = useCallback(async () => {
    if (isSubmitting) return;
    if (!auctionApi || !apiProvider) {
      setStatusSeverity("error");
      setStatusMessage("Wallet not connected or auction API not resolved!");
      return;
    }
    // We remove the local auctionPhase check because the contract will enforce it,
    // but it's good for UX to still check. We will rely on contract derived state later if needed.

    const val = parseInt(bidInput, 10);
    if (isNaN(val) || val <= 0) {
      setStatusSeverity("error");
      setStatusMessage("Please enter a valid positive bid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = BigInt(val);
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const saltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 1. Compute commitment hash using pure circuit
      const commitmentHashBytes = computeCommitment(salt, amount);
      const commitmentHashHex = Array.from(commitmentHashBytes)
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("");

      // 2. Update private state locally
      const psProvider = await apiProvider.getPrivateStateProvider();
      const ps = await psProvider.get(auctionPrivateStateKey);
      if (ps) {
        await psProvider.set(auctionPrivateStateKey, {
          ...ps,
          bidAmount: amount,
          bidSalt: salt,
        });
      } else {
        throw new Error("Local private state not found");
      }

      const newBid: LocalBid = { amount, salt, commitmentHashHex };
      setMyBid(newBid);

      localStorage.setItem("auction_bid_amount", amount.toString());
      localStorage.setItem("auction_bid_salt", saltHex);

      // 3. Call the real circuit
      setStatusMessage("Submitting transaction to Lace wallet...");
      setStatusSeverity("info");
      await auctionApi.commitBid(commitmentHashBytes);

      setStatusSeverity("success");
      setStatusMessage(
        `🔒 Sealed bid of ${val} tNIGHT committed! Amount & salt stay on your local device. Only commitment hash 0x${commitmentHashHex.slice(0, 12)}... recorded on-chain. Note: Highest bid stays 0 until Reveal phase!`,
      );
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      setStatusSeverity("error");
      setStatusMessage(`Failed to commit bid: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [bidInput, auctionApi, apiProvider, isSubmitting]);

  // 2. Advance Phase Action
  const handleAdvanceToReveal = useCallback(async () => {
    if (isSubmitting) return;
    if (!auctionApi) return;
    setIsSubmitting(true);
    try {
      setStatusMessage("Submitting transaction to Lace wallet...");
      setStatusSeverity("info");
      await auctionApi.advanceToReveal();
      setStatusSeverity("warning");
      setStatusMessage(
        "🔓 Auction advanced to REVEAL phase! Bidders can now reveal their sealed bids to evaluate the leading bid on-chain.",
      );
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      setStatusSeverity("error");
      setStatusMessage(`Failed to advance phase: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [auctionApi, isSubmitting]);

  // 3. Reveal Bid Action
  const handleRevealBid = useCallback(async () => {
    if (isSubmitting) return;
    if (!auctionApi) return;
    setIsSubmitting(true);
    try {
      setStatusMessage("Submitting reveal transaction to Lace wallet...");
      setStatusSeverity("info");
      await auctionApi.revealBid();
      setStatusSeverity("success");
      setStatusMessage("👁️ Bid successfully revealed on-chain!");
      _setRevealedBidsCount((prev) => prev + 1);
      setMyBid((prev) => (prev ? { ...prev, revealed: true } : prev));
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      setStatusSeverity("error");
      setStatusMessage(`Failed to reveal bid: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [auctionApi, isSubmitting]);

  const handleEndAuction = useCallback(async () => {
    if (isSubmitting) return;
    if (!auctionApi) return;
    setIsSubmitting(true);
    try {
      setStatusMessage(
        "Submitting close auction transaction to Lace wallet...",
      );
      setStatusSeverity("info");
      await auctionApi.closeAuction();
      setStatusSeverity("success");
      setStatusMessage(
        `🏆 Auction ENDED! Final Winner Amount is verified on-chain. All losing bids were kept completely private!`,
      );
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      setStatusSeverity("error");
      setStatusMessage(`Failed to close auction: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [auctionApi, isSubmitting]);

  const isWalletActive = walletStatus === "connected";
  const phaseColor =
    auctionPhase === "Commit"
      ? "#7c4dff"
      : auctionPhase === "Reveal"
        ? "#ff9100"
        : "#00e676";
  const PhaseIcon =
    auctionPhase === "Commit"
      ? LockIcon
      : auctionPhase === "Reveal"
        ? VisibilityIcon
        : CheckCircleIcon;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)",
        }}
      >
        {/* Navigation Bar */}
        <AppBar
          position="static"
          sx={{
            background: "rgba(19, 25, 41, 0.8)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Toolbar>
            <GavelIcon sx={{ mr: 2, color: "#7c4dff" }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Sealed-Bid Auction — Midnight Network
            </Typography>
            <Chip
              label={
                import.meta.env.VITE_NETWORK_ID?.toUpperCase() ?? "PREVIEW"
              }
              size="small"
              sx={{
                mr: 2,
                bgcolor: "#7c4dff33",
                color: "#7c4dff",
                fontWeight: 600,
              }}
            />
            <Button
              variant={isWalletActive ? "outlined" : "contained"}
              color={isWalletActive ? "secondary" : "primary"}
              onClick={isWalletActive ? disconnectWallet : connectWallet}
              disabled={walletStatus === "connecting"}
              sx={{ borderRadius: 3, textTransform: "none", fontWeight: 600 }}
            >
              {walletStatus === "connecting"
                ? "Connecting..."
                : isWalletActive
                  ? "Disconnect Lace"
                  : "Connect Lace"}
            </Button>
          </Toolbar>
        </AppBar>

        {walletStatus === "connecting" && <LinearProgress color="primary" />}

        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Status Message Alert */}
          {statusMessage && (
            <Alert
              severity={statusSeverity}
              sx={{ mb: 3, borderRadius: 3 }}
              onClose={() => setStatusMessage("")}
            >
              {statusMessage}
            </Alert>
          )}

          {/* Main Auction Card */}
          <Card
            sx={{
              mb: 3,
              background: "rgba(19, 25, 41, 0.6)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${phaseColor}44`,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <PhaseIcon sx={{ color: phaseColor, fontSize: 36 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Rare Midnight NFT #001
                    </Typography>
                    <Chip
                      label={`Phase: ${auctionPhase}`}
                      sx={{
                        mt: 0.5,
                        bgcolor: `${phaseColor}22`,
                        color: phaseColor,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
                {/* Admin Phase Switch Controls */}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={
                      auctionPhase === "Commit" ? "contained" : "outlined"
                    }
                    onClick={() => setAuctionPhase("Commit")}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                    disabled={isSubmitting}
                  >
                    1. Commit
                  </Button>
                  <Button
                    size="small"
                    variant={
                      auctionPhase === "Reveal" ? "contained" : "outlined"
                    }
                    onClick={handleAdvanceToReveal}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                    disabled={isSubmitting}
                  >
                    2. Reveal
                  </Button>
                  <Button
                    size="small"
                    variant={
                      auctionPhase === "Ended" ? "contained" : "outlined"
                    }
                    onClick={handleEndAuction}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                    disabled={isSubmitting}
                  >
                    3. End
                  </Button>
                </Stack>
              </Box>

              {/* Sync Allowlist Warning */}
              {isWalletActive &&
                onChainAllowlistRoot !== "none" &&
                localAllowlistRoot !== "none" &&
                onChainAllowlistRoot !== localAllowlistRoot && (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2, borderRadius: 2 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        variant="outlined"
                        onClick={handleSyncAllowlist}
                      >
                        Sync Allowlist
                      </Button>
                    }
                  >
                    Your local identity is not on the authorized allowlist.
                    Click Sync Allowlist to add yourself.
                  </Alert>
                )}

              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={4}
                sx={{ justifyContent: "space-between" }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    On-Chain Highest Bid
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, color: "#00e5ff" }}
                  >
                    {highestBid.toString()}{" "}
                    <Typography
                      component="span"
                      variant="body1"
                      color="text.secondary"
                    >
                      tNIGHT
                    </Typography>
                  </Typography>
                  {highestCommitment !== "none" && (
                    <Typography variant="caption" color="text.secondary">
                      Leading Commitment: 0x{highestCommitment}...
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sealed Commitments Count
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "#7c4dff" }}
                  >
                    {commitmentsCount}{" "}
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      bids committed
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bids Revealed (this session): {_revealedBidsCount}
                  </Typography>
                </Box>

                <Box sx={{ maxWidth: 280 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <ShieldIcon sx={{ fontSize: 16, color: "#00e676" }} />{" "}
                    Zero-Knowledge Privacy
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#00e676", mt: 0.5, fontSize: "0.85rem" }}
                  >
                    🔒 Only the running max ever hits the ledger during Reveal.
                    Losing bids are never disclosed or recorded anywhere
                    on-chain.
                  </Typography>
                </Box>
              </Stack>

              {/* Local User Bid Status Badge */}
              {myBid && (
                <Paper
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "rgba(124, 77, 255, 0.1)",
                    border: "1px dashed rgba(124, 77, 255, 0.4)",
                    borderRadius: 3,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <KeyIcon sx={{ color: "#7c4dff" }} />
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          Your Local Sealed Bid: {myBid.amount.toString()}{" "}
                          tNIGHT
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Commitment Hash: 0x
                          {myBid.commitmentHashHex.slice(0, 24)}...
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={
                        myBid.revealed
                          ? "Revealed ✅"
                          : auctionPhase === "Commit"
                            ? "Sealed (Hidden)"
                            : auctionPhase === "Reveal"
                              ? "Ready to Reveal"
                              : "Auction Ended"
                      }
                      color={
                        myBid.revealed
                          ? "success"
                          : auctionPhase === "Commit"
                            ? "primary"
                            : auctionPhase === "Reveal"
                              ? "warning"
                              : "success"
                      }
                      size="small"
                    />
                  </Stack>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Phase 1: Commit Bid Form */}
          {auctionPhase === "Commit" && (
            <Card
              sx={{
                mb: 3,
                background: "rgba(19, 25, 41, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(124, 77, 255, 0.2)",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  <LockIcon
                    sx={{ mr: 1, verticalAlign: "middle", color: "#7c4dff" }}
                  />
                  Step 1: Submit Sealed Bid
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Enter your bid amount below. Your amount and salt stay on your
                  local device. Only a ZK commitment hash is written to the
                  ledger.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Bid Amount (tNIGHT)"
                    type="number"
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    variant="outlined"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleCommitBid}
                    disabled={isSubmitting}
                    sx={{
                      minWidth: 180,
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      background: isSubmitting
                        ? "gray"
                        : "linear-gradient(135deg, #7c4dff, #536dfe)",
                    }}
                  >
                    Commit Bid
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Phase 2: Reveal Bid Form */}
          {auctionPhase === "Reveal" && (
            <Card
              sx={{
                mb: 3,
                background: "rgba(19, 25, 41, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 145, 0, 0.2)",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  <VisibilityIcon
                    sx={{ mr: 1, verticalAlign: "middle", color: "#ff9100" }}
                  />
                  Step 2: Reveal Your Bid
                </Typography>
                {myBid?.revealed ? (
                  <Typography
                    variant="body2"
                    sx={{ color: "#00e676", fontWeight: 600 }}
                  >
                    ✅ Your bid has already been revealed on-chain. No further
                    action needed.
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Click below to execute the ZK reveal circuit. If your bid
                      exceeds the current highest bid ({highestBid.toString()}{" "}
                      tNIGHT), it updates the on-chain ledger!
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleRevealBid}
                      disabled={isSubmitting}
                      sx={{
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        background: isSubmitting
                          ? "gray"
                          : "linear-gradient(135deg, #ff9100, #ff6d00)",
                      }}
                    >
                      Reveal My Bid ({myBid ? myBid.amount.toString() : "10"}{" "}
                      tNIGHT)
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Phase 3: Ended View */}
          {auctionPhase === "Ended" && (
            <Card
              sx={{
                mb: 3,
                background: "rgba(19, 25, 41, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0, 230, 118, 0.2)",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ mb: 1, fontWeight: 600, color: "#00e676" }}
                >
                  <CheckCircleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Step 3: Auction Concluded
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
                  Winning Amount: {winningAmount.toString()} tNIGHT
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The auction has ended. The winning bid was verified on-chain,
                  and all un-winning bid amounts were 100% preserved in privacy.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
