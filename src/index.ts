import express from "express"
import {startLoop} from "./arbitrage/arbitrage";

const app = express()
const port = 8080;

// define a route handler for the default home page
app.get( "/", ( _req, res ) => {
  res.send( "Hello world!" );
} );

// start the Express server
app.listen( port, async () => {
  console.log( `server started at http://localhost:${ port }` );
  await startLoop();
} );