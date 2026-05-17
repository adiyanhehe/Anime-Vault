import { searchAnime } from './src/api/anilist.js';

async function findID() {
  try {
    const results = await searchAnime('Classroom of the Elite');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error(err);
  }
}

findID();
