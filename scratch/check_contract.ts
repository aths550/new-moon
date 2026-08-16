const { gql, request } = require('graphql-request');
const query = gql`
  query {
    contract(address: "804b922277534496ea88552b352282a702614d1adaba3f4845037043f7013a51") {
      address
    }
  }
`;

async function main() {
  try {
    const res = await request('https://indexer.preview.midnight.network/api/v4/graphql', query);
    console.log("Preview:", res);
  } catch (e) {
    console.log("Preview error:", e.response ? e.response.errors : e.message);
  }
  
  try {
    const res2 = await request('https://indexer.preview.midnight.network/api/v4/graphql', query);
    console.log("Preview:", res2);
  } catch (e) {
    console.log("Preview error:", e.response ? e.response.errors : e.message);
  }
}
main();
