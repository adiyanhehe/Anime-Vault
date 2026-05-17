const keys = [
  '8310c4d6935824c084cf75306be5c8c5',
  '4f92d63cc56d0262cd5143315a7cf20f',
  'b63c22a36b1d4c20f1807d91e3e7f4c5',
  'e8e23920efc4f9a0c0a87a718c575086',
  'cbd34e40248c8bfa51af922a946b5a34'
];

async function testKeys() {
  for (const key of keys) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${key}`);
      if (res.status === 200) {
        const data = await res.json();
        console.log(`Key ${key} is WORKING! Movie title: ${data.title}`);
        return;
      } else {
        console.log(`Key ${key} failed with status: ${res.status}`);
      }
    } catch (err) {
      console.log(`Key ${key} error:`, err.message);
    }
  }
}

testKeys();
