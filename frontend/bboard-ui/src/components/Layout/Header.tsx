// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useState, useEffect } from 'react';
import { AppBar, Box, Button, Typography, Chip } from '@mui/material';

/**
 * An application header component for Midnight Bulletin Board with Lace wallet controls.
 */
export const Header: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletName, setWalletName] = useState<string>('');

  const networkId = (import.meta.env.VITE_NETWORK_ID as string) || 'preview';

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.midnight?.mnLace) {
      try {
        const lace = window.midnight.mnLace as unknown as {
          connect: (net: string) => Promise<{ getConnectionStatus: () => Promise<unknown> }>;
        };
        const connected = await lace.connect(networkId);
        const status = await connected.getConnectionStatus();
        setIsConnected(!!status);
        setWalletName('Lace Wallet');
      } catch {
        setIsConnected(false);
      }
    }
  };

  useEffect(() => {
    void checkConnection();
    const interval = setInterval(() => {
      void checkConnection();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (window.midnight?.mnLace) {
      try {
        const lace = window.midnight.mnLace as unknown as { connect: (net: string) => Promise<unknown> };
        await lace.connect(networkId);
        setIsConnected(true);
      } catch (err) {
        console.error('Wallet connection failed:', err);
      }
    } else {
      alert('Midnight Lace wallet extension not detected. Please install Lace extension.');
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    window.location.reload();
  };

  return (
    <AppBar
      position="static"
      data-testid="header"
      sx={{
        backgroundColor: '#0a0a0c',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 6 },
        py: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/midnight-logo.png" alt="Midnight Logo" height={42} />
        <Chip
          label={networkId.toUpperCase()}
          size="small"
          sx={{
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            fontWeight: 600,
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {isConnected ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 2,
                px: 2,
                py: 0.75,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
              <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                {walletName} Connected
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDisconnect}
              sx={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                '&:hover': {
                  borderColor: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                },
              }}
            >
              Disconnect
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="medium"
            onClick={handleConnect}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              },
            }}
          >
            Connect Lace Wallet
          </Button>
        )}
      </Box>
    </AppBar>
  );
};
