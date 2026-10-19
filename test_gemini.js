import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBWcnd0dkt2KzWqS1CoihiHfL0cPoh55N4');

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Halo, apakah kamu aktif?');
    const text = await result.response.text();
    console.log('SUCCESS WITH gemini-2.5-flash:', text);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
