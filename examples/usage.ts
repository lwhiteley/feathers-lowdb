import { feathers } from '@feathersjs/feathers';
import { LowDBService } from '../src/index.js'

// Creates an ExpressJS compatible Feathers application
const app = feathers();

app.use('messages', new LowDBService({
  filename: './data/usage.yaml'
}));

// For good measure let's create a message
// So our API doesn't look so empty
app.service('messages').create({
  text: 'Hello world from the server',
});
