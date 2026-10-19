const rawKey = 'AIzaSyBWcnd0dkt2KzWqS1CoihiHfL0cPoh55N4';

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${rawKey}`);
    const data = await res.json();
    const validGenModels = data.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
    console.log('VALID GENERATION MODELS:', validGenModels);
  } catch (err) {
    console.error(err);
  }
}

listModels();
