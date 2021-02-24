import { Express } from "express";
import { TokenSet, Strategy as OpenIDStrategy, Issuer } from "openid-client";
import passport from "passport";
import config from "./config";

interface OIDCUser extends Express.User {
  sub: string;
  tokenset: TokenSet;
}

interface SerializedUser {
  sub: string;
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: number;
}

function isOIDCUser(user: Express.User): user is OIDCUser {
  return (user as OIDCUser).sub !== undefined;
}

export const setupPassport = async (app: Express) => {
  const issuer = await Issuer.discover(config.oidcDiscoveryUrl);
  const client = new issuer.Client({
    client_id: config.oidcClientId,
    client_secret: config.oidcSecret,
    post_logout_redirect_uris: [`${config.baseUrl}/logged_out`],
  });

  passport.use(
    "oidc",
    new OpenIDStrategy(
      {
        client: client,
        params: {
          scope: "openid",
          redirect_uri: `${config.baseUrl}/login/return`,
        },
      },
      function (tokenset: TokenSet, userinfo: {}, done: Function) {
        return done(null, {
          sub: tokenset.claims().sub,
          tokenset: tokenset,
        });
      }
    )
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, done) {
    if (isOIDCUser(user)) {
      done(null, {
        sub: user.sub,
        id_token: user.tokenset.id_token,
        access_token: user.tokenset.access_token,
        refresh_token: user.tokenset.refresh_token,
        token_type: user.tokenset.token_type,
        expires_at: user.tokenset.expires_at,
      } as SerializedUser);
    } else {
      done(new Error("Not an OIDC user"));
    }
  });

  passport.deserializeUser(function (id: SerializedUser, done) {
    const user = {
      sub: id.sub,
      tokenset: new TokenSet({
        id_token: id.id_token,
        access_token: id.access_token,
        refresh_token: id.refresh_token,
        token_type: id.token_type,
        expires_at: id.expires_at,
      }),
    };
    done(null, user);
  });

  app.post("/login", passport.authenticate("oidc"));
  app.get(
    "/login/return",
    passport.authenticate("oidc", {
      successRedirect: "/",
      failureRedirect: "/login",
    })
  );

  app.post("/logout", (req, res) => {
    if (req.isAuthenticated() && isOIDCUser(req.user)) {
      const logoutUrl = client.endSessionUrl({
        id_token_hint: req.user.tokenset,
      });
      req.session = null;
      res.redirect(logoutUrl);
    } else {
      req.session = null;
      res.redirect("/");
    }
  });

  app.get("/logged_out", (req, res) => {
    res.redirect("/");
  });
};
