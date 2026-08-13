import fetch from 'node-fetch';

async function main() {
  const query = `
    query {
      dustGenerations {
        totalCount
        nodes {
          nightUtxo {
            txHash
            outputIndex
          }
          dustAddress
        }
      }
    }
  `;

  const res = await fetch('https://indexer.preprod.midnight.network/api/v4/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  console.log('Dust Generations Result:', JSON.stringify(json, null, 2));
}

main().catch(console.error);
