import 'dotenv/config';
import express from 'express';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { setupPassport } from './auth';
import config from './config';
import path from 'path';

(async () => {
  const app = express();
  const port = 3000;

  app.use(
    cookieSession({
      name: 'session',
      keys: [config.cookieSecret],

      // Cookie Options
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
  );

  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "ejs");

  app.use(express.static(path.join(__dirname, '../public')));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());

  await setupPassport(app);

  app.get('/', (req, res) => {
    res.render("index", {
      isAuthenticated: req.isAuthenticated(),
    });
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
})();
