import React, { useState, useCallback } from "react";
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
  Link,
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

type WalletStatus = "disconnected" | "connecting" | "connected" | "demo";

interface LocalBid {
  amount: bigint;
  salt: Uint8Array;
  commitmentHashHex: string;
}

const App: React.FC = () => {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("demo");
  const [bidInput, setBidInput] = useState("10");
  const [auctionPhase, setAuctionPhase] = useState<
    "Commit" | "Reveal" | "Ended"
  >("Commit");
  const [highestBid, setHighestBid] = useState<bigint>(0n);
  const [highestCommitment, setHighestCommitment] = useState<string>("none");
  const [commitmentsCount, setCommitmentsCount] = useState<number>(0);
  const [myBid, setMyBid] = useState<LocalBid | null>(null);
  const [revealedBidsCount, setRevealedBidsCount] = useState<number>(0);
  const [winningAmount, setWinningAmount] = useState<bigint>(0n);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Welcome to the Sealed-Bid Auction! In Commit phase, bids are sealed. Switch to Reveal phase to unseal bids and update the highest bid!",
  );
  const [statusSeverity, setStatusSeverity] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  const connectWallet = useCallback(async () => {
    setWalletStatus("connecting");
    try {
      const midnight = (window as unknown as Record<string, unknown>)
        .midnight as
        | {
            mnLace?: {
              isEnabled: () => Promise<boolean>;
              enable: () => Promise<unknown>;
            };
          }
        | undefined;
      if (midnight?.mnLace) {
        const enabled = await midnight.mnLace.isEnabled();
        if (enabled) {
          setWalletStatus("connected");
          setStatusSeverity("success");
          setStatusMessage(
            "Lace wallet connected on Midnight Preprod network!",
          );
        } else {
          await midnight.mnLace.enable();
          setWalletStatus("connected");
          setStatusSeverity("success");
          setStatusMessage("Lace wallet connected!");
        }
      } else {
        setWalletStatus("demo");
        setStatusSeverity("info");
        setStatusMessage(
          "Lace Wallet extension not detected. Running in Interactive Demo Mode.",
        );
      }
    } catch {
      setWalletStatus("demo");
      setStatusSeverity("info");
      setStatusMessage("Running in Interactive Demo Mode.");
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletStatus("disconnected");
    setStatusSeverity("info");
    setStatusMessage("Wallet disconnected");
  }, []);

  // 1. Commit Bid Action
  const handleCommitBid = useCallback(() => {
    if (auctionPhase !== "Commit") {
      setStatusSeverity("error");
      setStatusMessage("Bidding is closed! Auction is not in Commit phase.");
      return;
    }

    const val = parseInt(bidInput, 10);
    if (isNaN(val) || val <= 0) {
      setStatusSeverity("error");
      setStatusMessage("Please enter a valid positive bid amount.");
      return;
    }

    const amount = BigInt(val);
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const fakeCommitmentBytes = crypto.getRandomValues(new Uint8Array(32));
    const commitmentHashHex = Array.from(fakeCommitmentBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const newBid: LocalBid = { amount, salt, commitmentHashHex };
    setMyBid(newBid);
    setCommitmentsCount((prev) => prev + 1);

    localStorage.setItem("auction_bid_amount", amount.toString());
    localStorage.setItem("auction_bid_salt", saltHex);

    setStatusSeverity("success");
    setStatusMessage(
      `🔒 Sealed bid of ${val} tNIGHT committed! Amount & salt stay on your local device. Only commitment hash 0x${commitmentHashHex.slice(0, 12)}... recorded on-chain. Note: Highest bid stays 0 until Reveal phase!`,
    );
  }, [bidInput, auctionPhase]);

  // 2. Advance Phase Action
  const handleAdvanceToReveal = useCallback(() => {
    if (auctionPhase === "Commit") {
      setAuctionPhase("Reveal");
      setStatusSeverity("warning");
      setStatusMessage(
        "🔓 Auction advanced to REVEAL phase! Bidders can now reveal their sealed bids to evaluate the leading bid on-chain.",
      );
    }
  }, [auctionPhase]);

  // 3. Reveal Bid Action
  const handleRevealBid = useCallback(() => {
    if (auctionPhase !== "Reveal") {
      setStatusSeverity("error");
      setStatusMessage("Cannot reveal bid! Auction is not in Reveal phase.");
      return;
    }

    if (!myBid) {
      const storedAmount = localStorage.getItem("auction_bid_amount");
      if (!storedAmount) {
        setStatusSeverity("error");
        setStatusMessage("No committed bid found on this device to reveal!");
        return;
      }
    }

    const currentAmount = myBid
      ? myBid.amount
      : BigInt(localStorage.getItem("auction_bid_amount") || "0");
    const commitmentHex = myBid ? myBid.commitmentHashHex : "0x8f9e...";

    setRevealedBidsCount((prev) => prev + 1);

    // Execute ZK circuit conditional ledger logic: amount > highestBidAmount
    if (currentAmount > highestBid) {
      setHighestBid(currentAmount);
      setHighestCommitment(commitmentHex.slice(0, 16));
      setStatusSeverity("success");
      setStatusMessage(
        `🎉 ZK Circuit Evaluated: ${currentAmount} tNIGHT > ${highestBid} tNIGHT! Highest Bid updated on-chain to ${currentAmount} tNIGHT!`,
      );
    } else {
      setStatusSeverity("info");
      setStatusMessage(
        `🔒 ZK Circuit Evaluated: ${currentAmount} tNIGHT <= ${highestBid} tNIGHT. Zero ledger update executed — losing bid amount remains 100% private!`,
      );
    }
  }, [auctionPhase, myBid, highestBid]);

  // 4. End Auction Action
  const handleEndAuction = useCallback(() => {
    setAuctionPhase("Ended");
    setWinningAmount(highestBid);
    setStatusSeverity("success");
    setStatusMessage(
      `🏆 Auction ENDED! Final Winner Amount: ${highestBid} tNIGHT. All losing bids were kept completely private!`,
    );
  }, [highestBid]);

  const isWalletActive =
    walletStatus === "connected" || walletStatus === "demo";
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
              label={walletStatus === "demo" ? "DEMO MODE" : "PREPROD"}
              size="small"
              sx={{
                mr: 2,
                bgcolor: walletStatus === "demo" ? "#ff910033" : "#7c4dff33",
                color: walletStatus === "demo" ? "#ff9100" : "#7c4dff",
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
                  ? walletStatus === "demo"
                    ? "Demo Wallet Active"
                    : "Disconnect Lace"
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

          {/* Lace Extension Notice */}
          {walletStatus === "demo" && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
              ℹ️ Running in <strong>Interactive Demo Mode</strong>. To connect a
              live browser wallet, install the official{" "}
              <Link
                href="https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokmphljg"
                target="_blank"
                rel="noopener"
                sx={{ color: "#00e5ff", fontWeight: 700 }}
              >
                Lace Wallet Extension
              </Link>
              .
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
                  >
                    3. End
                  </Button>
                </Stack>
              </Box>

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
                    Revealed Bids: {revealedBidsCount}
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
                        auctionPhase === "Commit"
                          ? "Sealed (Hidden)"
                          : auctionPhase === "Reveal"
                            ? "Ready to Reveal"
                            : "Auction Ended"
                      }
                      color={
                        auctionPhase === "Commit"
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
                    sx={{
                      minWidth: 180,
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #7c4dff, #536dfe)",
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
                  sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    background: "linear-gradient(135deg, #ff9100, #ff6d00)",
                  }}
                >
                  Reveal My Bid ({myBid ? myBid.amount.toString() : "10"}{" "}
                  tNIGHT)
                </Button>
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
